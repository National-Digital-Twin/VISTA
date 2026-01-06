"""Provides fixtures and utility functions for this test module."""

import uuid

import pytest
from django.contrib.gis.geos import Point, Polygon

from api.models import FocusArea, Scenario, ScenarioAsset
from api.models.asset import Asset
from api.models.asset_type import AssetCategory, AssetSubCategory, AssetType, DataSource
from api.models.dependency import Dependency


@pytest.fixture
def mock_user_id():
    """Return the mock dev user ID (matches get_user_id_from_request in dev mode)."""
    return uuid.UUID("00000000-0000-0000-0000-000000000001")


@pytest.fixture
def scenario(db):  # noqa: ARG001
    """Create test scenario."""
    return Scenario.objects.create(
        id=uuid.uuid4(),
        name="Test Scenario",
        is_active=True,
    )


@pytest.fixture
def mapwide_focus_area(scenario, mock_user_id):
    """Create map-wide focus area."""
    return FocusArea.objects.create(
        id=uuid.uuid4(),
        scenario=scenario,
        user_id=mock_user_id,
        name="Map-wide",
        geometry=None,
        filter_mode="by_asset_type",
        is_active=True,
        is_system=True,
    )


@pytest.fixture
def full_data():
    """Create full test dataset."""
    return _create_fixture()


@pytest.fixture
def asset_categories():
    """Create synthetic asset categories."""
    fixture = _create_fixture()
    return fixture["asset_categories"]


@pytest.fixture
def asset_types():
    """Create synthetic asset types."""
    fixture = _create_fixture()
    return fixture["asset_types"]


@pytest.fixture
def data_sources():
    """Create synthetic data sources."""
    fixture = _create_fixture()
    return fixture["data_sources"]


@pytest.fixture
def assets():
    """Create synthetic assets."""
    return _create_fixture()["assets"]


@pytest.fixture
def dependencies():
    """Create synthetic dependencies."""
    return _create_fixture()["dependencies"]


def _create_fixture():
    category = AssetCategory.objects.create(id=uuid.uuid4(), name="Build infrastructure")
    transport_sub_category = AssetSubCategory.objects.create(
        id=uuid.uuid4(), name="Transport infrastructure", category=category
    )
    energy_sub_category = AssetSubCategory.objects.create(
        id=uuid.uuid4(), name="Energy", category=category
    )

    data_source_one = DataSource.objects.create(
        id=uuid.uuid4(), name="One", owner="Own1", description_md="Desc1"
    )
    data_source_two = DataSource.objects.create(
        id=uuid.uuid4(), name="Two", owner="Own2", description_md="Desc2"
    )

    station_asset_type = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Rail stations",
        sub_category=transport_sub_category,
        data_source=data_source_one,
    )
    pylon_asset_type = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Pylon",
        sub_category=energy_sub_category,
        data_source=data_source_two,
    )
    all_asset_types = [station_asset_type, pylon_asset_type]
    assets = _create_assets(all_asset_types)

    return {
        "assets": assets,
        "asset_categories": [category],
        "asset_subcategories": [transport_sub_category, energy_sub_category],
        "asset_types": [station_asset_type, pylon_asset_type],
        "data_sources": [data_source_one, data_source_two],
        "dependencies": _create_dependencies(assets),
    }


def _create_assets(types):
    ryde_assets = [
        Asset.objects.create(
            id=uuid.uuid4(),
            external_id=uuid.uuid4(),
            name=f"Ryde {_type}",
            type=_type,
            geom=Point(0.5, 0.5),
        )
        for _type in types
    ]
    cowes_assets = [
        Asset.objects.create(
            id=uuid.uuid4(),
            external_id=uuid.uuid4(),
            name=f"Cowes {_type}",
            type=_type,
            geom=Point(0.5, 1.5),
        )
        for _type in types
    ]
    ryde_assets.extend(cowes_assets)
    return ryde_assets


def _create_dependencies(assets):
    dependency_one = Dependency.objects.create(
        id=uuid.uuid4(), provider_asset=assets[0], dependent_asset=assets[2]
    )
    dependency_two = Dependency.objects.create(
        id=uuid.uuid4(), provider_asset=assets[1], dependent_asset=assets[3]
    )
    dependency_three = Dependency.objects.create(
        id=uuid.uuid4(), provider_asset=assets[3], dependent_asset=assets[0]
    )
    return [dependency_one, dependency_two, dependency_three]
