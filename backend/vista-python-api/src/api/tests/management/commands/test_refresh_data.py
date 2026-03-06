# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Test cases for the refresh data management command."""

from io import StringIO
from pathlib import Path
from uuid import uuid4

import pytest
from api.management.commands.refresh_data import Command
from api.models.asset import Asset
from api.models.asset_type import AssetCategory, AssetSubCategory, AssetType
from django.contrib.gis.geos import Polygon

asset_type_id = uuid4()


@pytest.fixture
def _asset_structure():
    """Create assets fixture."""
    category = AssetCategory(id=uuid4())
    category.save()
    sub_category = AssetSubCategory(id=uuid4(), category=category)
    sub_category.save()
    asset_type = AssetType(id=asset_type_id, sub_category=sub_category)
    asset_type.save()


async def _fake_fetch(asset_specification):  # noqa: ARG001
    asset_type = AssetType(id=asset_type_id)
    geometry = Polygon([(0, 0), (10, 0), (10, 10), (0, 10), (0, 0)])
    asset = Asset(id=uuid4(), type=asset_type, geom=geometry, external_id=uuid4())
    return [asset]


@pytest.mark.usefixtures("_asset_structure")
@pytest.mark.django_db
def test_refresh_data_command_runs_successfully(monkeypatch):
    """Test that the refresh data command runs successfully."""
    command = Command()
    fake_json = '{"foo": "bar"}'

    monkeypatch.setattr(
        Path,
        "open",
        lambda *a, **k: StringIO(fake_json),  # noqa: ARG005
    )

    monkeypatch.setattr("api.management.commands.refresh_data.fetch", _fake_fetch)

    command.handle()

    assets = Asset.objects.all()
    assert len(assets) == 6
