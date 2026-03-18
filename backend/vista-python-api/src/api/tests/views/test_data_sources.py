# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Tests for the data sources endpoints."""

import json
import uuid

import pytest
from django.contrib.gis.geos import Point

from api.models.asset import Asset
from api.models.asset_type import AssetCategory, AssetSubCategory, AssetType
from api.models.data_source import DataSource
from api.models.group import Group, GroupDataSourceAccess, GroupMembership

http_ok = 200
http_created = 201
http_no_content = 204
http_bad_request = 400
http_forbidden = 403
http_not_found = 404

expected_attributes_ct = 8
admin_id = uuid.uuid4()
group_member_id = uuid.uuid4()


@pytest.fixture
def asset_data(db, data_source):  # noqa: ARG001
    """Create asset data associated with data source."""
    asset_category = AssetCategory.objects.create(name="Utility")
    asset_subcategory = AssetSubCategory.objects.create(name="Utility", category=asset_category)
    asset_type = AssetType.objects.create(
        name="Pylon", data_source=data_source, sub_category=asset_subcategory
    )
    return [
        Asset.objects.create(
            name="Pylon_One", external_id=uuid.uuid4(), geom=Point(0.5, 0.5), type=asset_type
        )
    ]


@pytest.fixture
def data_source(db):  # noqa: ARG001
    """Create a data source for testing."""
    return DataSource.objects.create(name="source", owner="owner_one")


@pytest.fixture
def group_no_member(db, data_source):  # noqa: ARG001
    """Create a group for testing."""
    group = Group.objects.create(name="Volunteers", created_by=admin_id)
    GroupDataSourceAccess.objects.create(data_source=data_source, group=group)
    return group


@pytest.fixture
def group_no_access(db):  # noqa: ARG001
    """Create a group for testing."""
    return Group.objects.create(name="Volunteers", created_by=admin_id)


@pytest.fixture
def group_and_member(db, data_source):  # noqa: ARG001
    """Create a group for testing."""
    group = Group.objects.create(name="Volunteers", created_by=admin_id)
    member = GroupMembership.objects.create(
        group=group, user_id=group_member_id, created_by=admin_id
    )
    GroupDataSourceAccess.objects.create(data_source=data_source, group=group)
    return (group, member)


def get_user_id_from_request(request):  # noqa: ARG001
    """Mock user ID in request."""
    return admin_id


class Administrator:
    """Mock administrator permission."""

    def has_permission(self, request, view):  # noqa: ARG002
        """Return whether user has permission."""
        return False


# --- GET (List) Tests ---


@pytest.mark.django_db
def test_list_data_sources_returns_successfully(asset_data, data_source, client):
    """Test that the list function works as expected."""
    response = client.get("/api/datasources/")
    data = response.json()
    result = data[0]

    assert response.status_code == http_ok
    assert len(data) == 1
    assert len(result.keys()) == expected_attributes_ct
    assert set(result.keys()) == {
        "id",
        "name",
        "owner",
        "description",
        "assetCount",
        "lastUpdated",
        "globallyAvailable",
        "groupsWithAccess",
    }
    assert result["id"] == str(data_source.id)
    assert result["name"] == data_source.name
    assert result["owner"] == data_source.owner
    assert result["description"] == data_source.description_md
    assert result["assetCount"] == len(asset_data)
    assert result["globallyAvailable"]
    assert not result["groupsWithAccess"]


@pytest.mark.django_db
def test_list_data_sources_returns_groups_with_access(data_source, group_and_member, client):  # noqa: ARG001
    """Test that the groups with access to the data source are returned."""
    response = client.get("/api/datasources/")
    data = response.json()
    result = data[0]

    group = group_and_member[0]
    member = group_and_member[1]
    assert response.status_code == http_ok
    assert len(result["groupsWithAccess"]) == 1
    group_with_access = result["groupsWithAccess"][0]
    assert set(group_with_access.keys()) == {"id", "name", "members"}
    assert group_with_access["id"] == str(group.id)
    assert group_with_access["name"] == group.name
    assert len(group_with_access["members"]) == 1
    assert group_with_access["members"][0] == str(member.id)


@pytest.mark.django_db
def test_list_data_sources_returns_groups_with_access_without_members(
    data_source,  # noqa: ARG001
    group_no_member,  # noqa: ARG001
    client,
):
    """Test that the groups with access to the data source are returned."""
    response = client.get("/api/datasources/")
    data = response.json()
    result = data[0]

    assert response.status_code == http_ok
    assert len(result["groupsWithAccess"]) == 1
    assert not result["groupsWithAccess"][0]["members"]


# --- GET (Retrieve) Tests ---


@pytest.mark.django_db
def test_retrieve_data_sources(asset_data, data_source, client):
    """Test that the list function works as expected."""
    response = client.get(f"/api/datasources/{data_source.id}/", content_type="application/json")
    assert response.status_code == http_ok

    data = response.json()

    assert len(data.keys()) == expected_attributes_ct
    assert set(data.keys()) == {
        "id",
        "name",
        "owner",
        "description",
        "assetCount",
        "lastUpdated",
        "globallyAvailable",
        "groupsWithAccess",
    }
    assert data["id"] == str(data_source.id)
    assert data["name"] == data_source.name
    assert data["owner"] == data_source.owner
    assert data["description"] == data_source.description_md
    assert data["assetCount"] == len(asset_data)
    assert data["globallyAvailable"]
    assert not data["groupsWithAccess"]


@pytest.mark.django_db
def test_retrieve_data_sources_with_groups(data_source, group_and_member, client):
    """Test that the list function works as expected."""
    response = client.get(f"/api/datasources/{data_source.id}/", content_type="application/json")
    assert response.status_code == http_ok

    data = response.json()

    group = group_and_member[0]
    member = group_and_member[1]
    assert len(data["groupsWithAccess"]) == 1
    group_with_access = data["groupsWithAccess"][0]
    assert set(group_with_access.keys()) == {"id", "name", "members"}
    assert group_with_access["id"] == str(group.id)
    assert group_with_access["name"] == group.name
    assert len(group_with_access["members"]) == 1
    assert group_with_access["members"][0] == str(member.id)


@pytest.mark.django_db
def test_retrieve_data_sources_returns_groups_with_access_without_members(
    data_source,
    group_no_member,  # noqa: ARG001
    client,
):
    """Test that the list function works as expected."""
    response = client.get(f"/api/datasources/{data_source.id}/", content_type="application/json")
    assert response.status_code == http_ok

    data = response.json()

    assert len(data["groupsWithAccess"]) == 1
    assert not data["groupsWithAccess"][0]["members"]


# --- POST (create) Tests ---


@pytest.mark.django_db
def test_add_group_access_to_data_source_is_successful(
    data_source, group_no_access, client, monkeypatch
):
    """Test that the create function works as expected."""
    monkeypatch.setattr(
        "api.views.group_data_source_access.get_user_id_from_request", get_user_id_from_request
    )
    add_access_response = client.post(
        f"/api/datasources/{data_source.id}/access/",
        data=json.dumps({"group": str(group_no_access.id)}),
        content_type="application/json",
    )
    assert add_access_response.status_code == http_created

    data_source_response = client.get(
        f"/api/datasources/{data_source.id}/", content_type="application/json"
    )
    data = data_source_response.json()
    assert len(data["groupsWithAccess"]) == 1
    assert data["groupsWithAccess"][0]["id"] == str(group_no_access.id)

    group_data_source_access = GroupDataSourceAccess.objects.filter(
        group_id=group_no_access.id, data_source_id=data_source.id
    )
    assert group_data_source_access[0].created_by == admin_id


@pytest.mark.django_db
def test_add_group_access_to_data_source_returns_404_for_unknown_data_source(
    client, group_no_access, monkeypatch
):
    """Test that the create function returns 404 for unknown data source."""
    monkeypatch.setattr(
        "api.views.group_data_source_access.get_user_id_from_request", get_user_id_from_request
    )
    response = client.post(
        f"/api/datasources/{uuid.uuid4()}/access/",
        data=json.dumps({"group": str(group_no_access.id)}),
        content_type="application/json",
    )
    assert response.status_code == http_not_found


@pytest.mark.django_db
def test_add_group_access_to_data_source_returns_400_for_unknown_group(
    data_source, client, monkeypatch
):
    """Test that the create function returns 400 for unknown group."""
    monkeypatch.setattr(
        "api.views.group_data_source_access.get_user_id_from_request", get_user_id_from_request
    )
    response = client.post(
        f"/api/datasources/{data_source.id}/access/",
        data=json.dumps({"group": str(uuid.uuid4())}),
        content_type="application/json",
    )
    assert response.status_code == http_bad_request


@pytest.mark.django_db
def test_add_group_access_to_data_source_returns_returns_403_for_general_user(
    data_source, group_no_access, client, monkeypatch
):
    """Test that GET returns a 403 if not admin."""
    monkeypatch.setattr("api.views.group_data_source_access.Administrator", Administrator)

    response = client.post(
        f"/api/datasources/{data_source.id}/access/",
        data=json.dumps({"group": str(group_no_access.id)}),
        content_type="application/json",
    )
    assert response.status_code == http_forbidden


# --- DELETE (destroy) Tests ---


@pytest.mark.django_db
def test_delete_group_access_to_data_source_is_successful(
    data_source, group_no_member, client, monkeypatch
):
    """Test that the delete function works as expected."""
    monkeypatch.setattr(
        "api.views.group_data_source_access.get_user_id_from_request", get_user_id_from_request
    )
    remove_access_response = client.delete(
        f"/api/datasources/{data_source.id}/access/{group_no_member.id}/"
    )
    assert remove_access_response.status_code == http_no_content

    data_source_response = client.get(
        f"/api/datasources/{data_source.id}/", content_type="application/json"
    )
    data = data_source_response.json()
    assert not data["groupsWithAccess"]

    group_data_source_access = GroupDataSourceAccess.objects.filter(
        group_id=group_no_member.id, data_source_id=data_source.id
    )
    assert not group_data_source_access


@pytest.mark.django_db
def test_delete_group_access_to_data_source_returns_404_for_unknown_data_source(
    client, group_no_access, monkeypatch
):
    """Test that the delete function returns 404 for unknown data source."""
    monkeypatch.setattr(
        "api.views.group_data_source_access.get_user_id_from_request", get_user_id_from_request
    )
    response = client.delete(f"/api/datasources/{uuid.uuid4()}/access/{group_no_access.id}/")
    assert response.status_code == http_not_found


@pytest.mark.django_db
def test_delete_group_access_to_data_source_returns_400_for_unknown_group(
    data_source, client, monkeypatch
):
    """Test that the delete function returns 400 for unknown group."""
    monkeypatch.setattr(
        "api.views.group_data_source_access.get_user_id_from_request", get_user_id_from_request
    )
    response = client.delete(f"/api/datasources/{data_source.id}/access/{uuid.uuid4()}/")
    assert response.status_code == http_not_found


@pytest.mark.django_db
def test_delete_group_access_to_data_source_returns_returns_403_for_general_user(
    data_source, group_no_member, client, monkeypatch
):
    """Test that the delete function returns a 403 if not admin."""
    monkeypatch.setattr("api.views.group_data_source_access.Administrator", Administrator)
    response = client.delete(f"/api/datasources/{data_source.id}/access/{group_no_member.id}/")
    assert response.status_code == http_forbidden
