"""Tests for resource intervention views."""

import uuid

import pytest
from django.contrib.gis.geos import Point
from rest_framework import status

from api.models import Scenario, VisibleResourceInterventionType
from api.models.resource_intervention import (
    ResourceInterventionAction,
    ResourceInterventionLocation,
    ResourceInterventionType,
)


@pytest.fixture
def resource_type(db):  # noqa: ARG001
    """Create a Sandbags resource type."""
    return ResourceInterventionType.objects.create(
        id=uuid.UUID("a1b2c3d4-5678-90ab-cdef-1234567890ab"),
        name="Sandbags",
        unit="bags",
    )


@pytest.fixture
def resource_location(scenario, resource_type):
    """Create a test resource location."""
    return ResourceInterventionLocation.objects.create(
        scenario=scenario,
        name="Newport",
        geometry=Point(-1.290, 50.701, srid=4326),
        type=resource_type,
        current_stock=150,
        max_capacity=300,
    )


# --- GET (List) Tests ---


@pytest.mark.django_db
class TestScenarioResourceInterventionsView:
    """Tests for listing resource intervention types with locations."""

    def test_list_no_visibility_records_returns_types_inactive(
        self,
        client,
        scenario,
        resource_type,  # noqa: ARG002
    ):
        """When user has no visibility records, all types returned as inactive."""
        url = f"/api/scenarios/{scenario.id}/resource-interventions/"
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Sandbags"
        assert data[0]["unit"] == "bags"
        assert data[0]["isActive"] is False
        assert data[0]["locations"] == []

    def test_list_with_visibility_shows_locations(
        self,
        client,
        scenario,
        resource_type,
        resource_location,  # noqa: ARG002
        mock_user_id,
    ):
        """When user has visibility record, type is active with locations."""
        VisibleResourceInterventionType.objects.create(
            user_id=mock_user_id,
            scenario=scenario,
            resource_intervention_type=resource_type,
        )

        url = f"/api/scenarios/{scenario.id}/resource-interventions/"
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["isActive"] is True
        locations = data[0]["locations"]
        assert len(locations) == 1
        assert locations[0]["name"] == "Newport"
        assert locations[0]["currentStock"] == 150
        assert locations[0]["maxCapacity"] == 300

    def test_list_without_visibility_still_returns_locations(
        self,
        client,
        scenario,
        resource_type,  # noqa: ARG002
        resource_location,  # noqa: ARG002
    ):
        """Without visibility record, type is inactive but locations are still returned."""
        url = f"/api/scenarios/{scenario.id}/resource-interventions/"
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data[0]["isActive"] is False
        assert len(data[0]["locations"]) == 1
        assert data[0]["locations"][0]["name"] == "Newport"

    def test_scenario_isolation(self, client, scenario, resource_type, mock_user_id):
        """Locations are isolated by scenario."""
        other_scenario = Scenario.objects.create(name="Other Scenario", is_active=False)

        ResourceInterventionLocation.objects.create(
            scenario=scenario,
            name="Newport",
            geometry=Point(-1.290, 50.701, srid=4326),
            type=resource_type,
            current_stock=150,
            max_capacity=300,
        )
        ResourceInterventionLocation.objects.create(
            scenario=other_scenario,
            name="Ryde",
            geometry=Point(-1.162, 50.729, srid=4326),
            type=resource_type,
            current_stock=200,
            max_capacity=300,
        )

        VisibleResourceInterventionType.objects.create(
            user_id=mock_user_id,
            scenario=scenario,
            resource_intervention_type=resource_type,
        )

        url = f"/api/scenarios/{scenario.id}/resource-interventions/"
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        locations = data[0]["locations"]
        assert len(locations) == 1
        assert locations[0]["name"] == "Newport"

    def test_ordering_by_name(self, client, scenario, resource_type, mock_user_id):
        """Locations are ordered by name."""
        ResourceInterventionLocation.objects.create(
            scenario=scenario,
            name="Ryde",
            geometry=Point(-1.162, 50.729, srid=4326),
            type=resource_type,
            current_stock=200,
            max_capacity=300,
        )
        ResourceInterventionLocation.objects.create(
            scenario=scenario,
            name="Newport",
            geometry=Point(-1.290, 50.701, srid=4326),
            type=resource_type,
            current_stock=150,
            max_capacity=300,
        )

        VisibleResourceInterventionType.objects.create(
            user_id=mock_user_id,
            scenario=scenario,
            resource_intervention_type=resource_type,
        )

        url = f"/api/scenarios/{scenario.id}/resource-interventions/"
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        locations = data[0]["locations"]
        assert len(locations) == 2
        assert locations[0]["name"] == "Newport"
        assert locations[1]["name"] == "Ryde"

    def test_invalid_scenario_404(self, client):
        """Invalid scenario returns 404."""
        response = client.get(f"/api/scenarios/{uuid.uuid4()}/resource-interventions/")
        assert response.status_code == status.HTTP_404_NOT_FOUND


# --- GET (Location Detail) Tests ---


@pytest.mark.django_db
class TestScenarioResourceInterventionLocationView:
    """Tests for retrieving a single resource location."""

    def test_get_location_details(self, client, scenario, resource_location):
        """Retrieve single location details."""
        url = (
            f"/api/scenarios/{scenario.id}/resource-interventions/locations/{resource_location.id}/"
        )
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "Newport"
        assert data["currentStock"] == 150
        assert data["maxCapacity"] == 300

    def test_get_location_not_found(self, client, scenario):
        """Non-existent location returns 404."""
        fake_id = uuid.uuid4()
        url = f"/api/scenarios/{scenario.id}/resource-interventions/locations/{fake_id}/"
        response = client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND


# --- POST (Withdraw) Tests ---


@pytest.mark.django_db
class TestResourceInterventionWithdraw:
    """Tests for withdrawing stock from locations."""

    def test_successful_withdrawal(self, client, scenario, resource_location):
        """Successful stock withdrawal."""
        url = (
            f"/api/scenarios/{scenario.id}/resource-interventions/"
            f"locations/{resource_location.id}/withdraw/"
        )
        response = client.post(url, data={"quantity": 50}, content_type="application/json")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["currentStock"] == 100
        assert data["action"] == "withdraw"
        assert data["quantity"] == 50

        resource_location.refresh_from_db()
        assert resource_location.current_stock == 100

    def test_withdrawal_insufficient_stock(self, client, scenario, resource_location):
        """Withdrawal fails when insufficient stock."""
        url = (
            f"/api/scenarios/{scenario.id}/resource-interventions/"
            f"locations/{resource_location.id}/withdraw/"
        )
        response = client.post(url, data={"quantity": 200}, content_type="application/json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "Insufficient stock" in data["error"]

        resource_location.refresh_from_db()
        assert resource_location.current_stock == 150

    def test_withdrawal_creates_action_record(
        self, client, scenario, resource_location, mock_user_id
    ):
        """Withdrawal creates ResourceInterventionAction record."""
        url = (
            f"/api/scenarios/{scenario.id}/resource-interventions/"
            f"locations/{resource_location.id}/withdraw/"
        )
        client.post(url, data={"quantity": 50}, content_type="application/json")

        actions = ResourceInterventionAction.objects.filter(
            location=resource_location, user_id=mock_user_id
        )
        assert actions.count() == 1
        action = actions.first()
        assert action.action_type == "withdraw"
        assert action.quantity == 50

    def test_withdrawal_negative_quantity(self, client, scenario, resource_location):
        """Withdrawal rejects negative quantity."""
        url = (
            f"/api/scenarios/{scenario.id}/resource-interventions/"
            f"locations/{resource_location.id}/withdraw/"
        )
        response = client.post(url, data={"quantity": -10}, content_type="application/json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_withdrawal_zero_quantity(self, client, scenario, resource_location):
        """Withdrawal rejects zero quantity."""
        url = (
            f"/api/scenarios/{scenario.id}/resource-interventions/"
            f"locations/{resource_location.id}/withdraw/"
        )
        response = client.post(url, data={"quantity": 0}, content_type="application/json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_invalid_action_type(self, client, scenario, resource_location):
        """Invalid action type returns 400."""
        url = (
            f"/api/scenarios/{scenario.id}/resource-interventions/"
            f"locations/{resource_location.id}/invalid/"
        )
        response = client.post(url, data={"quantity": 50}, content_type="application/json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


# --- POST (Restock) Tests ---


@pytest.mark.django_db
class TestResourceInterventionRestock:
    """Tests for restocking locations."""

    def test_successful_restock(self, client, scenario, resource_location):
        """Successful stock restock."""
        url = (
            f"/api/scenarios/{scenario.id}/resource-interventions/"
            f"locations/{resource_location.id}/restock/"
        )
        response = client.post(url, data={"quantity": 100}, content_type="application/json")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["currentStock"] == 250
        assert data["action"] == "restock"
        assert data["quantity"] == 100

        resource_location.refresh_from_db()
        assert resource_location.current_stock == 250

    def test_restock_exceeds_capacity(self, client, scenario, resource_location):
        """Restock fails when exceeding capacity."""
        url = (
            f"/api/scenarios/{scenario.id}/resource-interventions/"
            f"locations/{resource_location.id}/restock/"
        )
        response = client.post(url, data={"quantity": 200}, content_type="application/json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "Exceeds capacity" in data["error"]

        resource_location.refresh_from_db()
        assert resource_location.current_stock == 150

    def test_restock_creates_action_record(self, client, scenario, resource_location, mock_user_id):
        """Restock creates ResourceInterventionAction record."""
        url = (
            f"/api/scenarios/{scenario.id}/resource-interventions/"
            f"locations/{resource_location.id}/restock/"
        )
        client.post(url, data={"quantity": 100}, content_type="application/json")

        actions = ResourceInterventionAction.objects.filter(
            location=resource_location, user_id=mock_user_id
        )
        assert actions.count() == 1
        action = actions.first()
        assert action.action_type == "restock"
        assert action.quantity == 100

    def test_restock_negative_quantity(self, client, scenario, resource_location):
        """Restock rejects negative quantity."""
        url = (
            f"/api/scenarios/{scenario.id}/resource-interventions/"
            f"locations/{resource_location.id}/restock/"
        )
        response = client.post(url, data={"quantity": -10}, content_type="application/json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_restock_zero_quantity(self, client, scenario, resource_location):
        """Restock rejects zero quantity."""
        url = (
            f"/api/scenarios/{scenario.id}/resource-interventions/"
            f"locations/{resource_location.id}/restock/"
        )
        response = client.post(url, data={"quantity": 0}, content_type="application/json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


# --- GET (Actions Log) Tests ---


@pytest.mark.django_db
class TestScenarioResourceInterventionActionsView:
    """Tests for listing resource intervention actions (usage log)."""

    def test_list_actions(self, client, scenario, resource_location, mock_user_id):
        """List actions for scenario."""
        ResourceInterventionAction.objects.create(
            location=resource_location,
            user_id=mock_user_id,
            action_type="withdraw",
            quantity=50,
        )
        ResourceInterventionAction.objects.create(
            location=resource_location,
            user_id=mock_user_id,
            action_type="restock",
            quantity=75,
        )

        url = f"/api/scenarios/{scenario.id}/resource-interventions/actions/"
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["totalCount"] == 2
        results = data["results"]
        assert len(results) == 2
        assert results[0]["actionType"] == "restock"
        assert results[0]["quantity"] == 75
        assert results[1]["actionType"] == "withdraw"
        assert results[1]["quantity"] == 50
        assert data["nextCursor"] is None

    def test_action_contains_nested_user(self, client, scenario, resource_location, mock_user_id):
        """Each action entry contains a nested user object with id and name."""
        ResourceInterventionAction.objects.create(
            location=resource_location,
            user_id=mock_user_id,
            action_type="withdraw",
            quantity=10,
        )

        url = f"/api/scenarios/{scenario.id}/resource-interventions/actions/"
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        result = response.json()["results"][0]
        assert "user" in result
        assert result["user"]["id"] == str(mock_user_id)
        assert isinstance(result["user"]["name"], str | None)

    def test_action_user_name_resolved_from_idp(self, client, scenario, resource_location):
        """User name is resolved from IdP stub users."""
        known_stub_id = "7b225422-5d6a-4b83-9655-4bdbe8443c5f"
        ResourceInterventionAction.objects.create(
            location=resource_location,
            user_id=known_stub_id,
            action_type="restock",
            quantity=25,
        )

        url = f"/api/scenarios/{scenario.id}/resource-interventions/actions/"
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        result = response.json()["results"][0]
        assert result["user"]["id"] == known_stub_id
        assert result["user"]["name"] == "Local User"

    def test_actions_show_all_users(self, client, scenario, resource_type, mock_user_id):
        """Actions log shows all users' actions for a scenario."""
        location = ResourceInterventionLocation.objects.create(
            scenario=scenario,
            name="Newport",
            geometry=Point(-1.290, 50.701, srid=4326),
            type=resource_type,
            current_stock=150,
            max_capacity=300,
        )
        other_user_id = uuid.uuid4()

        ResourceInterventionAction.objects.create(
            location=location,
            user_id=mock_user_id,
            action_type="withdraw",
            quantity=50,
        )
        ResourceInterventionAction.objects.create(
            location=location,
            user_id=other_user_id,
            action_type="withdraw",
            quantity=75,
        )

        url = f"/api/scenarios/{scenario.id}/resource-interventions/actions/"
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()["results"]) == 2

    def test_actions_ordered_by_created_at_desc(
        self, client, scenario, resource_location, mock_user_id
    ):
        """Actions are ordered by created_at descending (newest first)."""
        action1 = ResourceInterventionAction.objects.create(
            location=resource_location,
            user_id=mock_user_id,
            action_type="withdraw",
            quantity=50,
        )
        action2 = ResourceInterventionAction.objects.create(
            location=resource_location,
            user_id=mock_user_id,
            action_type="restock",
            quantity=75,
        )

        url = f"/api/scenarios/{scenario.id}/resource-interventions/actions/"
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        results = response.json()["results"]
        assert len(results) == 2
        assert results[0]["id"] == str(action2.id)
        assert results[1]["id"] == str(action1.id)

    def test_pagination_default_page_size(self, client, scenario, resource_location, mock_user_id):
        """Default page size is 50, with nextCursor when more exist."""
        for _i in range(60):
            ResourceInterventionAction.objects.create(
                location=resource_location,
                user_id=mock_user_id,
                action_type="withdraw",
                quantity=1,
            )

        url = f"/api/scenarios/{scenario.id}/resource-interventions/actions/"
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["totalCount"] == 60
        assert len(data["results"]) == 50
        assert data["nextCursor"] is not None

    def test_pagination_cursor_fetches_next_page(
        self, client, scenario, resource_location, mock_user_id
    ):
        """Using cursor fetches subsequent pages."""
        for _i in range(60):
            ResourceInterventionAction.objects.create(
                location=resource_location,
                user_id=mock_user_id,
                action_type="withdraw",
                quantity=1,
            )

        url = f"/api/scenarios/{scenario.id}/resource-interventions/actions/"
        page1 = client.get(url).json()
        assert page1["totalCount"] == 60
        assert len(page1["results"]) == 50
        assert page1["nextCursor"] is not None

        page2 = client.get(f"{url}?cursor={page1['nextCursor']}").json()
        assert page2["totalCount"] == 60
        assert len(page2["results"]) == 10
        assert page2["nextCursor"] is None

        page1_ids = {r["id"] for r in page1["results"]}
        page2_ids = {r["id"] for r in page2["results"]}
        assert page1_ids.isdisjoint(page2_ids)

    def test_pagination_custom_limit(self, client, scenario, resource_location, mock_user_id):
        """Custom limit parameter controls page size."""
        for _i in range(10):
            ResourceInterventionAction.objects.create(
                location=resource_location,
                user_id=mock_user_id,
                action_type="withdraw",
                quantity=1,
            )

        url = f"/api/scenarios/{scenario.id}/resource-interventions/actions/?limit=3"
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["results"]) == 3
        assert data["nextCursor"] is not None

    def test_pagination_limit_over_100_returns_400(self, client, scenario):
        """Limit over 100 returns 400."""
        url = f"/api/scenarios/{scenario.id}/resource-interventions/actions/?limit=200"
        response = client.get(url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_invalid_scenario_404(self, client):
        """Invalid scenario returns 404."""
        response = client.get(f"/api/scenarios/{uuid.uuid4()}/resource-interventions/actions/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_filter_by_type_id(
        self, client, scenario, resource_type, resource_location, mock_user_id
    ):
        """Filter actions by resource type."""
        other_type = ResourceInterventionType.objects.create(name="Barriers", unit="units")
        other_location = ResourceInterventionLocation.objects.create(
            scenario=scenario,
            name="Ryde",
            geometry=Point(-1.162, 50.729, srid=4326),
            type=other_type,
            current_stock=100,
            max_capacity=200,
        )

        ResourceInterventionAction.objects.create(
            location=resource_location, user_id=mock_user_id, action_type="withdraw", quantity=10
        )
        ResourceInterventionAction.objects.create(
            location=other_location, user_id=mock_user_id, action_type="withdraw", quantity=20
        )

        url = (
            f"/api/scenarios/{scenario.id}/resource-interventions/actions/"
            f"?type_id={resource_type.id}"
        )
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["totalCount"] == 1
        assert len(data["results"]) == 1
        assert data["results"][0]["quantity"] == 10

    def test_invalid_limit_returns_400(self, client, scenario):
        """Non-integer limit parameter returns 400."""
        url = f"/api/scenarios/{scenario.id}/resource-interventions/actions/?limit=abc"
        response = client.get(url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_negative_limit_returns_400(self, client, scenario):
        """Negative limit parameter returns 400."""
        url = f"/api/scenarios/{scenario.id}/resource-interventions/actions/?limit=-1"
        response = client.get(url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# --- Visibility Toggle Tests ---


@pytest.mark.django_db
class TestVisibleResourceInterventionType:
    """Tests for toggling resource intervention type visibility."""

    def test_enable_visibility(self, client, scenario, resource_type, mock_user_id):
        """Enabling visibility creates a record."""
        url = f"/api/scenarios/{scenario.id}/visible-resource-intervention-types/"
        response = client.put(
            url,
            data={
                "resource_intervention_type_id": str(resource_type.id),
                "is_active": True,
            },
            content_type="application/json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert VisibleResourceInterventionType.objects.filter(
            user_id=mock_user_id,
            scenario=scenario,
            resource_intervention_type=resource_type,
        ).exists()

    def test_disable_visibility(self, client, scenario, resource_type, mock_user_id):
        """Disabling visibility deletes the record."""
        VisibleResourceInterventionType.objects.create(
            user_id=mock_user_id,
            scenario=scenario,
            resource_intervention_type=resource_type,
        )

        url = f"/api/scenarios/{scenario.id}/visible-resource-intervention-types/"
        response = client.put(
            url,
            data={
                "resource_intervention_type_id": str(resource_type.id),
                "is_active": False,
            },
            content_type="application/json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert not VisibleResourceInterventionType.objects.filter(
            user_id=mock_user_id,
            scenario=scenario,
            resource_intervention_type=resource_type,
        ).exists()

    def test_enable_idempotent(self, client, scenario, resource_type, mock_user_id):
        """Enabling already-visible type is idempotent."""
        VisibleResourceInterventionType.objects.create(
            user_id=mock_user_id,
            scenario=scenario,
            resource_intervention_type=resource_type,
        )

        url = f"/api/scenarios/{scenario.id}/visible-resource-intervention-types/"
        response = client.put(
            url,
            data={
                "resource_intervention_type_id": str(resource_type.id),
                "is_active": True,
            },
            content_type="application/json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert (
            VisibleResourceInterventionType.objects.filter(
                user_id=mock_user_id,
                scenario=scenario,
                resource_intervention_type=resource_type,
            ).count()
            == 1
        )
