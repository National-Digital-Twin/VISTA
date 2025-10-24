"""Provides fixtures and utility functions for this test module."""

import uuid

import pytest
from django.contrib.gis.geos import Point

from api.models.asset import Asset
from api.models.asset_type import AssetCategory, AssetSubCategory, AssetType


@pytest.fixture
def asset_types(_db):
    """Create synthetic asset types."""
    return _create_asset_types()


@pytest.fixture
def assets(_db: None):
    """Create synthetic assets."""
    types = _create_asset_types()
    ryde_assets = [
        Asset.objects.create(id=uuid.uuid4(), name=f"Ryde {_type}", type=_type, geom=Point(1, 1))
        for _type in types
    ]
    cowes_assets = [
        Asset.objects.create(id=uuid.uuid4(), name=f"Cowes {_type}", type=_type, geom=Point(1, 1))
        for _type in types
    ]
    ryde_assets.extend(cowes_assets)
    return ryde_assets


def _create_asset_types():
    category = AssetCategory.objects.create(id=uuid.uuid4(), name="Build infrastructure")
    transport_sub_category = AssetSubCategory.objects.create(
        id=uuid.uuid4(), name="Transport infrastructure", category_id=category
    )
    energy_sub_category = AssetSubCategory.objects.create(
        id=uuid.uuid4(), name="Energy", category_id=category
    )

    station_asset_type = AssetType.objects.create(
        id=uuid.uuid4(), name="Rail stations", sub_category_id=transport_sub_category
    )
    pylon_asset_type = AssetType.objects.create(
        id=uuid.uuid4(), name="Pylon", sub_category_id=energy_sub_category
    )

    return [station_asset_type, pylon_asset_type]
