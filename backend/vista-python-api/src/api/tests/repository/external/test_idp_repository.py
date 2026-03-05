# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

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

mock_class_target = "api.repository.external.idp_repository"


@pytest.fixture
def mock_boto_paginator_all():
    """Mock paginator for all users."""
    return MagicMock()


@pytest.fixture
def mock_boto_paginator_admin():
    """Mock paginator for admin users."""
    return MagicMock()


@pytest.fixture
def mock_email_repository():
    """Mock email repository."""
    email_repository_mock = MagicMock()
    email_repository_mock.send_added_email.return_value = None
    return email_repository_mock


def generate_temp_password():
    """Mock temporary password."""
    return "test"


def test_repository_initializes_boto_client():
    """Ensure boto3 client is created with correct arguments."""
    with (
        patch("api.repository.external.idp_repository.boto3.client") as mock_client,
        patch("api.repository.external.idp_repository.EmailRepository") as mock_email_repository,
    ):
        IdpRepository()

        mock_client.assert_called_once_with("cognito-idp", region_name="eu-west-2")
        mock_email_repository.assert_called_once()


class TestListUsersInGroup:
    """Tests for listing users in a group."""

    @pytest.fixture
    def client(self, mock_boto_paginator_all, mock_boto_paginator_admin):
        """Mock boto3 cognito-idp client."""
        mock = MagicMock()
        mock.get_paginator.side_effect = [
            mock_boto_paginator_all,
            mock_boto_paginator_admin,
        ]
        return mock

    @pytest.fixture
    def repository(self, client, mock_email_repository):
        """Create repository with mocked boto3 client."""
        with (
            patch(f"{mock_class_target}.boto3.client", return_value=client),
            patch(f"{mock_class_target}.EmailRepository", return_value=mock_email_repository),
        ):
            return IdpRepository()

    def test_list_users_in_group_calls_cognito_correctly(
        self,
        repository,
        client,  # noqa: ARG002
        mock_boto_paginator_all,
        mock_boto_paginator_admin,
        settings,
    ):
        """Ensure both user and admin groups are queried."""
        settings.IS_PROD = True
        empty_user_response = [{"Users": []}]
        mock_boto_paginator_all.paginate.return_value = empty_user_response
        mock_boto_paginator_admin.paginate.return_value = empty_user_response

        repository.list_users_in_group()

        mock_boto_paginator_all.paginate.assert_called_once_with(
            UserPoolId=user_pool_name,
            GroupName=general_user_group_name,
            PaginationConfig={"PageSize": 60},
        )
        mock_boto_paginator_admin.paginate.assert_called_once_with(
            UserPoolId=user_pool_name,
            GroupName=admin_user_group_name,
            PaginationConfig={"PageSize": 60},
        )

    def test_list_users_in_group_calls_cognito_correctly_multiple_pages(
        self,
        repository,
        client,  # noqa: ARG002
        mock_boto_paginator_all,
        mock_boto_paginator_admin,
        settings,
    ):
        """Ensure both user and admin groups are queried."""
        settings.IS_PROD = True
        users = [{"Username": "user1"}]
        admins = [
            {"Username": "admin1"},
        ]
        mock_boto_paginator_all.paginate.return_value = [{"Users": users}, {"Users": admins}]
        mock_boto_paginator_admin.paginate.return_value = [{"Users": admins}]

        with patch("api.domain.cognito_user.IdpUser.from_cognito") as mock_from_cognito:
            mock_from_cognito.side_effect = lambda user, is_admin: {
                "username": user["Username"],
                "is_admin": is_admin,
            }

            result = repository.list_users_in_group()
            assert len(result) == len(users) + len(admins)

    def test_list_users_in_group_marks_admins_correctly(
        self,
        repository,
        client,  # noqa: ARG002
        mock_boto_paginator_all,
        mock_boto_paginator_admin,
        settings,
    ):
        """Ensure users are marked admin when username is in admin group."""
        settings.IS_PROD = True
        users = [
            {"Username": "user1"},
            {"Username": "admin1"},
        ]
        admins = [
            {"Username": "admin1"},
        ]

        mock_boto_paginator_all.paginate.return_value = [{"Users": users}]
        mock_boto_paginator_admin.paginate.return_value = [{"Users": admins}]

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

    def test_list_users_in_group_returns_empty_list(
        self,
        repository,
        client,  # noqa: ARG002
        mock_boto_paginator_all,
        mock_boto_paginator_admin,
        settings,
    ):
        """Ensure empty Cognito responses return empty list."""
        settings.IS_PROD = True
        empty_user_response = [{"Users": []}]
        mock_boto_paginator_all.paginate.return_value = empty_user_response
        mock_boto_paginator_admin.paginate.return_value = empty_user_response

        with patch("api.domain.cognito_user.IdpUser.from_cognito") as mock_from_cognito:
            result = repository.list_users_in_group()

        assert result == []
        mock_from_cognito.assert_not_called()

    def test_list_users_in_group_returns_mock_users_in_dev_mode(self, settings, repository):
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
            {"username": "00000000-0000-0000-0000-000000000001", "is_admin": False},
        ]


class TestListAllUsers:
    """Tests for listing all users."""

    @pytest.fixture
    def client(self, mock_boto_paginator_all, mock_boto_paginator_admin):
        """Mock boto3 cognito-idp client."""
        mock = MagicMock()
        mock.get_paginator.side_effect = [
            mock_boto_paginator_all,
            mock_boto_paginator_admin,
        ]
        return mock

    @pytest.fixture
    def repository(self, client, mock_email_repository):
        """Create repository with mocked boto3 client."""
        with (
            patch(f"{mock_class_target}.boto3.client", return_value=client),
            patch(f"{mock_class_target}.EmailRepository", return_value=mock_email_repository),
        ):
            return IdpRepository()

    def test_list_all_users_calls_cognito_correctly(
        self,
        repository,
        client,  # noqa: ARG002
        mock_boto_paginator_all,
        mock_boto_paginator_admin,
        settings,
    ):
        """Ensure both user and admin groups are queried."""
        settings.IS_PROD = True
        empty_user_response = [{"Users": []}]
        mock_boto_paginator_all.paginate.return_value = empty_user_response
        mock_boto_paginator_admin.paginate.return_value = empty_user_response

        repository.list_all_users()

        mock_boto_paginator_all.paginate.assert_called_once_with(
            UserPoolId=user_pool_name,
            PaginationConfig={"PageSize": 60},
        )
        mock_boto_paginator_admin.paginate.assert_called_once_with(
            UserPoolId=user_pool_name,
            GroupName=admin_user_group_name,
            PaginationConfig={"PageSize": 60},
        )

    def test_list_all_users_calls_cognito_correctly_multiple_pages(
        self,
        repository,
        client,  # noqa: ARG002
        mock_boto_paginator_all,
        mock_boto_paginator_admin,
        settings,
    ):
        """Ensure both user and admin groups are queried over multiple pages."""
        settings.IS_PROD = True
        users = [{"Username": "user1"}]
        admins = [
            {"Username": "admin1"},
        ]
        mock_boto_paginator_all.paginate.return_value = [{"Users": users}, {"Users": admins}]
        mock_boto_paginator_admin.paginate.return_value = [{"Users": admins}]

        with patch("api.domain.cognito_user.IdpUser.from_cognito") as mock_from_cognito:
            mock_from_cognito.side_effect = lambda user, is_admin: {
                "username": user["Username"],
                "is_admin": is_admin,
            }

            result = repository.list_all_users()
            assert len(result) == len(users) + len(admins)

    def test_list_all_users_marks_admins_correctly(
        self,
        repository,
        client,  # noqa: ARG002
        mock_boto_paginator_all,
        mock_boto_paginator_admin,
        settings,
    ):
        """Ensure users are marked admin when username is in admin group."""
        settings.IS_PROD = True
        users = [
            {"Username": "user1"},
            {"Username": "admin1"},
        ]
        admins = [
            {"Username": "admin1"},
        ]

        mock_boto_paginator_all.paginate.return_value = [{"Users": users}]
        mock_boto_paginator_admin.paginate.return_value = [{"Users": admins}]

        with patch("api.domain.cognito_user.IdpUser.from_cognito") as mock_from_cognito:
            mock_from_cognito.side_effect = lambda user, is_admin: {
                "username": user["Username"],
                "is_admin": is_admin,
            }

            result = repository.list_all_users()

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

    def test_list_all_users_returns_empty_list(
        self,
        repository,
        client,  # noqa: ARG002
        mock_boto_paginator_all,
        mock_boto_paginator_admin,
        settings,
    ):
        """Ensure empty Cognito responses return empty list."""
        settings.IS_PROD = True
        empty_user_response = [{"Users": []}]
        mock_boto_paginator_all.paginate.return_value = empty_user_response
        mock_boto_paginator_admin.paginate.return_value = empty_user_response

        with patch("api.domain.cognito_user.IdpUser.from_cognito") as mock_from_cognito:
            result = repository.list_all_users()

        assert result == []
        mock_from_cognito.assert_not_called()

    def test_list_all_users_returns_mock_users_in_dev_mode(self, settings, repository):
        """In development mode, returns a consistent mock user ID."""
        settings.IS_PROD = False

        with patch("api.domain.cognito_user.IdpUser.from_cognito") as mock_from_cognito:
            mock_from_cognito.side_effect = lambda user, is_admin: {
                "username": user["Username"],
                "is_admin": is_admin,
            }
            result = repository.list_all_users()

        assert result == [
            {"username": "7b225422-5d6a-4b83-9655-4bdbe8443c5f", "is_admin": True},
            {"username": "8fd4bdcb-5823-4c9b-a16d-82b680fdd05e", "is_admin": False},
            {"username": "00000000-0000-0000-0000-000000000001", "is_admin": False},
        ]


class TestGetUserByEmail:
    """Tests for fetching user by email."""

    @pytest.fixture
    def client(self, mock_boto_paginator_admin):
        """Mock boto3 cognito-idp client."""
        mock = MagicMock()
        mock.get_paginator.return_value = mock_boto_paginator_admin
        return mock

    @pytest.fixture
    def repository(self, client, mock_email_repository):
        """Create repository with mocked boto3 client."""
        with (
            patch(f"{mock_class_target}.boto3.client", return_value=client),
            patch(f"{mock_class_target}.EmailRepository", return_value=mock_email_repository),
        ):
            return IdpRepository()

    def test_get_user_by_email_returns_user_successfully(
        self, client, mock_boto_paginator_admin, repository
    ):
        """Check user is successfully returned when queried by email."""
        # mock existence of one user in admin group
        username = uuid4()
        users = [{"Username": username, "Attributes": [{"Name": "email", "Value": "bob@test.com"}]}]
        admins = [{"Username": username}]
        mock_boto_paginator_admin.paginate.return_value = [{"Users": admins}]
        client.list_users.return_value = {"Users": users}

        with patch("api.domain.cognito_user.IdpUser.from_cognito") as mock_from_cognito:
            mock_from_cognito.side_effect = lambda user, is_admin: {
                "username": user["Username"],
                "is_admin": is_admin,
            }
            result = repository.get_user_by_email("bob@test.com")

        assert client.list_users.call_count == 1
        client.list_users.assert_called_with(
            UserPoolId=user_pool_name,
            Filter=f'email = "{"bob@test.com"}"',
            Limit=1,
        )
        assert result["username"] == username
        assert result["is_admin"]

    def test_get_user_by_email_does_not_exist_returns_none(self, client, repository):
        """Check path where user does not exist is handled correctly."""
        # mock existence of one user in admin group
        client.list_users.return_value = {"Users": []}

        result = repository.get_user_by_email("bob@test.com")

        assert client.list_users.call_count == 1
        client.list_users.assert_called_with(
            UserPoolId=user_pool_name,
            Filter=f'email = "{"bob@test.com"}"',
            Limit=1,
        )
        client.list_users_in_group.assert_not_called()
        assert result is None


class TestGetUserById:
    """Tests for fetching user by ID."""

    @pytest.fixture
    def client(self, mock_boto_paginator_admin):
        """Mock boto3 cognito-idp client."""
        mock = MagicMock()
        mock.get_paginator.return_value = mock_boto_paginator_admin
        return mock

    @pytest.fixture
    def repository(self, client, mock_email_repository):
        """Create repository with mocked boto3 client."""
        with (
            patch(f"{mock_class_target}.boto3.client", return_value=client),
            patch(f"{mock_class_target}.EmailRepository", return_value=mock_email_repository),
        ):
            return IdpRepository()

    def test_get_user_by_id_returns_user_successfully(
        self, client, repository, mock_boto_paginator_admin
    ):
        """Check user is successfully returned when queried by id."""
        # mock existence of one user in admin group
        username = uuid4()
        users = [{"Username": username, "Attributes": [{"Name": "email", "Value": "bob@test.com"}]}]
        admins = [{"Username": username}]

        client.list_users.return_value = {"Users": users}
        mock_boto_paginator_admin.paginate.return_value = [{"Users": admins}]

        with patch("api.domain.cognito_user.IdpUser.from_cognito") as mock_from_cognito:
            mock_from_cognito.side_effect = lambda user, is_admin: {
                "username": user["Username"],
                "is_admin": is_admin,
            }
            result = repository.get_user_by_id(str(username))

        assert client.list_users.call_count == 1
        client.list_users.assert_called_with(
            UserPoolId=user_pool_name,
            Filter=f'sub = "{username!s}"',
            Limit=1,
        )
        assert result["username"] == username
        assert result["is_admin"]

    def test_get_user_by_id_does_not_exist_returns_none(self, client, repository):
        """Check path where user does not exist is handled correctly."""
        client.list_users.return_value = {"Users": []}
        user_id = str(uuid4())

        result = repository.get_user_by_id(user_id)

        assert client.list_users.call_count == 1
        client.list_users.assert_called_with(
            UserPoolId=user_pool_name,
            Filter=f'sub = "{user_id}"',
            Limit=1,
        )
        client.list_users_in_group.assert_not_called()
        assert result is None


class TestCreateUser:
    """Tests for user creation."""

    @pytest.fixture
    def client(self, mock_boto_paginator_all, mock_boto_paginator_admin):
        """Mock boto3 cognito-idp client."""
        mock = MagicMock()
        mock.get_paginator.side_effect = [
            mock_boto_paginator_all,
            mock_boto_paginator_admin,
        ]
        return mock

    @pytest.fixture
    def repository(self, client, mock_email_repository):
        """Create repository with mocked boto3 client."""
        with (
            patch(f"{mock_class_target}.boto3.client", return_value=client),
            patch(f"{mock_class_target}.EmailRepository", return_value=mock_email_repository),
        ):
            return IdpRepository()

    def test_create_user_calls_cognito_correctly(
        self,
        settings,
        client,
        mock_email_repository,
        repository,
        monkeypatch,
    ):
        """Ensure user creation SDK methods called correctly."""
        email = "bob@test.com"
        settings.IS_PROD = True
        monkeypatch.setattr(
            "api.repository.external.idp_repository.generate_temp_password", generate_temp_password
        )

        repository.create_user(email, False)

        assert client.admin_create_user.call_count == 1
        client.admin_create_user.assert_called_with(
            UserPoolId=user_pool_name,
            Username=ANY,
            UserAttributes=[{"Name": "email", "Value": email}],
            TemporaryPassword=generate_temp_password(),
        )
        mock_email_repository.send_added_email.assert_not_called()

    def test_create_user_does_not_create_user_if_user_already_exists(
        self,
        settings,
        client,
        mock_email_repository,
        repository,
        monkeypatch,
    ):
        """Ensure user creation SDK methods called correctly."""
        email = "bob@test.com"
        settings.IS_PROD = True
        monkeypatch.setattr(
            "api.repository.external.idp_repository.generate_temp_password", generate_temp_password
        )
        client.list_users.return_value = {
            "Users": [{"Username": str(uuid4()), "UserCreateDate": datetime.now()}]  # noqa: DTZ005
        }
        client.list_users_in_group.return_value = {"Users": []}

        repository.create_user(email, False)

        client.admin_create_user.assert_not_called()
        assert mock_email_repository.send_added_email.call_count == 1

    def test_create_user_adds_user_to_access_group_if_user_already_exists(
        self,
        settings,
        client,
        mock_email_repository,
        repository,
        monkeypatch,
    ):
        """Ensure user creation SDK methods called correctly."""
        email = "bob@test.com"
        settings.IS_PROD = True
        fake_uuid = UUID("12345678-1234-5678-1234-567812345678")
        monkeypatch.setattr(
            "api.repository.external.idp_repository.generate_temp_password", generate_temp_password
        )
        client.list_users.return_value = {
            "Users": [{"Username": str(fake_uuid), "UserCreateDate": datetime.now()}]  # noqa: DTZ005
        }
        client.list_users_in_group.return_value = {"Users": []}
        repository.create_user(email, False)

        assert client.admin_add_user_to_group.call_count == 1
        assert mock_email_repository.send_added_email.call_count == 1
        client.admin_add_user_to_group.assert_called_with(
            UserPoolId=user_pool_name, Username=str(fake_uuid), GroupName=general_user_group_name
        )

    def test_create_general_user_adds_user_to_access_group_only(
        self,
        settings,
        client,
        mock_email_repository,
        repository,
        monkeypatch,
    ):
        """Ensure general user creation adds user to only access group."""
        settings.IS_PROD = True
        username = str(uuid4())
        monkeypatch.setattr(
            "api.repository.external.idp_repository.generate_temp_password", generate_temp_password
        )
        client.admin_create_user.return_value = {"User": {"Username": username}}

        repository.create_user("bob@test.com", False)

        assert client.admin_add_user_to_group.call_count == 1
        mock_email_repository.send_added_email.assert_not_called()
        client.admin_add_user_to_group.assert_called_with(
            UserPoolId=user_pool_name, Username=username, GroupName=general_user_group_name
        )

    def test_create_admin_user_adds_user_to_access_and_admin_groups(
        self,
        settings,
        client,
        mock_email_repository,
        repository,
        monkeypatch,
    ):
        """Ensure admin user creation adds user to access and admin group."""
        settings.IS_PROD = True
        username = str(uuid4())
        monkeypatch.setattr(
            "api.repository.external.idp_repository.generate_temp_password", generate_temp_password
        )
        client.admin_create_user.return_value = {"User": {"Username": username}}

        repository.create_user("bob@test.com", True)

        assert client.admin_add_user_to_group.call_count == 2
        client.admin_add_user_to_group.assert_has_calls(
            [
                call(
                    UserPoolId=user_pool_name,
                    Username=username,
                    GroupName=general_user_group_name,
                ),
                call(UserPoolId=user_pool_name, Username=username, GroupName=admin_user_group_name),
            ]
        )
        mock_email_repository.send_added_email.assert_not_called()

    def test_create_user_in_dev_does_not_call_cognito(self, client, repository):
        """Ensure user creation SDK methods are not called in dev."""
        repository.create_user("bob@test.com", False)

        client.admin_create_user.assert_not_called()


class TestResendUserInvite:
    """Tests for resending user invites."""

    @pytest.fixture
    def client(self, mock_boto_paginator_admin):
        """Mock boto3 cognito-idp client."""
        mock = MagicMock()
        mock.get_paginator.return_value = mock_boto_paginator_admin
        return mock

    @pytest.fixture
    def repository(self, client, mock_email_repository):
        """Create repository with mocked boto3 client."""
        with (
            patch(f"{mock_class_target}.boto3.client", return_value=client),
            patch(f"{mock_class_target}.EmailRepository", return_value=mock_email_repository),
        ):
            return IdpRepository()

    def test_resend_user_invite_calls_cognito_and_email_repository(
        self,
        repository,
        client,
        mock_boto_paginator_admin,
        mock_email_repository,
    ):
        """Test resending an invite fetches user from Cognito and sends email."""
        user_id = str(uuid4())
        email = "bob@test.com"
        users = [{"Username": user_id, "Attributes": [{"Name": "email", "Value": email}]}]
        mock_boto_paginator_admin.paginate.return_value = [{"Users": []}]
        client.list_users.return_value = {"Users": users}

        with patch("api.domain.cognito_user.IdpUser.from_cognito") as mock_from_cognito:
            mock_from_cognito.side_effect = [IdpUser(id=user_id, email=email)]
            repository.resend_user_invite(user_id)

        mock_email_repository.send_added_email.assert_called_once_with(email)


class TestRemoveUser:
    """Tests for user removal."""

    @pytest.fixture
    def client(self, mock_boto_paginator_all, mock_boto_paginator_admin):
        """Mock boto3 cognito-idp client."""
        mock = MagicMock()
        mock.get_paginator.side_effect = [
            mock_boto_paginator_all,
            mock_boto_paginator_admin,
        ]
        return mock

    @pytest.fixture
    def repository(self, client, mock_email_repository):
        """Create repository with mocked boto3 client."""
        with (
            patch(f"{mock_class_target}.boto3.client", return_value=client),
            patch(f"{mock_class_target}.EmailRepository", return_value=mock_email_repository),
        ):
            return IdpRepository()

    def test_remove_user_from_vista_removes_user_from_access_and_admin_groups(
        self, settings, client, repository
    ):
        """Ensure remove user from vista removes user from access and admin group."""
        settings.IS_PROD = True
        username = str(uuid4())

        repository.remove_user_from_vista(username)

        assert client.admin_remove_user_from_group.call_count == 2
        client.admin_remove_user_from_group.assert_has_calls(
            [
                call(
                    UserPoolId=user_pool_name,
                    Username=username,
                    GroupName=general_user_group_name,
                ),
                call(UserPoolId=user_pool_name, Username=username, GroupName=admin_user_group_name),
            ]
        )
