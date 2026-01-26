"""Tests for the groups endpoints."""

import json
from uuid import uuid4

import pytest

from api.domain.cognito_user import IdpUser
from api.models.group import Group, GroupMembership

http_success_code = 200
http_created = 201
http_no_content = 204
http_bad_request = 400
http_forbidden = 403
http_not_found = 404
email = "test@test.com"

cognito_one = IdpUser(str(uuid4()), email, name="Alice")
cognito_two = IdpUser(str(uuid4()), email, name="Bob")
cognito_three = IdpUser(str(uuid4()), email, name="Charlotte")

admin_uuid = uuid4()

cognito_users = [cognito_one, cognito_two, cognito_three]


@pytest.fixture
def group(db):  # noqa: ARG001
    """Create a group for testing."""
    group = Group.create(name="Volunteers", created_by=uuid4())
    Group.objects.bulk_create([group])
    return group


@pytest.fixture
def group_no_members(db):  # noqa: ARG001
    """Create a group for testing."""
    group = Group.create(name="Empty", created_by=uuid4())
    Group.objects.bulk_create([group])
    return group


@pytest.fixture
def members(db, group):  # noqa: ARG001
    """Create group members for testing."""
    member_one = GroupMembership.create(group, cognito_one.id, uuid4())
    member_two = GroupMembership.create(group, cognito_two.id, uuid4())
    members = [member_one, member_two]

    GroupMembership.objects.bulk_create(members)
    return members


class MockIdpRepository:
    """Mockable IdpRepository class."""

    def __init__(self):
        """Construct an instance of `MockIdpRepository`."""

    def list_users_in_group(self):
        """List a set of users."""
        return cognito_users


class Administrator:
    """Mock administrator permission."""

    def has_permission(self, request, view):  # noqa: ARG002
        """Return whether user has permission."""
        return False


def get_user_id_from_request(request):  # noqa: ARG001
    """Mock user ID in request."""
    return admin_uuid


# --- GET (List) Tests ---


@pytest.mark.django_db
def test_list_groups(group, members, group_no_members, client, monkeypatch):  # noqa: ARG001
    """Test that GET returns a list of groups as expected."""
    monkeypatch.setattr("api.views.groups.IdpRepository", MockIdpRepository)

    response = client.get("/api/groups/")
    data = response.json()

    assert response.status_code == http_success_code
    assert len(data) == 2
    result = data[0]

    assert result["name"] == group.name
    assert [member["name"] for member in result["members"]] == _fetch_member_names(
        _get_member_id_list(members)
    )


@pytest.mark.django_db
def test_list_groups_ordered_by_created_at(group, group_no_members, client, monkeypatch):
    """Test that GET returns groups ordered by their created date."""
    monkeypatch.setattr("api.views.groups.IdpRepository", MockIdpRepository)

    response = client.get("/api/groups/")
    data = response.json()

    assert response.status_code == http_success_code
    assert data[0]["name"] == group.name
    assert data[1]["name"] == group_no_members.name


@pytest.mark.django_db
def test_list_groups_returns_empty_if_no_groups(client, monkeypatch):
    """Test that GET returns an empty list as expected."""
    monkeypatch.setattr("api.views.groups.IdpRepository", MockIdpRepository)

    response = client.get("/api/groups/")
    data = response.json()

    assert response.status_code == http_success_code
    assert len(data) == 0


@pytest.mark.django_db
def test_list_groups_returns_403_for_general_user(client, monkeypatch):
    """Test that GET returns a 403 if not admin."""
    monkeypatch.setattr("api.views.groups.Administrator", Administrator)

    response = client.get("/api/groups/")
    assert response.status_code == http_forbidden


# --- GET (Retrieve) Tests ---


@pytest.mark.django_db
def test_fetch_group_returns_group_and_members(group, members, client, monkeypatch):
    """Test that GET returns group with ID, name and members."""
    monkeypatch.setattr("api.views.groups.IdpRepository", MockIdpRepository)

    response = client.get(f"/api/groups/{group.id}/")
    assert response.status_code == http_success_code
    data = response.json()

    assert data["id"] == str(group.id)
    assert data["name"] == group.name
    assert [member["name"] for member in data["members"]] == _fetch_member_names(
        _get_member_id_list(members)
    )


@pytest.mark.django_db
def test_fetch_group_returns_403_for_general_user(group, members, client, monkeypatch):  # noqa: ARG001
    """Test that GET returns a 403 if not admin."""
    monkeypatch.setattr("api.views.groups.Administrator", Administrator)

    response = client.get(f"/api/groups/{group.id}/")
    assert response.status_code == http_forbidden


# --- POST (Create) Tests ---


@pytest.mark.django_db
def test_create_group_is_successful(client, monkeypatch):
    """Test that POST with expected fields creates a group successfully."""
    monkeypatch.setattr("api.views.groups.IdpRepository", MockIdpRepository)
    monkeypatch.setattr("api.views.groups.get_user_id_from_request", get_user_id_from_request)
    group_name = "Volunteers"
    members = [cognito_one.id]
    response = client.post(
        "/api/groups/",
        data=json.dumps({"name": group_name, "memberIds": members}),
        content_type="application/json",
    )

    assert response.status_code == http_created
    data = response.json()
    assert data["name"] == group_name
    assert [member["name"] for member in data["members"]] == _fetch_member_names(members)

    group = Group.objects.get(id=data["id"])
    assert group.created_by == admin_uuid
    for member_id in members:
        member = GroupMembership.objects.get(group=data["id"], user_id=member_id)
        assert member.created_by == admin_uuid


@pytest.mark.django_db
def test_create_group_without_other_members_is_successful(client, monkeypatch):
    """Test that POST without populated list of members creates a group successfully."""
    monkeypatch.setattr("api.views.groups.IdpRepository", MockIdpRepository)
    monkeypatch.setattr("api.views.groups.get_user_id_from_request", get_user_id_from_request)
    response = client.post(
        "/api/groups/",
        data=json.dumps({"name": "Lone admin", "memberIds": []}),
        content_type="application/json",
    )

    assert response.status_code == http_created
    data = response.json()
    assert len(data["members"]) == 0

    group = Group.objects.get(id=data["id"])
    assert group.created_by == admin_uuid


@pytest.mark.django_db
def test_create_group_requires_name(client, monkeypatch):
    """Test that POST without name field throws a 400."""
    monkeypatch.setattr("api.views.groups.IdpRepository", MockIdpRepository)
    monkeypatch.setattr("api.views.groups.get_user_id_from_request", get_user_id_from_request)
    response = client.post(
        "/api/groups/",
        data=json.dumps({"memberIds": [cognito_one.id]}),
        content_type="application/json",
    )
    assert response.status_code == http_bad_request
    assert "name" in response.json()


@pytest.mark.django_db
def test_create_group_requires_member_ids(client, monkeypatch):
    """Test that POST without member IDs field throws a 400."""
    monkeypatch.setattr("api.views.groups.IdpRepository", MockIdpRepository)
    monkeypatch.setattr("api.views.groups.get_user_id_from_request", get_user_id_from_request)
    response = client.post(
        "/api/groups/",
        data=json.dumps(
            {
                "name": "No members",
            }
        ),
        content_type="application/json",
    )
    assert response.status_code == http_bad_request
    assert "memberIds" in response.json()


@pytest.mark.django_db
def test_create_group_returns_403_for_general_user(client, monkeypatch):
    """Test that POST without privileges throws a 403."""
    monkeypatch.setattr("api.views.groups.Administrator", Administrator)
    response = client.post(
        "/api/groups/",
        data=json.dumps({"name": "Forbidden", "memberIds": [cognito_one.id]}),
        content_type="application/json",
    )
    assert response.status_code == http_forbidden


def _get_member_id_list(members):
    return [member.user_id for member in members]


def _fetch_member_names(member_ids):
    expected_names = []
    for member_id in member_ids:
        expected_names.extend(
            [cognito_user.name for cognito_user in cognito_users if cognito_user.id == member_id]
        )
    return expected_names
