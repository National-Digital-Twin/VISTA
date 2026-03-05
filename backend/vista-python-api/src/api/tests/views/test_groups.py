# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Tests for the groups endpoints."""

import json
from uuid import uuid4

import pytest

from api.domain.cognito_user import IdpUser
from api.models import FocusArea, Scenario, VisibleAsset
from api.models.asset_type import AssetCategory, AssetSubCategory, AssetType, DataSource
from api.models.group import Group, GroupDataSourceAccess, GroupMembership

http_ok = 200
http_created = 201
http_no_content = 204
http_bad_request = 400
http_forbidden = 403
http_not_found = 404
email = "test@test.com"


admin_uuid = uuid4()
cognito_one = IdpUser(str(uuid4()), email, name="Alice")
cognito_two = IdpUser(str(uuid4()), email, name="Bob")
cognito_admin = IdpUser(str(admin_uuid), email, name="Charlotte")

cognito_users = [cognito_one, cognito_two, cognito_admin]


@pytest.fixture
def group(db):  # noqa: ARG001
    """Create a group for testing."""
    group = Group.create(name="Volunteers", created_by=admin_uuid)
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
    member_one = GroupMembership.create(group.id, cognito_one.id, uuid4())
    member_two = GroupMembership.create(group.id, cognito_two.id, uuid4())
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


class MockEmptyIdpRepository:
    """Mockable IdpRepository class."""

    def __init__(self):
        """Construct an instance of `MockIdpRepository`."""

    def list_users_in_group(self):
        """List a set of users."""
        return []


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

    assert response.status_code == http_ok
    assert len(data) == 2
    result = data[0]

    assert result["name"] == group.name
    assert result["createdAt"] is not None
    assert result["createdBy"] == cognito_admin.name

    assert [member["name"] for member in result["members"]] == _fetch_member_names(
        _get_member_id_list(members)
    )


@pytest.mark.django_db
def test_list_groups_returns_unknown_user_if_created_by_deleted(group, client, monkeypatch):  # noqa: ARG001
    """Test that GET returns unknown user for created by if user has been deleted."""
    monkeypatch.setattr("api.views.groups.IdpRepository", MockEmptyIdpRepository)

    response = client.get("/api/groups/")
    data = response.json()

    assert response.status_code == http_ok
    result = data[0]
    assert result["createdBy"] == "Unknown user"


@pytest.mark.django_db
def test_list_groups_ordered_by_created_at(group, group_no_members, client, monkeypatch):
    """Test that GET returns groups ordered by their created date."""
    monkeypatch.setattr("api.views.groups.IdpRepository", MockIdpRepository)

    response = client.get("/api/groups/")
    data = response.json()

    assert response.status_code == http_ok
    assert data[0]["name"] == group.name
    assert data[1]["name"] == group_no_members.name


@pytest.mark.django_db
def test_list_groups_returns_empty_if_no_groups(client, monkeypatch):
    """Test that GET returns an empty list as expected."""
    monkeypatch.setattr("api.views.groups.IdpRepository", MockIdpRepository)

    response = client.get("/api/groups/")
    data = response.json()

    assert response.status_code == http_ok
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
    assert response.status_code == http_ok
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
    assert group.created_at is not None
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


# --- PUT (rename) Tests ---


@pytest.mark.django_db
def test_update_group_is_successful(client, group):
    """Test that PUT with expected fields renames a group successfully."""
    new_group_name = "New_Volunteers"
    response = client.put(
        f"/api/groups/{group.id}/",
        data=json.dumps({"name": new_group_name}),
        content_type="application/json",
    )

    assert response.status_code == http_ok
    data = response.json()
    assert data["name"] == new_group_name

    group = Group.objects.get(id=data["id"])
    assert group.created_by == admin_uuid
    assert group.created_at is not None


@pytest.mark.django_db
def test_update_group_requires_name(client, group):
    """Test that POST without name field throws a 400."""
    response = client.put(
        f"/api/groups/{group.id}/",
        data=json.dumps({}),
        content_type="application/json",
    )
    assert response.status_code == http_bad_request
    assert "name" in response.json()


@pytest.mark.django_db
def test_update_group_returns_403_for_general_user(client, group, monkeypatch):
    """Test that POST without privileges throws a 403."""
    monkeypatch.setattr("api.views.groups.Administrator", Administrator)
    response = client.put(
        f"/api/groups/{group.id}/",
        data=json.dumps({"name": "test"}),
        content_type="application/json",
    )
    assert response.status_code == http_forbidden


# --- DELETE Tests ---


@pytest.mark.django_db
def test_delete_group_is_successful(group, client):
    """Test that DELETE returns a 204."""
    response = client.delete(
        f"/api/groups/{group.id}/",
        content_type="application/json",
    )
    assert response.status_code == http_no_content
    assert not Group.objects.filter(id=group.id).exists()


@pytest.mark.django_db
def test_delete_group_deletes_memberships(group, members, client):  # noqa: ARG001
    """Test that DELETE returns a 204."""
    response = client.delete(
        f"/api/groups/{group.id}/",
        content_type="application/json",
    )
    assert response.status_code == http_no_content
    assert not GroupMembership.objects.filter(group_id=group.id).exists()


@pytest.mark.django_db
def test_delete_unknown_group_returns_404(client):
    """Test that DELETE for unknown group returns a 404."""
    response = client.delete(
        f"/api/groups/{uuid4()}/",
        content_type="application/json",
    )
    assert response.status_code == http_not_found


@pytest.mark.django_db
def test_delete_group_returns_403_for_general_user(group, client, monkeypatch):
    """Test that DELETE without privileges throws a 403."""
    monkeypatch.setattr("api.views.groups.Administrator", Administrator)
    response = client.delete(
        f"/api/groups/{group.id}/",
        content_type="application/json",
    )
    assert response.status_code == http_forbidden
    assert Group.objects.filter(id=group.id).exists()


@pytest.mark.django_db
def test_delete_group_cleans_up_stale_visible_assets(group, members, client):
    """Test that deleting a group cleans up VisibleAsset for all former members."""
    scenario = Scenario.objects.create(name="Test", is_active=True)
    data_source = DataSource.objects.create(name="Restricted", owner="T", description_md="")
    category = AssetCategory.objects.create(name="Infra")
    sub_cat = AssetSubCategory.objects.create(name="Transport", category=category)
    asset_type = AssetType.objects.create(
        name="Rail", sub_category=sub_cat, data_source=data_source
    )
    # Two groups have access — deleting one keeps data source restricted
    other_group = Group.objects.create(name="Other", created_by=uuid4())
    GroupDataSourceAccess.objects.create(data_source=data_source, group=group, created_by=uuid4())
    GroupDataSourceAccess.objects.create(
        data_source=data_source, group=other_group, created_by=uuid4()
    )

    visible_assets = []
    for member in members:
        fa = FocusArea.objects.create(
            scenario=scenario, user_id=member.user_id, name="Map-wide", is_system=True
        )
        va = VisibleAsset.objects.create(focus_area=fa, asset_type=asset_type)
        visible_assets.append(va)

    response = client.delete(
        f"/api/groups/{group.id}/",
        content_type="application/json",
    )

    assert response.status_code == http_no_content
    for va in visible_assets:
        assert not VisibleAsset.objects.filter(id=va.id).exists()


@pytest.mark.django_db
def test_delete_group_preserves_visible_assets_when_member_in_another_group(group, members, client):
    """Test deleting a group preserves VisibleAsset when member has access via another group."""
    scenario = Scenario.objects.create(name="Test", is_active=True)
    data_source = DataSource.objects.create(name="Restricted", owner="T", description_md="")
    category = AssetCategory.objects.create(name="Infra")
    sub_cat = AssetSubCategory.objects.create(name="Transport", category=category)
    asset_type = AssetType.objects.create(
        name="Rail", sub_category=sub_cat, data_source=data_source
    )
    other_group = Group.objects.create(name="Other", created_by=uuid4())
    GroupDataSourceAccess.objects.create(data_source=data_source, group=group, created_by=uuid4())
    GroupDataSourceAccess.objects.create(
        data_source=data_source, group=other_group, created_by=uuid4()
    )

    # Add first member to other_group so they retain access
    member_with_access = members[0]
    member_without_access = members[1]
    GroupMembership.objects.create(
        group=other_group, user_id=member_with_access.user_id, created_by=uuid4()
    )

    fa_with = FocusArea.objects.create(
        scenario=scenario, user_id=member_with_access.user_id, name="FA With", is_system=True
    )
    fa_without = FocusArea.objects.create(
        scenario=scenario, user_id=member_without_access.user_id, name="FA Without", is_system=True
    )
    va_with = VisibleAsset.objects.create(focus_area=fa_with, asset_type=asset_type)
    va_without = VisibleAsset.objects.create(focus_area=fa_without, asset_type=asset_type)

    response = client.delete(
        f"/api/groups/{group.id}/",
        content_type="application/json",
    )

    assert response.status_code == http_no_content
    # Member with access via other_group should be preserved
    assert VisibleAsset.objects.filter(id=va_with.id).exists()
    # Member without access via other_group should be cleaned up
    assert not VisibleAsset.objects.filter(id=va_without.id).exists()


def _get_member_id_list(members):
    return [member.user_id for member in members]


def _fetch_member_names(member_ids):
    expected_names = []
    for member_id in member_ids:
        expected_names.extend(
            [cognito_user.name for cognito_user in cognito_users if cognito_user.id == member_id]
        )
    return expected_names
