"""A set of tests for the `ApplictionUserViewSet`."""

import json
from uuid import uuid4

import pytest

from api.models.group import Group, GroupMembership
from api.models.user_invite import UserInvite

user_a = {
    "id": "abc",
    "email": "test@example.com",
    "name": "John Doe",
    "enabled": True,
    "status": "CONFIRMED",
    "user_since": "2022-02-20",
    "user_type": "Admin",
}

http_ok = 200
http_created = 201
http_bad_request = 400
http_forbidden = 403

new_user_uuid = uuid4()
admin_uuid = uuid4()


def get_user_id_from_request(request):  # noqa: ARG001
    """Mock user ID in request."""
    return admin_uuid


@pytest.fixture
def group(db):  # noqa: ARG001
    """Create a group for testing."""
    return Group.objects.create(name="Volunteers", created_by=uuid4())


class MockIdpRepository:
    """Mockable IdpRepository class."""

    def __init__(self):
        """Construct an instance of `MockIdpRepository`."""

    def list_users_in_group(self):
        """List a set of users."""
        return [user_a]

    def create_user(self, email, is_admin):  # noqa: ARG002
        return new_user_uuid


class Administrator:
    """Mock administrator permission."""

    def has_permission(self, request, view):  # noqa: ARG002
        """Return whether user has permission."""
        return False


# --- GET (List) Tests ---


def test_list_users(client, monkeypatch):
    """Test that the list function works as expected."""
    monkeypatch.setattr("api.views.users.IdpRepository", MockIdpRepository)
    response = client.get("/api/users/")

    assert response.status_code == http_ok
    assert response.data == [user_a]


def test_list_users_returns_403_for_general_user(client, monkeypatch):
    """Test that GET returns a 403 if not admin."""
    monkeypatch.setattr("api.views.users.Administrator", Administrator)

    response = client.get("/api/users/")
    assert response.status_code == http_forbidden


# --- POST (Create) Tests ---


@pytest.mark.django_db
def test_invite_user_is_successful(client, monkeypatch):
    """Check a user invite calls external repo and saves invite."""
    monkeypatch.setattr("api.views.users.IdpRepository", MockIdpRepository)
    monkeypatch.setattr("api.views.users.get_user_id_from_request", get_user_id_from_request)

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
    assert user_invite.expires_at is None


@pytest.mark.django_db
def test_invite_user_with_groups_creates_group_memberships(client, group, monkeypatch):
    """Check a user invite creates group membership."""
    monkeypatch.setattr("api.views.users.IdpRepository", MockIdpRepository)
    monkeypatch.setattr("api.views.users.get_user_id_from_request", get_user_id_from_request)

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
