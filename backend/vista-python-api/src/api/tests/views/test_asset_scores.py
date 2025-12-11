"""Tests for the scenarios endpoint."""

import uuid
from unittest.mock import patch

import pytest
from django.conf import settings
from django.contrib.gis.geos import GEOSGeometry, Point, Polygon
from django.db import connection

from api.models import (
    Asset,
    AssetCategory,
    AssetSubCategory,
    AssetType,
    Dependency,
    ExposureLayer,
    ExposureLayerType,
    Scenario,
    ScenarioAsset,
    VisibleExposureLayer,
)

http_success_code = 200
http_not_found = 404
user_id = uuid.uuid4()
other_user_id = uuid.uuid4()


def _get_asset(fixture, asset_id):
    return next(iter([asset for asset in fixture["assets"] if asset.id == asset_id]))


def _get_criticality_score_for_asset(fixture, asset_id):
    asset = _get_asset(fixture, asset_id)
    asset_type_id = asset.type.id
    return next(
        iter(
            [
                scenario_asset.criticality_score
                for scenario_asset in fixture["asset_scores"]
                if scenario_asset.asset_type.id == asset_type_id
            ]
        )
    )


def _get_dependency_score_for_asset(fixture, asset_id):
    dependent_assets = [
        dependent_asset.dependent_asset
        for dependent_asset in fixture["dependencies"]
        if dependent_asset.provider_asset.id == asset_id
    ]
    if len(dependent_assets) > 0:
        total = 0
        for dep in dependent_assets:
            total += _get_criticality_score_for_asset(fixture, dep.id)
        return total / len(dependent_assets)
    return 0


def _get_exposure_score_for_asset(fixture, asset_id):
    asset = _get_asset(fixture, asset_id)
    in_count = 0
    near_count = 0
    for exposure_layer in fixture["exposure_layers"]:
        poly_m = exposure_layer.exposure_layer.geometry.transform(3857, clone=True)
        pt_m = asset.geom.transform(3857, clone=True)

        distance_m = poly_m.distance(pt_m)
        near_count += distance_m < 500
        in_count += exposure_layer.exposure_layer.geometry.contains(asset.geom)
    if in_count > 1:
        return 3
    if in_count == 1:
        return 2
    if near_count > 0:
        return 1
    return 0


@pytest.fixture
def mock_other_user_id():
    """Mock return `other_user_id` whe getting user ID from request."""
    with patch("api.views.asset_scores.get_user_id_from_request") as mock_fn:
        mock_fn.return_value = other_user_id
        yield mock_fn


@pytest.fixture
def mock_user_id():
    """Mock return `user_id` whe getting user ID from request."""
    with patch("api.views.asset_scores.get_user_id_from_request") as mock_fn:
        mock_fn.return_value = user_id
        yield mock_fn


@pytest.fixture
def fixture(db):  # noqa: ARG001
    """Create sample scenarios."""
    cat = AssetCategory.objects.create(id=uuid.uuid4(), name="Cat")
    sub_cat = AssetSubCategory.objects.create(category_id=cat, id=uuid.uuid4(), name="SubCat")
    scenario1 = Scenario.objects.create(name="Scenario1", is_active=True)

    type_substation = AssetType.objects.create(
        id=uuid.uuid4(), name="Substations", sub_category_id=sub_cat
    )
    asset1 = Asset.objects.create(
        external_id=uuid.uuid4(),
        id=uuid.uuid4(),
        geom=Point(0.0, 0.0),
        name="Substation1",
        type=type_substation,
    )
    type_wastewater_collection = AssetType.objects.create(
        id=uuid.uuid4(), name="Wastewater Collections", sub_category_id=sub_cat
    )
    asset2 = Asset.objects.create(
        external_id=uuid.uuid4(),
        id=uuid.uuid4(),
        geom=Point(0.0028, 0.0),
        name="Wastewater1",
        type=type_wastewater_collection,
    )

    type_stadium = AssetType.objects.create(
        id=uuid.uuid4(), name="Stadiums", sub_category_id=sub_cat
    )
    asset3 = Asset.objects.create(
        external_id=uuid.uuid4(),
        id=uuid.uuid4(),
        geom=Point(0.0086, 0.0),
        name="Stadium1",
        type=type_stadium,
    )

    dep1 = Dependency.objects.create(provider_asset=asset1, dependent_asset=asset2)
    dep2 = Dependency.objects.create(provider_asset=asset1, dependent_asset=asset3)
    poly = Polygon(
        ((-0.001, -0.001), (0.001, -0.001), (0.001, 0.001), (-0.001, 0.001), (-0.001, -0.001))
    )

    exposure_layer_type = ExposureLayerType.objects.create(name="Flood")
    ExposureLayer.objects.create(geometry=poly, type=exposure_layer_type)
    exposure_layer = ExposureLayer.objects.create(geometry=poly, type=exposure_layer_type)
    vis_exposure_layer = VisibleExposureLayer.objects.create(
        scenario=scenario1, exposure_layer=exposure_layer, user_id=user_id
    )

    scenario_asset_1 = ScenarioAsset.objects.create(
        scenario=scenario1, asset_type=type_substation, criticality_score=3
    )
    scenario_asset_2 = ScenarioAsset.objects.create(
        scenario=scenario1, asset_type=type_wastewater_collection, criticality_score=2
    )
    scenario_asset_3 = ScenarioAsset.objects.create(
        scenario=scenario1, asset_type=type_stadium, criticality_score=1
    )

    with connection.cursor() as cursor:
        cursor.execute("REFRESH MATERIALIZED VIEW public.assets_within_500m_exposure_layers;")

    return {
        "assets": [asset1, asset2, asset3],
        "asset_scores": [scenario_asset_1, scenario_asset_2, scenario_asset_3],
        "dependencies": [dep1, dep2],
        "exposure_layers": [vis_exposure_layer],
        "scenarios": [scenario1],
    }


@pytest.mark.django_db
def test_list_asset_scores(fixture, client):
    """Test that all asset scores are listed."""
    scenario = fixture["scenarios"][0]
    response = client.get(f"/api/scenarios/{scenario.id}/assetscores/")
    data = response.json()

    assert response.status_code == http_success_code
    expected_scores = len(fixture["asset_scores"])
    for asset in fixture["assets"]:
        exposure_score = _get_exposure_score_for_asset(fixture, asset.id)
        if exposure_score > 0:
            expected_scores += 1
    assert len(data) == expected_scores


@pytest.mark.django_db
@pytest.mark.parametrize("asset_num", [0, 1, 2])
def test_retrieve_asset_score(fixture, client, asset_num, mock_user_id):
    """Test retrieving a single asset score with dependents."""
    asset = fixture["assets"][asset_num]
    scenario = fixture["scenarios"][0]
    response = client.get(f"/api/scenarios/{scenario.id}/assetscores/{asset.id}/")
    data = response.json()

    mock_user_id.assert_called_once()
    assert response.status_code == http_success_code
    assert data["criticalityScore"] == f"{_get_criticality_score_for_asset(fixture, asset.id):.2f}"
    assert data["dependencyScore"] == f"{_get_dependency_score_for_asset(fixture, asset.id):.2f}"
    assert data["exposureScore"] == f"{_get_exposure_score_for_asset(fixture, asset.id):.2f}"
    assert data["redundancyScore"] == f"{3:.2f}"


@pytest.mark.django_db
@pytest.mark.parametrize("asset_num", [0, 1, 2])
def test_retrieve_asset_score_for_alternate_user(fixture, client, asset_num, mock_other_user_id):
    """Test retrieving a single asset score with dependents."""
    asset = fixture["assets"][asset_num]
    scenario = fixture["scenarios"][0]
    response = client.get(f"/api/scenarios/{scenario.id}/assetscores/{asset.id}/")
    data = response.json()

    mock_other_user_id.assert_called_once()
    assert response.status_code == http_success_code
    assert data["criticalityScore"] == f"{_get_criticality_score_for_asset(fixture, asset.id):.2f}"
    assert data["dependencyScore"] == f"{_get_dependency_score_for_asset(fixture, asset.id):.2f}"
    assert data["exposureScore"] == f"{0:.2f}"
    assert data["redundancyScore"] == f"{3:.2f}"


@pytest.mark.django_db
def test_retrieve_nonexistent_asset_score_returns_404(client):
    """Test that nonexistent asset scores return 404."""
    fake_id = uuid.uuid4()
    response = client.get(f"/api/assetscores/{fake_id}/")
    assert response.status_code == http_not_found
