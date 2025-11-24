"""Provides fixtures and utility functions for this test module."""

import uuid

import pytest
from django.contrib.gis.geos import Point

from api.models.asset import Asset
from api.models.asset_type import AssetCategory, AssetSubCategory, AssetType, DataSource


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
    types = _create_fixture()["asset_types"]
    ryde_assets = [
        Asset.objects.create(
            id=uuid.uuid4(),
            external_id=uuid.uuid4(),
            name=f"Ryde {_type}",
            type=_type,
            geom=Point(1, 1),
        )
        for _type in types
    ]
    cowes_assets = [
        Asset.objects.create(
            id=uuid.uuid4(),
            external_id=uuid.uuid4(),
            name=f"Cowes {_type}",
            type=_type,
            geom=Point(1, 1),
        )
        for _type in types
    ]
    ryde_assets.extend(cowes_assets)
    return ryde_assets


def _create_fixture():
    category = AssetCategory.objects.create(id=uuid.uuid4(), name="Build infrastructure")
    transport_sub_category = AssetSubCategory.objects.create(
        id=uuid.uuid4(), name="Transport infrastructure", category_id=category
    )
    energy_sub_category = AssetSubCategory.objects.create(
        id=uuid.uuid4(), name="Energy", category_id=category
    )

    data_source_one = DataSource.objects.create(id=uuid.uuid4(), name="One")
    data_source_two = DataSource.objects.create(id=uuid.uuid4(), name="Two")

    station_asset_type = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Rail stations",
        sub_category_id=transport_sub_category,
        data_source_id=data_source_one,
    )
    pylon_asset_type = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Pylon",
        sub_category_id=energy_sub_category,
        data_source_id=data_source_two,
    )

    return {
        "asset_categories": [category],
        "asset_subcategories": [transport_sub_category, energy_sub_category],
        "asset_types": [station_asset_type, pylon_asset_type],
        "data_sources": [data_source_one, data_source_two],
    }
