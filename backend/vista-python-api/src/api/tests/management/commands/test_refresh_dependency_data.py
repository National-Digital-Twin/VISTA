"""Test cases for the refresh dependency data management command."""

from io import StringIO
from pathlib import Path
from uuid import uuid4

import pytest
from api.management.commands.refresh_dependency_data import Command
from api.models.asset import Asset
from api.models.asset_type import AssetCategory, AssetSubCategory, AssetType
from api.models.dependency import Dependency
from django.contrib.gis.geos import Polygon

id_one = "1234"
id_two = "5678"


@pytest.fixture
def assets():
    """Create assets fixture."""
    category = AssetCategory(id=uuid4())
    category.save()
    sub_category = AssetSubCategory(id=uuid4(), category=category)
    sub_category.save()
    asset_type = AssetType(id=uuid4(), sub_category=sub_category)
    asset_type.save()
    geometry = Polygon([(0, 0), (10, 0), (10, 10), (0, 10), (0, 0)])
    asset_one = Asset(id=uuid4(), type=asset_type, geom=geometry, external_id=id_one)
    asset_two = Asset(id=uuid4(), type=asset_type, geom=geometry, external_id=id_two)
    Asset.objects.bulk_create([asset_one, asset_two])
    return []


@pytest.mark.django_db
def test_refresh_dependency_data_command_runs_successfully(assets, monkeypatch):  # noqa: ARG001
    """Test that the refresh dependency data command runs successfully."""
    command = Command()
    csv_text = f"""to_asset,from_asset\n{id_one},{id_two}"""

    monkeypatch.setattr(
        Path,
        "open",
        lambda *a, **k: StringIO(csv_text),  # noqa: ARG005
    )

    command.handle()

    dependencies = Dependency.objects.all()
    assert dependencies[0].dependent_asset.external_id == id_one
    assert dependencies[0].provider_asset.external_id == id_two
