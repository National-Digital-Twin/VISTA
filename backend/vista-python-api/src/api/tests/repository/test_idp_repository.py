"""Tests for the IDP repository."""

from unittest.mock import MagicMock, call, patch

import pytest

from api.repository.external.idp_repository import IdpRepository


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


def test_repository_initializes_boto_client():
    """Ensure boto3 client is created with correct arguments."""
    with patch("api.repository.external.idp_repository.boto3.client") as mock_client:
        IdpRepository()

        mock_client.assert_called_once_with("cognito-idp", region_name="eu-west-2")


def test_list_users_in_group_calls_cognito_correctly(repository, mock_boto_client):
    """Ensure both user and admin groups are queried."""
    mock_boto_client.list_users_in_group.side_effect = [
        {"Users": []},
        {"Users": []},
    ]

    repository.list_users_in_group()

    assert mock_boto_client.list_users_in_group.call_count == 2
    mock_boto_client.list_users_in_group.assert_has_calls(
        [
            call(UserPoolId="test-pool-id", GroupName="users"),
            call(UserPoolId="test-pool-id", GroupName="admins"),
        ]
    )


def test_list_users_in_group_marks_admins_correctly(repository, mock_boto_client):
    """Ensure users are marked admin when username is in admin group."""
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


def test_list_users_in_group_returns_empty_list(repository, mock_boto_client):
    """Ensure empty Cognito responses return empty list."""
    mock_boto_client.list_users_in_group.side_effect = [
        {"Users": []},
        {"Users": []},
    ]

    with patch("api.domain.cognito_user.IdpUser.from_cognito") as mock_from_cognito:
        result = repository.list_users_in_group()

    assert result == []
    mock_from_cognito.assert_not_called()


def test_returns_mock_users_in_dev_mode(settings, repository):
    """In development mode, returns a consistent mock user ID."""
    settings.IS_PROD = False

    with patch("api.domain.cognito_user.IdpUser.from_cognito") as mock_from_cognito:
        mock_from_cognito.side_effect = lambda user, is_admin: {
            "username": user["Username"],
            "is_admin": is_admin,
        }
        result = repository.list_users_in_group()

    assert result == [
        {"username": "local.user", "is_admin": True},
        {"username": "local.user2", "is_admin": True},
    ]
