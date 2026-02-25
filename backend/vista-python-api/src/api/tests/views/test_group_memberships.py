"""Tests for the group membership endpoints."""

from json import dumps
from uuid import uuid4

import pytest

from api.domain.cognito_user import IdpUser
from api.models import FocusArea, Scenario, VisibleAsset
from api.models.asset_type import AssetCategory, AssetSubCategory, AssetType, DataSource
from api.models.group import Group, GroupDataSourceAccess, GroupMembership

http_created = 201
http_no_content = 204
http_bad_request = 400
http_forbidden = 403
http_not_found = 404

idp_user_a = IdpUser(str(uuid4()), "alice@test.com", name="Alice")
idp_user_b = IdpUser(str(uuid4()), "bob@test.com", name="Bob")

admin_uuid = uuid4()


@pytest.fixture
def group(db):  # noqa: ARG001
    """Create a group for testing."""
    group = Group.create(name="Volunteers", created_by=uuid4())
    Group.objects.bulk_create([group])
    return group


@pytest.fixture
def members(db, group):  # noqa: ARG001
    """Create group members for testing."""
    member_one = GroupMembership.create(group.id, idp_user_a.id, uuid4())
    members = [member_one]

    GroupMembership.objects.bulk_create(members)
    return members


def get_user_id_from_request(request):  # noqa: ARG001
    """Mock user ID in request."""
    return admin_uuid


class Administrator:
    """Mock administrator permission."""

    def has_permission(self, request, view):  # noqa: ARG002
        """Return whether user has permission."""
        return False


# --- POST (Create) Tests ---


@pytest.mark.django_db
def test_add_member_to_group_is_successful(group, members, client, monkeypatch):  # noqa: ARG001
    """Test adding a member to a group is successful."""
    monkeypatch.setattr(
        "api.views.group_memberships.get_user_id_from_request", get_user_id_from_request
    )
    response = client.post(
        f"/api/groups/{group.id}/members/",
        data=dumps({"userId": idp_user_b.id}),
        content_type="application/json",
    )

    assert response.status_code == http_created
    data = response.json()
    assert data["createdBy"] == str(admin_uuid)
    assert data["createdAt"] is not None
    assert GroupMembership.objects.filter(group_id=group.id, user_id=idp_user_b.id).exists()


@pytest.mark.django_db
def test_add_existing_member_to_group_is_unsuccessful(group, members, client, monkeypatch):  # noqa: ARG001
    """Test adding an existing member to a group is unsuccessful."""
    monkeypatch.setattr(
        "api.views.group_memberships.get_user_id_from_request", get_user_id_from_request
    )
    response = client.post(
        f"/api/groups/{group.id}/members/",
        data=dumps({"userId": idp_user_a.id}),
        content_type="application/json",
    )

    assert response.status_code == http_bad_request
    assert len(GroupMembership.objects.filter(group_id=group.id, user_id=idp_user_a.id)) == 1


@pytest.mark.django_db
def test_add_group_member_requires_user_id(group, client, monkeypatch):
    """Test that POST without user ID field throws a 400."""
    monkeypatch.setattr(
        "api.views.group_memberships.get_user_id_from_request", get_user_id_from_request
    )
    response = client.post(
        f"/api/groups/{group.id}/members/",
        data=dumps({}),
        content_type="application/json",
    )
    assert response.status_code == http_bad_request
    assert "userId" in response.json()


@pytest.mark.django_db
def test_add_group_member_returns_403_for_general_user(group, client, monkeypatch):
    """Test that POST without privileges throws a 403."""
    monkeypatch.setattr("api.views.group_memberships.Administrator", Administrator)
    response = client.post(
        f"/api/groups/{group.id}/members/",
        data=dumps({"userId": idp_user_b.id}),
        content_type="application/json",
    )
    assert response.status_code == http_forbidden


# --- DELETE Tests ---


@pytest.mark.django_db
def test_remove_member_to_group_is_successful(group, members, client, monkeypatch):  # noqa: ARG001
    """Test removing a member from a group is successful."""
    response = client.delete(
        f"/api/groups/{group.id}/members/{idp_user_a.id}/",
        content_type="application/json",
    )

    assert response.status_code == http_no_content
    assert not GroupMembership.objects.filter(group_id=group.id, user_id=idp_user_a.id).exists()


@pytest.mark.django_db
def test_remove_member_not_in_group_is_unsuccessful(group, members, client, monkeypatch):  # noqa: ARG001
    """Test removing a member not in a group is unsuccessful."""
    response = client.delete(
        f"/api/groups/{group.id}/members/{idp_user_b.id}/",
        content_type="application/json",
    )

    assert response.status_code == http_not_found


@pytest.mark.django_db
def test_remove_group_member_returns_403_for_general_user(group, client, monkeypatch):
    """Test that DELETE without privileges throws a 403."""
    monkeypatch.setattr("api.views.group_memberships.Administrator", Administrator)
    response = client.delete(
        f"/api/groups/{group.id}/members/{idp_user_a.id}/",
        content_type="application/json",
    )
    assert response.status_code == http_forbidden


# --- Visible Asset Cleanup Tests ---


@pytest.mark.django_db
def test_remove_member_cleans_up_stale_visible_assets(group, members, client):  # noqa: ARG001
    """Test that removing a member deletes their VisibleAsset for restricted types."""
    user_id = idp_user_a.id
    scenario = Scenario.objects.create(name="Test", is_active=True)
    focus_area = FocusArea.objects.create(
        scenario=scenario, user_id=user_id, name="Map-wide", is_system=True
    )
    data_source = DataSource.objects.create(name="Restricted", owner="T", description_md="")
    category = AssetCategory.objects.create(name="Infra")
    sub_cat = AssetSubCategory.objects.create(name="Transport", category=category)
    asset_type = AssetType.objects.create(
        name="Rail", sub_category=sub_cat, data_source=data_source
    )
    GroupDataSourceAccess.objects.create(data_source=data_source, group=group, created_by=uuid4())
    VisibleAsset.objects.create(focus_area=focus_area, asset_type=asset_type)

    response = client.delete(
        f"/api/groups/{group.id}/members/{user_id}/",
        content_type="application/json",
    )

    assert response.status_code == http_no_content
    assert not VisibleAsset.objects.filter(focus_area=focus_area, asset_type=asset_type).exists()


@pytest.mark.django_db
def test_remove_member_preserves_visible_assets_for_global_types(group, members, client):  # noqa: ARG001
    """Test that removing a member keeps VisibleAsset for globally available types."""
    user_id = idp_user_a.id
    scenario = Scenario.objects.create(name="Test", is_active=True)
    focus_area = FocusArea.objects.create(
        scenario=scenario, user_id=user_id, name="Map-wide", is_system=True
    )
    global_ds = DataSource.objects.create(name="Global", owner="T", description_md="")
    category = AssetCategory.objects.create(name="Infra")
    sub_cat = AssetSubCategory.objects.create(name="Transport", category=category)
    asset_type = AssetType.objects.create(name="Roads", sub_category=sub_cat, data_source=global_ds)
    VisibleAsset.objects.create(focus_area=focus_area, asset_type=asset_type)

    response = client.delete(
        f"/api/groups/{group.id}/members/{user_id}/",
        content_type="application/json",
    )

    assert response.status_code == http_no_content
    assert VisibleAsset.objects.filter(focus_area=focus_area, asset_type=asset_type).exists()


@pytest.mark.django_db
def test_remove_member_preserves_visible_assets_when_access_via_another_group(
    group,
    members,  # noqa: ARG001
    client,
):
    """Test removing a member preserves VisibleAsset if they retain access via another group."""
    user_id = idp_user_a.id
    scenario = Scenario.objects.create(name="Test", is_active=True)
    focus_area = FocusArea.objects.create(
        scenario=scenario, user_id=user_id, name="Map-wide", is_system=True
    )
    data_source = DataSource.objects.create(name="Restricted", owner="T", description_md="")
    category = AssetCategory.objects.create(name="Infra")
    sub_cat = AssetSubCategory.objects.create(name="Transport", category=category)
    asset_type = AssetType.objects.create(
        name="Rail", sub_category=sub_cat, data_source=data_source
    )
    GroupDataSourceAccess.objects.create(data_source=data_source, group=group, created_by=uuid4())
    other_group = Group.objects.create(name="Other", created_by=uuid4())
    GroupDataSourceAccess.objects.create(
        data_source=data_source, group=other_group, created_by=uuid4()
    )
    GroupMembership.objects.create(group=other_group, user_id=user_id, created_by=uuid4())
    VisibleAsset.objects.create(focus_area=focus_area, asset_type=asset_type)

    response = client.delete(
        f"/api/groups/{group.id}/members/{user_id}/",
        content_type="application/json",
    )

    assert response.status_code == http_no_content
    assert VisibleAsset.objects.filter(focus_area=focus_area, asset_type=asset_type).exists()
