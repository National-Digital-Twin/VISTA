"""Tests for the IDP repository."""

from datetime import datetime
from unittest.mock import ANY, MagicMock, call, patch
from uuid import UUID, uuid4

import pytest

from api.domain.cognito_user import IdpUser
from api.repository.external.idp_repository import IdpRepository

user_pool_name = "test-pool-id"
general_user_group_name = "users"
admin_user_group_name = "admins"


@pytest.fixture
def mock_boto_client():
    """Mock boto3 cognito-idp client."""
    return MagicMock()


@pytest.fixture
def repository(mock_boto_client):
    """Create repository with mocked boto3 client."""
    with patch(
        "api.repository.external.idp_repository.boto3.client",
        return_value=mock_boto_client,
    ):
        return IdpRepository()


def generate_temp_password():
    """Mock temporary password."""
    return "test"


def test_repository_initializes_boto_client():
    """Ensure boto3 client is created with correct arguments."""
    with patch("api.repository.external.idp_repository.boto3.client") as mock_client:
        IdpRepository()

        mock_client.assert_called_once_with("cognito-idp", region_name="eu-west-2")


def test_list_users_in_group_calls_cognito_correctly(repository, mock_boto_client, settings):
    """Ensure both user and admin groups are queried."""
    settings.IS_PROD = True
    mock_boto_client.list_users_in_group.side_effect = [
        {"Users": []},
        {"Users": []},
    ]

    repository.list_users_in_group()

    assert mock_boto_client.list_users_in_group.call_count == 2
    mock_boto_client.list_users_in_group.assert_has_calls(
        [
            call(UserPoolId=user_pool_name, GroupName=general_user_group_name),
            call(UserPoolId=user_pool_name, GroupName=admin_user_group_name),
        ]
    )


def test_list_users_in_group_marks_admins_correctly(repository, mock_boto_client, settings):
    """Ensure users are marked admin when username is in admin group."""
    settings.IS_PROD = True
    users = [
        {"Username": "user1"},
        {"Username": "admin1"},
    ]
    admins = [
        {"Username": "admin1"},
    ]

    mock_boto_client.list_users_in_group.side_effect = [
        {"Users": users},
        {"Users": admins},
    ]

    with patch("api.domain.cognito_user.IdpUser.from_cognito") as mock_from_cognito:
        mock_from_cognito.side_effect = lambda user, is_admin: {
            "username": user["Username"],
            "is_admin": is_admin,
        }

        result = repository.list_users_in_group()

    assert result == [
        {"username": "user1", "is_admin": False},
        {"username": "admin1", "is_admin": True},
    ]

    mock_from_cognito.assert_has_calls(
        [
            call(users[0], False),
            call(users[1], True),
        ]
    )


def test_list_users_in_group_returns_empty_list(repository, mock_boto_client, settings):
    """Ensure empty Cognito responses return empty list."""
    settings.IS_PROD = True
    mock_boto_client.list_users_in_group.side_effect = [
        {"Users": []},
        {"Users": []},
    ]

    with patch("api.domain.cognito_user.IdpUser.from_cognito") as mock_from_cognito:
        result = repository.list_users_in_group()

    assert result == []
    mock_from_cognito.assert_not_called()


def test_list_users_in_group_returns_mock_users_in_dev_mode(settings, repository):
    """In development mode, returns a consistent mock user ID."""
    settings.IS_PROD = False

    with patch("api.domain.cognito_user.IdpUser.from_cognito") as mock_from_cognito:
        mock_from_cognito.side_effect = lambda user, is_admin: {
            "username": user["Username"],
            "is_admin": is_admin,
        }
        result = repository.list_users_in_group()

    assert result == [
        {"username": "7b225422-5d6a-4b83-9655-4bdbe8443c5f", "is_admin": True},
        {"username": "8fd4bdcb-5823-4c9b-a16d-82b680fdd05e", "is_admin": False},
    ]


def test_get_user_by_email_returns_user_successfully(mock_boto_client, repository):
    """Check user is successfully returned when queried by email."""
    # mock existence of one user in admin group
    username = uuid4()
    users = [{"Username": username, "Attributes": [{"Name": "email", "Value": "bob@test.com"}]}]
    admins = [{"Username": username}]
    mock_boto_client.list_users_in_group.return_value = {"Users": admins}
    mock_boto_client.list_users.return_value = {"Users": users}

    with patch("api.domain.cognito_user.IdpUser.from_cognito") as mock_from_cognito:
        mock_from_cognito.side_effect = lambda user, is_admin: {
            "username": user["Username"],
            "is_admin": is_admin,
        }
        result = repository.get_user_by_email("bob@test.com")

    assert mock_boto_client.list_users.call_count == 1
    mock_boto_client.list_users.assert_called_with(
        UserPoolId=user_pool_name,
        Filter=f'email = "{"bob@test.com"}"',
        Limit=1,
    )
    assert result["username"] == username
    assert result["is_admin"]


def test_get_user_by_email_does_not_exist_returns_none(mock_boto_client, repository):
    """Check path where user does not exist is handled correctly."""
    # mock existence of one user in admin group
    mock_boto_client.list_users.return_value = {"Users": []}

    result = repository.get_user_by_email("bob@test.com")

    assert mock_boto_client.list_users.call_count == 1
    mock_boto_client.list_users.assert_called_with(
        UserPoolId=user_pool_name,
        Filter=f'email = "{"bob@test.com"}"',
        Limit=1,
    )
    mock_boto_client.list_users_in_group.assert_not_called()
    assert result is None


def test_create_user_calls_cognito_correctly(settings, mock_boto_client, repository, monkeypatch):
    """Ensure user creation SDK methods called correctly."""
    email = "bob@test.com"
    settings.IS_PROD = True
    monkeypatch.setattr(
        "api.repository.external.idp_repository.generate_temp_password", generate_temp_password
    )

    repository.create_user(email, False)

    assert mock_boto_client.admin_create_user.call_count == 1
    mock_boto_client.admin_create_user.assert_called_with(
        UserPoolId=user_pool_name,
        Username=ANY,
        UserAttributes=[{"Name": "email", "Value": email}],
        TemporaryPassword=generate_temp_password(),
    )


def test_create_user_does_not_create_user_if_user_already_exists(
    settings, mock_boto_client, repository, monkeypatch
):
    """Ensure user creation SDK methods called correctly."""
    email = "bob@test.com"
    settings.IS_PROD = True
    monkeypatch.setattr(
        "api.repository.external.idp_repository.generate_temp_password", generate_temp_password
    )
    mock_boto_client.list_users.return_value = {
        "Users": [{"Username": str(uuid4()), "UserCreateDate": datetime.now()}]  # noqa: DTZ005
    }
    mock_boto_client.list_users_in_group.return_value = {"Users": []}

    repository.create_user(email, False)

    assert mock_boto_client.admin_create_user.call_count == 0
    mock_boto_client.admin_create_user.assert_not_called()


def test_create_user_adds_user_to_access_group_if_user_already_exists(
    settings, mock_boto_client, repository, monkeypatch
):
    """Ensure user creation SDK methods called correctly."""
    email = "bob@test.com"
    settings.IS_PROD = True
    fake_uuid = UUID("12345678-1234-5678-1234-567812345678")
    monkeypatch.setattr(
        "api.repository.external.idp_repository.generate_temp_password", generate_temp_password
    )
    mock_boto_client.list_users.return_value = {
        "Users": [{"Username": str(fake_uuid), "UserCreateDate": datetime.now()}]  # noqa: DTZ005
    }
    mock_boto_client.list_users_in_group.return_value = {"Users": []}
    repository.create_user(email, False)

    assert mock_boto_client.admin_add_user_to_group.call_count == 1
    mock_boto_client.admin_add_user_to_group.assert_called_with(
        UserPoolId=user_pool_name, Username=str(fake_uuid), GroupName=general_user_group_name
    )


def test_create_general_user_adds_user_to_access_group_only(
    settings, mock_boto_client, repository, monkeypatch
):
    """Ensure general user creation adds user to only access group."""
    settings.IS_PROD = True
    username = str(uuid4())
    monkeypatch.setattr(
        "api.repository.external.idp_repository.generate_temp_password", generate_temp_password
    )
    mock_boto_client.admin_create_user.return_value = {"User": {"Username": username}}

    repository.create_user("bob@test.com", False)

    assert mock_boto_client.admin_add_user_to_group.call_count == 1
    mock_boto_client.admin_add_user_to_group.assert_called_with(
        UserPoolId=user_pool_name, Username=username, GroupName=general_user_group_name
    )


def test_create_admin_user_adds_user_to_access_and_admin_groups(
    settings, mock_boto_client, repository, monkeypatch
):
    """Ensure admin user creation adds user to access and admin group."""
    settings.IS_PROD = True
    username = str(uuid4())
    monkeypatch.setattr(
        "api.repository.external.idp_repository.generate_temp_password", generate_temp_password
    )
    mock_boto_client.admin_create_user.return_value = {"User": {"Username": username}}

    repository.create_user("bob@test.com", True)

    assert mock_boto_client.admin_add_user_to_group.call_count == 2
    mock_boto_client.admin_add_user_to_group.assert_has_calls(
        [
            call(
                UserPoolId=user_pool_name,
                Username=username,
                GroupName=general_user_group_name,
            ),
            call(UserPoolId=user_pool_name, Username=username, GroupName=admin_user_group_name),
        ]
    )


def test_create_user_in_dev_does_not_call_cognito(mock_boto_client, repository):
    """Ensure user creation SDK methods are not called in dev."""
    repository.create_user("bob@test.com", False)

    mock_boto_client.admin_create_user.assert_not_called()


def test_remove_user_from_vista_removes_user_from_access_and_admin_groups(
    settings, mock_boto_client, repository
):
    """Ensure remove user from vista removes user from access and admin group."""
    settings.IS_PROD = True
    username = str(uuid4())

    repository.remove_user_from_vista(username)

    assert mock_boto_client.admin_remove_user_from_group.call_count == 2
    mock_boto_client.admin_remove_user_from_group.assert_has_calls(
        [
            call(
                UserPoolId=user_pool_name,
                Username=username,
                GroupName=general_user_group_name,
            ),
            call(UserPoolId=user_pool_name, Username=username, GroupName=admin_user_group_name),
        ]
    )
