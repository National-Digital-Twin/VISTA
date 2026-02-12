"""A set of tests for the `ApplictionUserViewSet`."""

import json
from datetime import UTC, datetime, timedelta, timezone
from unittest.mock import patch
from uuid import uuid4

import pytest

from api.domain.cognito_user import IdpUser
from api.models.group import Group, GroupMembership
from api.models.user_invite import UserInvite

new_user_uuid = uuid4()

cognito_user = IdpUser(str(new_user_uuid), "test@example.com", name="Bob")
user_a = {
    "id": str(new_user_uuid),
    "email": "test@example.com",
    "name": "John Doe",
    "enabled": True,
    "status": "CONFIRMED",
    "user_since": "2022-02-20",
    "user_type": "Admin",
}

http_ok = 200
http_created = 201
http_no_content = 204
http_bad_request = 400
http_forbidden = 403

admin_uuid = uuid4()


def get_admin_user_id_from_request(request):  # noqa: ARG001
    """Mock admin user ID in request."""
    return admin_uuid


def get_user_id_from_request(request):  # noqa: ARG001
    """Mock general user ID in request."""
    return new_user_uuid


@pytest.fixture
def group(db):  # noqa: ARG001
    """Create a group for testing."""
    return Group.objects.create(name="Volunteers", created_by=uuid4())


@pytest.fixture
def members(db, group):  # noqa: ARG001
    """Create group members for testing."""
    member_one = GroupMembership.create(group.id, cognito_user.id, uuid4())
    members = [member_one]

    GroupMembership.objects.bulk_create(members)
    return members


@pytest.fixture
def user_invites(db):  # noqa: ARG001
    """Create a user invite for testing."""
    user_invites = []
    user_invites.append(
        UserInvite.objects.create(user_id=new_user_uuid, status="pending", created_by=admin_uuid)
    )
    user_invites.append(
        UserInvite.objects.create(user_id=admin_uuid, status="accepted", created_by=admin_uuid)
    )
    return user_invites


@pytest.fixture
def pending_expired_user_invite(db):  # noqa: ARG001
    """Create a pending expired user invite for testing."""
    ten_days_ago = datetime.now(UTC) - timedelta(days=10)
    user_invite = UserInvite.objects.create(
        user_id=new_user_uuid, status="pending", created_by=admin_uuid
    )
    user_invite.created_at = ten_days_ago
    user_invite.save()
    return user_invite


@pytest.fixture
def expired_user_invite(db):  # noqa: ARG001
    """Create an expired user invite for testing."""
    return UserInvite.objects.create(
        user_id=new_user_uuid,
        status="expired",
        expired_at=datetime.now(UTC),
        created_by=admin_uuid,
    )


@pytest.fixture
def accepted_user_invite(db):  # noqa: ARG001
    """Create an accepted user invite for testing."""
    return UserInvite.objects.create(
        user_id=new_user_uuid,
        status="accepted",
        expired_at=datetime.now(UTC),
        created_by=admin_uuid,
    )


user_removed = False


class MockIdpRepository:
    """Mockable IdpRepository class."""

    def __init__(self):
        """Construct an instance of `MockIdpRepository`."""

    def list_users_in_group(self):
        """List a set of users."""
        return [cognito_user]

    def create_user(self, email, is_admin):  # noqa: ARG002
        return new_user_uuid


class Administrator:
    """Mock administrator permission."""

    def has_permission(self, request, view):  # noqa: ARG002
        """Return whether user has permission."""
        return False


# --- GET (List) Tests for active users ---


def test_list_users(client, monkeypatch):
    """Test that the list function works as expected."""
    monkeypatch.setattr("api.views.users.IdpRepository", MockIdpRepository)
    response = client.get("/api/users/")

    assert response.status_code == http_ok
    data = response.json()[0]

    assert data["id"] == cognito_user.id
    assert data["email"] == cognito_user.email
    assert data["name"] == cognito_user.name
    assert data["status"] == cognito_user.status
    assert data["userType"] == cognito_user.user_type


def test_list_users_returns_403_for_general_user(client, monkeypatch):
    """Test that GET returns a 403 if not admin."""
    monkeypatch.setattr("api.views.users.Administrator", Administrator)

    response = client.get("/api/users/")
    assert response.status_code == http_forbidden


# --- GET (List) Tests for pending user invites ---


def test_list_pending_user_invites_returns_successfully(
    client,
    user_invites,
    group,
    members,  # noqa: ARG001
    monkeypatch,
):
    """Test that the list function works as expected."""
    monkeypatch.setattr("api.views.users.IdpRepository", MockIdpRepository)
    response = client.get("/api/users/pending-invites/")
    pending_invite = user_invites[0]

    assert response.status_code == http_ok
    data = response.json()
    assert len(data) == 1
    result = data[0]

    assert result["emailAddress"] == cognito_user.email
    assert result["userType"] == "General"
    assert result["groups"] == [group.name]
    assert result["status"] == "pending"
    assert result["createdAt"] == pending_invite.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ")


def test_list_pending_user_invites_includes_expired_users(client, expired_user_invite, monkeypatch):  # noqa: ARG001
    """Test that the list function works as expected."""
    monkeypatch.setattr("api.views.users.IdpRepository", MockIdpRepository)
    response = client.get("/api/users/pending-invites/")

    assert response.status_code == http_ok
    data = response.json()
    result = data[0]

    assert result["status"] == "expired"


def test_list_pending_user_invites_does_not_include_accepted_invites(
    client,
    accepted_user_invite,  # noqa: ARG001
    monkeypatch,
):
    """Test that the list function works as expected."""
    monkeypatch.setattr("api.views.users.IdpRepository", MockIdpRepository)
    response = client.get("/api/users/pending-invites/")

    assert response.status_code == http_ok
    data = response.json()
    assert len(data) == 0


def test_list_pending_user_invites_handles_no_group_membership(client, user_invites, monkeypatch):  # noqa: ARG001
    """Test that the list function works as expected."""
    monkeypatch.setattr("api.views.users.IdpRepository", MockIdpRepository)
    response = client.get("/api/users/pending-invites/")

    assert response.status_code == http_ok
    data = response.json()
    result = data[0]

    assert result["groups"] == []


def test_list_pending_user_invites_returns_403_for_general_user(client, monkeypatch):
    """Test that GET returns a 403 if not admin."""
    monkeypatch.setattr("api.views.users.Administrator", Administrator)

    response = client.get("/api/users/pending-invites/")
    assert response.status_code == http_forbidden


# --- POST (Create) Tests ---


@pytest.mark.django_db
def test_invite_user_is_successful(client, monkeypatch):
    """Check a user invite calls external repo and saves invite."""
    monkeypatch.setattr("api.views.users.IdpRepository", MockIdpRepository)
    monkeypatch.setattr("api.views.users.get_user_id_from_request", get_admin_user_id_from_request)

    response = client.post(
        "/api/users/",
        data=json.dumps({"email": "bob@test.com", "userType": "general", "groupIds": []}),
        content_type="application/json",
    )

    assert response.status_code == http_created
    data = response.json()
    assert data["userId"] == str(new_user_uuid)

    user_invite = UserInvite.objects.get(user_id=new_user_uuid)
    assert user_invite.status == "pending"
    assert user_invite.created_by == admin_uuid
    assert user_invite.created_at is not None
    assert user_invite.accepted_at is None
    assert user_invite.expired_at is None


@pytest.mark.django_db
def test_invite_user_with_groups_creates_group_memberships(client, group, monkeypatch):
    """Check a user invite creates group membership."""
    monkeypatch.setattr("api.views.users.IdpRepository", MockIdpRepository)
    monkeypatch.setattr("api.views.users.get_user_id_from_request", get_admin_user_id_from_request)

    response = client.post(
        "/api/users/",
        data=json.dumps(
            {"email": "bob@test.com", "userType": "general", "groupIds": [str(group.id)]}
        ),
        content_type="application/json",
    )

    assert response.status_code == http_created
    data = response.json()
    assert data["userId"] == str(new_user_uuid)

    assert GroupMembership.objects.filter(group_id=group.id, user_id=new_user_uuid).exists()


@pytest.mark.django_db
def test_invite_user_already_existing_is_bad_request(client, monkeypatch, user_invites):  # noqa: ARG001
    """Check a duplicate user invite returns bad request."""
    monkeypatch.setattr("api.views.users.IdpRepository", MockIdpRepository)
    monkeypatch.setattr("api.views.users.get_user_id_from_request", get_admin_user_id_from_request)

    response = client.post(
        "/api/users/",
        data=json.dumps({"email": cognito_user.email, "userType": "general", "groupIds": []}),
        content_type="application/json",
    )

    assert response.status_code == http_bad_request


@pytest.mark.django_db
def test_invite_user_request_without_email_address_is_bad_request(client):
    """Test a 400 is returned if no email in request."""
    response = client.post(
        "/api/users/",
        data=json.dumps({"userType": "general", "groupIds": []}),
        content_type="application/json",
    )
    assert response.status_code == http_bad_request
    assert "email" in response.json()


@pytest.mark.django_db
def test_invite_user_request_without_user_type_is_bad_request(client):
    """Test a 400 is returned if no user type in request."""
    response = client.post(
        "/api/users/",
        data=json.dumps({"email": "bob@test.com", "groupIds": []}),
        content_type="application/json",
    )
    assert response.status_code == http_bad_request
    assert "userType" in response.json()


@pytest.mark.django_db
def test_invite_user_request_with_wrong_email_format_is_bad_request(client):
    """Test a 400 is returned if email format is wrong in request."""
    response = client.post(
        "/api/users/",
        data=json.dumps({"email": "bob", "userType": "general", "groupIds": []}),
        content_type="application/json",
    )
    assert response.status_code == http_bad_request
    assert "email" in response.json()


@pytest.mark.django_db
def test_invite_user_request_with_unknown_group_id_is_bad_request(client):
    """Test a 400 is returned if group ID is unknown."""
    group_id = str(uuid4())
    response = client.post(
        "/api/users/",
        data=json.dumps({"email": "bob@test.com", "userType": "general", "groupIds": [group_id]}),
        content_type="application/json",
    )
    data = response.json()
    assert response.status_code == http_bad_request
    assert "groupIds" in data
    assert group_id in data["groupIds"][0]


@pytest.mark.django_db
def test_invite_user_returns_403_for_general_user(client, monkeypatch):
    """Test that POST returns a 403 if not admin."""
    monkeypatch.setattr("api.views.users.Administrator", Administrator)
    response = client.post(
        "/api/users/",
        data=json.dumps({"email": "bob@test.com", "userType": "general", "groupIds": []}),
        content_type="application/json",
    )
    assert response.status_code == http_forbidden


# --- POST (Resolve invite) Tests ---


@pytest.mark.django_db
def test_resolve_invites_successfully_resolves_pending_invite(client, user_invites, monkeypatch):  # noqa: ARG001
    """Check a pending invite for active user is successfully accepted."""
    monkeypatch.setattr("api.views.users.get_user_id_from_request", get_user_id_from_request)
    response = client.post("/api/users/resolve-invites/")

    assert response.status_code == http_ok
    new_user_invite = UserInvite.objects.filter(user_id=new_user_uuid)[0]
    assert new_user_invite.status == "accepted"
    assert new_user_invite.accepted_at is not None
    assert new_user_invite.expired_at is None


@pytest.mark.django_db
def test_resolve_invites_does_not_change_invite_already_accepted(client, user_invites, monkeypatch):
    """Check an accepted invite for active user is not changed."""
    monkeypatch.setattr("api.views.users.get_user_id_from_request", get_admin_user_id_from_request)
    response = client.post("/api/users/resolve-invites/")

    assert response.status_code == http_ok

    fixture_invite = user_invites[1]
    db_user_invite = UserInvite.objects.filter(user_id=admin_uuid)[0]
    assert db_user_invite.status == "accepted"
    assert db_user_invite.accepted_at == fixture_invite.accepted_at
    assert db_user_invite.expired_at is None


@pytest.mark.django_db
def test_resolve_invites_does_not_change_invite_already_expired(
    client, expired_user_invite, monkeypatch
):
    """Check an expired invite for active user is not changed."""
    monkeypatch.setattr("api.views.users.get_user_id_from_request", get_user_id_from_request)
    response = client.post("/api/users/resolve-invites/")

    assert response.status_code == http_ok

    db_user_invite = UserInvite.objects.filter(user_id=new_user_uuid)[0]
    assert db_user_invite.status == "expired"
    assert db_user_invite.expired_at == expired_user_invite.expired_at
    assert db_user_invite.accepted_at is None


@pytest.mark.django_db
def test_resolve_invites_expires_any_pending_invite_over_7_days_and_removes_cognito_group_access(
    client,
    pending_expired_user_invite,  # noqa: ARG001
    monkeypatch,
):
    """Check resolve invites marks any pending expired invites as expired and removes access."""
    monkeypatch.setattr("api.views.users.get_user_id_from_request", get_admin_user_id_from_request)
    with patch("api.views.users.IdpRepository") as mock_idp_repository:
        instance = mock_idp_repository.return_value
        response = client.post("/api/users/resolve-invites/")

        assert response.status_code == http_ok
        instance.remove_user_from_vista.assert_called_once_with(str(new_user_uuid))

    db_user_invite = UserInvite.objects.filter(user_id=new_user_uuid)[0]
    assert db_user_invite.status == "expired"
    assert db_user_invite.expired_at is not None
    assert db_user_invite.accepted_at is None


# --- POST (Resend invite) Tests ---


@pytest.mark.django_db
def test_resend_invite_is_successful(client, user_invites, monkeypatch):  # noqa: ARG001
    """Check resend user invite calls appropriate method in IDP repository."""
    with patch("api.views.users.IdpRepository") as mock_idp_repository:
        instance = mock_idp_repository.return_value
        response = client.post(f"/api/users/{new_user_uuid}/resend-invite/")

        assert response.status_code == http_ok
        instance.resend_user_invite.assert_called_once_with(str(new_user_uuid))


@pytest.mark.django_db
def test_resend_invite_for_unknown_user_returns_4xx(client, user_invites, monkeypatch):  # noqa: ARG001
    """Check resend user invite calls appropriate method in IDP repository."""
    with patch("api.views.users.IdpRepository") as mock_idp_repository:
        instance = mock_idp_repository.return_value
        response = client.post(f"/api/users/{uuid4()}/resend-invite/")

        assert response.status_code == http_bad_request
        instance.resend_user_invite.assert_called_once_with(str(new_user_uuid))


@pytest.mark.django_db
def test_resend_invite_returns_403_for_general_user(client, monkeypatch):
    """Test that POST resend invite returns a 403 if not admin."""
    monkeypatch.setattr("api.views.users.Administrator", Administrator)
    response = client.post(f"/api/users/{new_user_uuid}/resend-invite/")
    assert response.status_code == http_forbidden


# --- DELETE Tests ---


@pytest.mark.django_db
def test_delete_user_is_successful(client, group, members, user_invites):  # noqa: ARG001
    """Test that user can be successfully deleted."""
    with patch("api.views.users.IdpRepository") as mock_idp_repository:
        instance = mock_idp_repository.return_value
        response = client.delete(f"/api/users/{new_user_uuid}/")
        assert response.status_code == http_no_content
        instance.remove_user_from_vista.assert_called_once_with(str(new_user_uuid))
    user_invites_db = UserInvite.objects.filter(user_id=new_user_uuid)
    assert not user_invites_db
    group_memberships_db = GroupMembership.objects.filter(user_id=new_user_uuid)
    assert not group_memberships_db


@pytest.mark.django_db
def test_delete_user_is_successful_without_user_invite_or_groups(client):
    """Test that user can be successfully deleted without an invite or group memberships."""
    with patch("api.views.users.IdpRepository") as mock_idp_repository:
        instance = mock_idp_repository.return_value
        response = client.delete(f"/api/users/{new_user_uuid}/")
        assert response.status_code == http_no_content
        instance.remove_user_from_vista.assert_called_once_with(str(new_user_uuid))


@pytest.mark.django_db
def test_delete_user_returns_403_for_general_user(client, monkeypatch):
    """Test that DELETE returns a 403 if not admin."""
    monkeypatch.setattr("api.views.users.Administrator", Administrator)
    response = client.delete(f"/api/users/{new_user_uuid}/")
    assert response.status_code == http_forbidden
