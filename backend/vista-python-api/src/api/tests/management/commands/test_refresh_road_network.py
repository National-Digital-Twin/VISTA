"""Test cases for the refresh road network management command."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

import pytest
from api.management.commands.refresh_road_network import Command, RoadNetworkHandler
from api.models.road_link import RoadLink
from django.contrib.gis.geos import LineString

ROAD_LINK_FEATURE = {
    "id": "road-link-1",
    "type": "Feature",
    "properties": {
        "geometry_length_m": 100.0,
        "directionality": "Both Directions",
        "roadclassification": "A Road",
        "routehierarchy": "A Road",
        "roadclassificationnumber": "A3055",
        "description": "Single Carriageway",
        "operationalstate": "Open",
        "trunkroad": False,
        "primaryroute": False,
        "startnode": "node-a",
        "endnode": "node-b",
        "name1_text": "Test Road",
        "versiondate": "2025-06-15T00:00:00Z",
    },
    "geometry": {
        "type": "LineString",
        "coordinates": [[-1.17, 50.63], [-1.18, 50.64]],
    },
}

SPEED_FEATURE = {
    "id": "speed-1",
    "type": "Feature",
    "properties": {
        "osid": "road-link-1",
        "indicativespeedlimit_mph": 40.0,
    },
    "geometry": {
        "type": "LineString",
        "coordinates": [[-1.17, 50.63], [-1.18, 50.64]],
    },
}


def _create_road_link(**overrides):
    """Create a RoadLink in the DB with sensible defaults."""
    defaults = {
        "osid": "existing-link-1",
        "geometry": LineString((-1.17, 50.63), (-1.18, 50.64), srid=4326),
        "length_m": 100.0,
        "start_node": "node-a",
        "end_node": "node-b",
    }
    defaults.update(overrides)
    return RoadLink.objects.create(**defaults)


@pytest.mark.django_db
class TestRefreshRoadNetwork:
    """Tests for the refresh road network command."""

    @patch.object(RoadNetworkHandler, "fetch_all_from_collection", new_callable=AsyncMock)
    def test_creates_road_links(self, mock_fetch):
        """Road links are created from fetched data."""
        mock_fetch.side_effect = [[ROAD_LINK_FEATURE], [SPEED_FEATURE]]

        Command().handle()

        assert RoadLink.objects.count() == 1
        assert RoadLink.objects.first().osid == "road-link-1"

    @patch.object(RoadNetworkHandler, "fetch_all_from_collection", new_callable=AsyncMock)
    def test_deletes_existing_before_insert(self, mock_fetch):
        """Existing road links are deleted before inserting new ones."""
        _create_road_link()
        mock_fetch.side_effect = [[ROAD_LINK_FEATURE], [SPEED_FEATURE]]

        Command().handle()

        assert RoadLink.objects.count() == 1
        assert RoadLink.objects.first().osid == "road-link-1"

    @patch.object(RoadNetworkHandler, "fetch_all_from_collection", new_callable=AsyncMock)
    def test_stores_versiondate(self, mock_fetch):
        """Versiondate from OS NGD is stored on the road link."""
        mock_fetch.side_effect = [[ROAD_LINK_FEATURE], []]

        Command().handle()

        link = RoadLink.objects.first()
        assert link.versiondate == datetime(2025, 6, 15, tzinfo=UTC)

    @patch.object(RoadNetworkHandler, "fetch_all_from_collection", new_callable=AsyncMock)
    def test_applies_speed_lookup(self, mock_fetch):
        """Speed data from RAMI collection is joined to road links."""
        mock_fetch.side_effect = [[ROAD_LINK_FEATURE], [SPEED_FEATURE]]

        Command().handle()

        assert RoadLink.objects.first().speed_limit_mph == 40

    @patch.object(RoadNetworkHandler, "fetch_all_from_collection", new_callable=AsyncMock)
    def test_no_speed_data_leaves_null(self, mock_fetch):
        """Road links without matching speed data have null speed_limit_mph."""
        mock_fetch.side_effect = [[ROAD_LINK_FEATURE], []]

        Command().handle()

        assert RoadLink.objects.first().speed_limit_mph is None
