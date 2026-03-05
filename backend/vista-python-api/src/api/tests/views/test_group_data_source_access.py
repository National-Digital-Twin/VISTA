# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Tests for the group data source access endpoints with visible asset cleanup."""

from json import dumps
from uuid import uuid4

import pytest

from api.models import FocusArea, Scenario, VisibleAsset
from api.models.asset_type import AssetCategory, AssetSubCategory, AssetType, DataSource
from api.models.group import Group, GroupDataSourceAccess, GroupMembership

http_created = 201
http_no_content = 204

admin_uuid = uuid4()


def get_user_id_from_request(request):  # noqa: ARG001
    """Mock user ID in request."""
    return admin_uuid


@pytest.fixture
def scenario(db):  # noqa: ARG001
    """Create test scenario."""
    return Scenario.objects.create(name="Test", is_active=True)


@pytest.fixture
def data_source(db):  # noqa: ARG001
    """Create a data source."""
    return DataSource.objects.create(name="Restricted", owner="Test", description_md="")


@pytest.fixture
def category(db):  # noqa: ARG001
    """Create an asset category."""
    return AssetCategory.objects.create(name="Infra")


@pytest.fixture
def sub_category(category):
    """Create an asset sub-category."""
    return AssetSubCategory.objects.create(name="Transport", category=category)


@pytest.fixture
def asset_type(sub_category, data_source):
    """Create an asset type linked to the data source."""
    return AssetType.objects.create(name="Rail", sub_category=sub_category, data_source=data_source)


@pytest.fixture
def group(db):  # noqa: ARG001
    """Create a group."""
    return Group.objects.create(name="Testers", created_by=uuid4())


@pytest.fixture
def other_group(db):  # noqa: ARG001
    """Create another group to keep data source restricted after revoking first group."""
    return Group.objects.create(name="Other Group", created_by=uuid4())


@pytest.fixture
def user_a_id():
    """Return user A ID."""
    return uuid4()


@pytest.fixture
def user_b_id():
    """Return user B ID."""
    return uuid4()


@pytest.fixture
def membership_a(group, user_a_id):
    """Add user A to the group."""
    return GroupMembership.objects.create(group=group, user_id=user_a_id, created_by=uuid4())


@pytest.fixture
def membership_b(group, user_b_id):
    """Add user B to the group."""
    return GroupMembership.objects.create(group=group, user_id=user_b_id, created_by=uuid4())


@pytest.fixture
def group_access(group, data_source):
    """Grant the group access to the data source."""
    return GroupDataSourceAccess.objects.create(
        data_source=data_source, group=group, created_by=uuid4()
    )


@pytest.fixture
def other_group_access(other_group, data_source):
    """Grant the other group access to the data source so it stays restricted."""
    return GroupDataSourceAccess.objects.create(
        data_source=data_source, group=other_group, created_by=uuid4()
    )


# --- DELETE (Revoke access) Tests ---


@pytest.mark.django_db
def test_revoke_data_source_access_cleans_up_visible_assets(  # noqa: PLR0913
    scenario,
    data_source,
    asset_type,
    group,
    group_access,  # noqa: ARG001
    other_group_access,  # noqa: ARG001
    membership_a,
    client,
    monkeypatch,
):
    """Test revoking group data source access cleans up VisibleAsset for group members."""
    monkeypatch.setattr(
        "api.views.group_data_source_access.get_user_id_from_request",
        get_user_id_from_request,
    )
    focus_area = FocusArea.objects.create(
        scenario=scenario, user_id=membership_a.user_id, name="Map-wide", is_system=True
    )
    VisibleAsset.objects.create(focus_area=focus_area, asset_type=asset_type)

    response = client.delete(
        f"/api/datasources/{data_source.id}/access/{group.id}/",
        content_type="application/json",
    )

    assert response.status_code == http_no_content
    assert not VisibleAsset.objects.filter(focus_area=focus_area, asset_type=asset_type).exists()


@pytest.mark.django_db
def test_revoke_data_source_access_cleans_up_for_all_group_members(  # noqa: PLR0913
    scenario,
    data_source,
    asset_type,
    group,
    group_access,  # noqa: ARG001
    other_group_access,  # noqa: ARG001
    membership_a,
    membership_b,
    client,
    monkeypatch,
):
    """Test revoking access cleans up VisibleAsset for all members of the group."""
    monkeypatch.setattr(
        "api.views.group_data_source_access.get_user_id_from_request",
        get_user_id_from_request,
    )
    fa_a = FocusArea.objects.create(
        scenario=scenario, user_id=membership_a.user_id, name="FA A", is_system=True
    )
    fa_b = FocusArea.objects.create(
        scenario=scenario, user_id=membership_b.user_id, name="FA B", is_system=True
    )
    va_a = VisibleAsset.objects.create(focus_area=fa_a, asset_type=asset_type)
    va_b = VisibleAsset.objects.create(focus_area=fa_b, asset_type=asset_type)

    response = client.delete(
        f"/api/datasources/{data_source.id}/access/{group.id}/",
        content_type="application/json",
    )

    assert response.status_code == http_no_content
    assert not VisibleAsset.objects.filter(id=va_a.id).exists()
    assert not VisibleAsset.objects.filter(id=va_b.id).exists()


@pytest.mark.django_db
def test_revoke_data_source_access_preserves_assets_when_member_in_another_group(  # noqa: PLR0913
    scenario,
    data_source,
    asset_type,
    group,
    other_group,
    group_access,  # noqa: ARG001
    other_group_access,  # noqa: ARG001
    membership_a,
    client,
    monkeypatch,
):
    """Test revoking access preserves VisibleAsset when member has access via another group."""
    monkeypatch.setattr(
        "api.views.group_data_source_access.get_user_id_from_request",
        get_user_id_from_request,
    )
    # User A is also in other_group which retains access
    GroupMembership.objects.create(
        group=other_group, user_id=membership_a.user_id, created_by=uuid4()
    )
    focus_area = FocusArea.objects.create(
        scenario=scenario, user_id=membership_a.user_id, name="Map-wide", is_system=True
    )
    va = VisibleAsset.objects.create(focus_area=focus_area, asset_type=asset_type)

    response = client.delete(
        f"/api/datasources/{data_source.id}/access/{group.id}/",
        content_type="application/json",
    )

    assert response.status_code == http_no_content
    assert VisibleAsset.objects.filter(id=va.id).exists()


@pytest.mark.django_db
def test_revoke_last_group_access_preserves_assets_as_ds_becomes_global(  # noqa: PLR0913
    scenario,
    data_source,
    asset_type,
    group,
    group_access,  # noqa: ARG001
    membership_a,
    client,
    monkeypatch,
):
    """Test revoking the last group access makes DS global so no cleanup needed."""
    monkeypatch.setattr(
        "api.views.group_data_source_access.get_user_id_from_request",
        get_user_id_from_request,
    )
    focus_area = FocusArea.objects.create(
        scenario=scenario, user_id=membership_a.user_id, name="Map-wide", is_system=True
    )
    va = VisibleAsset.objects.create(focus_area=focus_area, asset_type=asset_type)

    # No other_group_access — this is the only group with access
    response = client.delete(
        f"/api/datasources/{data_source.id}/access/{group.id}/",
        content_type="application/json",
    )

    assert response.status_code == http_no_content
    # DS becomes globally available, so visible asset should be preserved
    assert VisibleAsset.objects.filter(id=va.id).exists()


# --- POST (Grant access — global to restricted transition) Tests ---


@pytest.mark.django_db
def test_grant_data_source_access_cleans_up_for_non_members(  # noqa: PLR0913
    scenario, data_source, asset_type, group, membership_a, client, monkeypatch
):
    """Test granting group access cleans up VisibleAsset for non-members."""
    monkeypatch.setattr(
        "api.views.group_data_source_access.get_user_id_from_request",
        get_user_id_from_request,
    )
    non_member_id = uuid4()
    fa_non_member = FocusArea.objects.create(
        scenario=scenario, user_id=non_member_id, name="FA Non-member", is_system=True
    )
    fa_member = FocusArea.objects.create(
        scenario=scenario, user_id=membership_a.user_id, name="FA Member", is_system=True
    )
    va_non_member = VisibleAsset.objects.create(focus_area=fa_non_member, asset_type=asset_type)
    va_member = VisibleAsset.objects.create(focus_area=fa_member, asset_type=asset_type)

    # Grant access — data source transitions from global to restricted
    response = client.post(
        f"/api/datasources/{data_source.id}/access/",
        data=dumps({"group": str(group.id)}),
        content_type="application/json",
    )

    assert response.status_code == http_created
    # Non-member's visible asset should be cleaned up
    assert not VisibleAsset.objects.filter(id=va_non_member.id).exists()
    # Member's visible asset should be preserved
    assert VisibleAsset.objects.filter(id=va_member.id).exists()
