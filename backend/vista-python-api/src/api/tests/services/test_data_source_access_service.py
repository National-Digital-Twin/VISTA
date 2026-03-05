# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Tests for the data source access service."""

import uuid

import pytest

from api.models import FocusArea, Scenario, VisibleAsset
from api.models.asset_type import AssetCategory, AssetSubCategory, AssetType, DataSource
from api.models.group import Group, GroupDataSourceAccess, GroupMembership
from api.services.data_source_access_service import cleanup_stale_visible_assets


@pytest.fixture
def scenario(db):  # noqa: ARG001
    """Create test scenario."""
    return Scenario.objects.create(name="Test Scenario", is_active=True)


@pytest.fixture
def user_id():
    """Return a test user ID."""
    return uuid.uuid4()


@pytest.fixture
def other_user_id():
    """Return another test user ID."""
    return uuid.uuid4()


@pytest.fixture
def focus_area(scenario, user_id):
    """Create a focus area for the test user."""
    return FocusArea.objects.create(
        scenario=scenario,
        user_id=user_id,
        name="Map-wide",
        is_system=True,
    )


@pytest.fixture
def other_focus_area(scenario, other_user_id):
    """Create a focus area for another user."""
    return FocusArea.objects.create(
        scenario=scenario,
        user_id=other_user_id,
        name="Map-wide",
        is_system=True,
    )


@pytest.fixture
def data_source(db):  # noqa: ARG001
    """Create a data source."""
    return DataSource.objects.create(name="Restricted DS", owner="Test", description_md="")


@pytest.fixture
def global_data_source(db):  # noqa: ARG001
    """Create a globally available data source (no group access records)."""
    return DataSource.objects.create(name="Global DS", owner="Test", description_md="")


@pytest.fixture
def category(db):  # noqa: ARG001
    """Create an asset category."""
    return AssetCategory.objects.create(name="Infrastructure")


@pytest.fixture
def sub_category(category):
    """Create an asset sub-category."""
    return AssetSubCategory.objects.create(name="Transport", category=category)


@pytest.fixture
def restricted_asset_type(sub_category, data_source):
    """Create an asset type linked to a restricted data source."""
    return AssetType.objects.create(
        name="Rail Stations",
        sub_category=sub_category,
        data_source=data_source,
    )


@pytest.fixture
def global_asset_type(sub_category, global_data_source):
    """Create an asset type linked to a globally available data source."""
    return AssetType.objects.create(
        name="Roads",
        sub_category=sub_category,
        data_source=global_data_source,
    )


@pytest.fixture
def group(db):  # noqa: ARG001
    """Create a group."""
    return Group.objects.create(name="Testers", created_by=uuid.uuid4())


@pytest.fixture
def group_access(group, data_source):
    """Grant the group access to the restricted data source."""
    return GroupDataSourceAccess.objects.create(
        data_source=data_source,
        group=group,
        created_by=uuid.uuid4(),
    )


@pytest.fixture
def membership(group, user_id):
    """Add the test user to the group."""
    return GroupMembership.objects.create(
        group=group,
        user_id=user_id,
        created_by=uuid.uuid4(),
    )


@pytest.mark.django_db
def test_cleanup_deletes_visible_assets_for_inaccessible_types(
    user_id,
    focus_area,
    restricted_asset_type,
    group_access,  # noqa: ARG001
    membership,
):
    """Test that cleanup removes VisibleAsset for types the user can no longer access."""
    VisibleAsset.objects.create(focus_area=focus_area, asset_type=restricted_asset_type)

    # Remove user from group so they lose access
    membership.delete()

    deleted_count = cleanup_stale_visible_assets([user_id])

    assert deleted_count == 1
    assert not VisibleAsset.objects.filter(
        focus_area=focus_area, asset_type=restricted_asset_type
    ).exists()


@pytest.mark.django_db
def test_cleanup_preserves_visible_assets_for_accessible_types(  # noqa: PLR0913
    user_id,
    focus_area,
    restricted_asset_type,
    global_asset_type,
    group_access,  # noqa: ARG001
    membership,
):
    """Test that cleanup keeps VisibleAsset for types the user still has access to."""
    VisibleAsset.objects.create(focus_area=focus_area, asset_type=restricted_asset_type)
    VisibleAsset.objects.create(focus_area=focus_area, asset_type=global_asset_type)

    # Remove user from group — loses restricted, keeps global
    membership.delete()

    cleanup_stale_visible_assets([user_id])

    assert not VisibleAsset.objects.filter(
        focus_area=focus_area, asset_type=restricted_asset_type
    ).exists()
    assert VisibleAsset.objects.filter(focus_area=focus_area, asset_type=global_asset_type).exists()


@pytest.mark.django_db
def test_cleanup_preserves_other_users_visible_assets(  # noqa: PLR0913
    user_id,
    other_user_id,
    focus_area,
    other_focus_area,
    restricted_asset_type,
    group,
    group_access,  # noqa: ARG001
    membership,
):
    """Test that cleanup only affects the specified user's records."""
    VisibleAsset.objects.create(focus_area=focus_area, asset_type=restricted_asset_type)
    VisibleAsset.objects.create(focus_area=other_focus_area, asset_type=restricted_asset_type)

    # Add other user to the group so they have access
    GroupMembership.objects.create(group=group, user_id=other_user_id, created_by=uuid.uuid4())

    # Remove first user from group
    membership.delete()

    cleanup_stale_visible_assets([user_id])

    assert not VisibleAsset.objects.filter(
        focus_area=focus_area, asset_type=restricted_asset_type
    ).exists()
    assert VisibleAsset.objects.filter(
        focus_area=other_focus_area, asset_type=restricted_asset_type
    ).exists()


@pytest.mark.django_db
def test_cleanup_preserves_visible_assets_when_user_has_access_through_another_group(  # noqa: PLR0913
    user_id,
    focus_area,
    restricted_asset_type,
    group,  # noqa: ARG001
    group_access,  # noqa: ARG001
    membership,
):
    """Test that cleanup preserves VisibleAsset when user retains access via another group."""
    other_group = Group.objects.create(name="Other Group", created_by=uuid.uuid4())
    GroupDataSourceAccess.objects.create(
        data_source=restricted_asset_type.data_source, group=other_group, created_by=uuid.uuid4()
    )
    GroupMembership.objects.create(group=other_group, user_id=user_id, created_by=uuid.uuid4())

    VisibleAsset.objects.create(focus_area=focus_area, asset_type=restricted_asset_type)

    # Remove user from first group — still has access through other_group
    membership.delete()

    deleted_count = cleanup_stale_visible_assets([user_id])

    assert deleted_count == 0
    assert VisibleAsset.objects.filter(
        focus_area=focus_area, asset_type=restricted_asset_type
    ).exists()


@pytest.mark.django_db
def test_cleanup_noop_when_no_stale_records(user_id, focus_area, global_asset_type):
    """Test that cleanup is a no-op when user has no inaccessible visible assets."""
    VisibleAsset.objects.create(focus_area=focus_area, asset_type=global_asset_type)

    deleted_count = cleanup_stale_visible_assets([user_id])

    assert deleted_count == 0
    assert VisibleAsset.objects.filter(focus_area=focus_area, asset_type=global_asset_type).exists()


@pytest.mark.django_db
def test_cleanup_handles_user_with_no_visible_assets(user_id):
    """Test that cleanup succeeds when user has no VisibleAsset records."""
    deleted_count = cleanup_stale_visible_assets([user_id])
    assert deleted_count == 0
