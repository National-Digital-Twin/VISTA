"""Tests for AssetScoreFiltersView."""

import uuid
from decimal import Decimal

import pytest

from api.models import AssetScoreFilter
from api.models.asset_type import AssetCategory, AssetSubCategory, AssetType, DataSource


@pytest.fixture
def asset_type_setup(db):  # noqa: ARG001
    """Create test asset types."""
    category = AssetCategory.objects.create(id=uuid.uuid4(), name="Infrastructure")
    sub_category = AssetSubCategory.objects.create(
        id=uuid.uuid4(), name="Energy", category_id=category
    )
    data_source = DataSource.objects.create(id=uuid.uuid4(), name="Test Source")

    station_type = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Stations",
        sub_category_id=sub_category,
        data_source_id=data_source,
    )
    pylon_type = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Pylons",
        sub_category_id=sub_category,
        data_source_id=data_source,
    )

    return {
        "category": category,
        "sub_category": sub_category,
        "data_source": data_source,
        "station_type": station_type,
        "pylon_type": pylon_type,
    }


@pytest.mark.django_db
class TestAssetScoreFiltersView:
    """Tests for AssetScoreFiltersView CRUD operations."""

    def test_get_score_filters_empty(self, client, scenario, mapwide_focus_area):  # noqa: ARG002
        """Test GET returns empty list when no filters exist."""
        response = client.get(f"/api/scenarios/{scenario.id}/asset-score-filters/")

        assert response.status_code == 200
        assert response.json() == []

    def test_put_creates_global_score_filter(self, client, scenario, mapwide_focus_area):
        """Test PUT creates a global score filter (asset_type=NULL)."""
        response = client.put(
            f"/api/scenarios/{scenario.id}/asset-score-filters/",
            {
                "focusAreaId": str(mapwide_focus_area.id),
                "assetTypeId": None,
                "criticalityValues": [1, 2],
                "exposureValues": [0, 1, 2, 3],
                "redundancyValues": None,
                "dependencyMin": "0.5",
                "dependencyMax": "2.5",
            },
            content_type="application/json",
        )

        assert response.status_code == 201
        data = response.json()
        assert data["focusAreaId"] == str(mapwide_focus_area.id)
        assert data["assetTypeId"] is None
        assert data["criticalityValues"] == [1, 2]
        assert data["exposureValues"] == [0, 1, 2, 3]
        assert data["redundancyValues"] is None
        assert data["dependencyMin"] == "0.50"
        assert data["dependencyMax"] == "2.50"

        sf = AssetScoreFilter.objects.get(
            focus_area=mapwide_focus_area,
            asset_type__isnull=True,
        )
        assert sf.criticality_values == [1, 2]
        assert sf.dependency_min == Decimal("0.50")

    def test_put_creates_per_type_score_filter(
        self, client, scenario, asset_type_setup, mapwide_focus_area
    ):
        """Test PUT creates a per-asset-type score filter."""
        station_type = asset_type_setup["station_type"]
        response = client.put(
            f"/api/scenarios/{scenario.id}/asset-score-filters/",
            {
                "focusAreaId": str(mapwide_focus_area.id),
                "assetTypeId": str(station_type.id),
                "criticalityValues": [3],
                "exposureValues": None,
                "redundancyValues": [0, 1],
                "dependencyMin": None,
                "dependencyMax": None,
            },
            content_type="application/json",
        )

        assert response.status_code == 201
        data = response.json()
        assert data["assetTypeId"] == str(station_type.id)
        assert data["criticalityValues"] == [3]

    def test_put_updates_existing_filter(self, client, scenario, mapwide_focus_area):
        """Test PUT updates an existing filter."""
        url = f"/api/scenarios/{scenario.id}/asset-score-filters/"

        client.put(
            url,
            {
                "focusAreaId": str(mapwide_focus_area.id),
                "assetTypeId": None,
                "criticalityValues": [1],
            },
            content_type="application/json",
        )

        response = client.put(
            url,
            {
                "focusAreaId": str(mapwide_focus_area.id),
                "assetTypeId": None,
                "criticalityValues": [2, 3],
            },
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()
        assert data["criticalityValues"] == [2, 3]

        count = AssetScoreFilter.objects.filter(
            focus_area=mapwide_focus_area,
            asset_type__isnull=True,
        ).count()
        assert count == 1

    def test_delete_score_filter(self, client, scenario, mapwide_focus_area):
        """Test DELETE removes a score filter."""
        url = f"/api/scenarios/{scenario.id}/asset-score-filters/"

        client.put(
            url,
            {
                "focusAreaId": str(mapwide_focus_area.id),
                "assetTypeId": None,
                "criticalityValues": [1],
            },
            content_type="application/json",
        )

        response = client.delete(f"{url}?focus_area_id={mapwide_focus_area.id}")

        assert response.status_code == 204

        assert not AssetScoreFilter.objects.filter(
            focus_area=mapwide_focus_area,
            asset_type__isnull=True,
        ).exists()


@pytest.mark.django_db
class TestDependencyRangeValidation:
    """Tests for dependency range validation in AssetScoreFiltersView."""

    def test_valid_dependency_range(self, client, scenario, mapwide_focus_area):
        """Test creating filter with valid dependency range."""
        response = client.put(
            f"/api/scenarios/{scenario.id}/asset-score-filters/",
            {
                "focusAreaId": str(mapwide_focus_area.id),
                "assetTypeId": None,
                "dependencyMin": "1.0",
                "dependencyMax": "5.0",
            },
            content_type="application/json",
        )

        assert response.status_code == 201
        data = response.json()
        assert data["dependencyMin"] == "1.00"
        assert data["dependencyMax"] == "5.00"

    def test_dependency_min_equals_max_valid(self, client, scenario, mapwide_focus_area):
        """Test creating filter with dependency_min == dependency_max (exact match)."""
        response = client.put(
            f"/api/scenarios/{scenario.id}/asset-score-filters/",
            {
                "focusAreaId": str(mapwide_focus_area.id),
                "assetTypeId": None,
                "dependencyMin": "3.0",
                "dependencyMax": "3.0",
            },
            content_type="application/json",
        )

        assert response.status_code == 201
        data = response.json()
        assert data["dependencyMin"] == "3.00"
        assert data["dependencyMax"] == "3.00"

    def test_dependency_min_greater_than_max_rejected(self, client, scenario, mapwide_focus_area):
        """Test that dependency_min > dependency_max is rejected."""
        response = client.put(
            f"/api/scenarios/{scenario.id}/asset-score-filters/",
            {
                "focusAreaId": str(mapwide_focus_area.id),
                "assetTypeId": None,
                "dependencyMin": "5.0",
                "dependencyMax": "1.0",
            },
            content_type="application/json",
        )

        assert response.status_code == 400
        data = response.json()
        assert "dependencyMin" in data

    def test_dependency_min_only_rejected(self, client, scenario, mapwide_focus_area):
        """Test that providing only dependency_min is rejected."""
        response = client.put(
            f"/api/scenarios/{scenario.id}/asset-score-filters/",
            {
                "focusAreaId": str(mapwide_focus_area.id),
                "assetTypeId": None,
                "dependencyMin": "1.0",
                "dependencyMax": None,
            },
            content_type="application/json",
        )

        assert response.status_code == 400
        data = response.json()
        assert "dependencyMin" in data

    def test_dependency_max_only_rejected(self, client, scenario, mapwide_focus_area):
        """Test that providing only dependency_max is rejected."""
        response = client.put(
            f"/api/scenarios/{scenario.id}/asset-score-filters/",
            {
                "focusAreaId": str(mapwide_focus_area.id),
                "assetTypeId": None,
                "dependencyMin": None,
                "dependencyMax": "5.0",
            },
            content_type="application/json",
        )

        assert response.status_code == 400
        data = response.json()
        assert "dependencyMin" in data

    def test_both_dependency_null_valid(self, client, scenario, mapwide_focus_area):
        """Test that both dependency values as NULL is valid (no dependency filtering)."""
        response = client.put(
            f"/api/scenarios/{scenario.id}/asset-score-filters/",
            {
                "focusAreaId": str(mapwide_focus_area.id),
                "assetTypeId": None,
                "criticalityValues": [1, 2],
                "dependencyMin": None,
                "dependencyMax": None,
            },
            content_type="application/json",
        )

        assert response.status_code == 201
        data = response.json()
        assert data["dependencyMin"] is None
        assert data["dependencyMax"] is None

    def test_empty_criticality_array(self, client, scenario, mapwide_focus_area):
        """Test filter with empty criticality array."""
        response = client.put(
            f"/api/scenarios/{scenario.id}/asset-score-filters/",
            {
                "focusAreaId": str(mapwide_focus_area.id),
                "assetTypeId": None,
                "criticalityValues": [],
            },
            content_type="application/json",
        )

        assert response.status_code == 201
        data = response.json()
        assert data["criticalityValues"] == []
