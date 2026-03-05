# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Test cases for the CQC data source handler."""

from uuid import uuid4

from api.models.asset import Asset
from api.repository.external.asset_data_source_handlers.cqc_data_source_handler import (
    CqcDataSourceHandler,
)
from api.repository.external.external_asset_mapper import ExternalAssetMapper

from .utils import MockResponse, monkeypatch_client

location_id = "123"
search_url = "/locations?localAuthority=123&careHome=Y&perPage=1000"


def get_details_url(location_id):
    """Get details URL from location ID."""
    return f"/locations/{location_id}"


class TestBuildUrlsForDataSource:
    """Tests for the `build_urls_for_data_source` method."""

    def test_correct_url_returned(self):
        handler = CqcDataSourceHandler("123")
        result = handler.build_urls_for_data_source({})[0]
        assert result == f"{handler.root_url}{search_url}"


class TestFetchDataForAssetSpecification:
    """Tests for the `fetch_data_for_asset_specification` method."""

    asset = Asset(id=uuid4())

    def fake_map(self, location_details, asset_specification):  # noqa: ARG002
        return self.asset

    async def test_fetch_data_for_one_page_one_location_is_successful(self, monkeypatch):
        handler = CqcDataSourceHandler("123")
        monkeypatch.setattr(ExternalAssetMapper, "map_from_cqc", self.fake_map)
        client = await monkeypatch_client(
            monkeypatch,
            {
                f"{handler.root_url}{search_url}": MockResponse(
                    200, {"locations": [{"locationId": location_id}]}
                ),
                f"{handler.root_url}{get_details_url(location_id)}": MockResponse(
                    200, {"registrationStatus": "Active"}
                ),
            },
        )
        result = await handler.fetch_data_for_asset_specification(
            {}, f"{handler.root_url}{search_url}"
        )
        assert len(result) == 1
        assert result[0].id == self.asset.id

        assert client.call_counts[f"{handler.root_url}{search_url}"] == 1
        assert client.call_counts[f"{handler.root_url}{get_details_url(location_id)}"] == 1

    async def test_fetch_data_filters_deregistered_locations(self, monkeypatch):
        handler = CqcDataSourceHandler("123")
        monkeypatch.setattr(ExternalAssetMapper, "map_from_cqc", self.fake_map)
        client = await monkeypatch_client(
            monkeypatch,
            {
                f"{handler.root_url}{search_url}": MockResponse(
                    200, {"locations": [{"locationId": location_id}, {"locationId": "456"}]}
                ),
                f"{handler.root_url}{get_details_url(location_id)}": MockResponse(
                    200, {"registrationStatus": "Active"}
                ),
                f"{handler.root_url}{get_details_url('456')}": MockResponse(
                    200, {"registrationStatus": "Deregistered"}
                ),
            },
        )
        result = await handler.fetch_data_for_asset_specification(
            {}, f"{handler.root_url}{search_url}"
        )
        assert len(result) == 1
        assert result[0].id == self.asset.id

        assert client.call_counts[f"{handler.root_url}{search_url}"] == 1
        assert client.call_counts[f"{handler.root_url}{get_details_url(location_id)}"] == 1
        assert client.call_counts[f"{handler.root_url}{get_details_url('456')}"] == 1

    async def test_fetch_data_gets_second_page(self, monkeypatch):
        handler = CqcDataSourceHandler("123")
        monkeypatch.setattr(ExternalAssetMapper, "map_from_cqc", self.fake_map)
        page_2_url = "locations/page2"
        client = await monkeypatch_client(
            monkeypatch,
            {
                f"{handler.root_url}{search_url}": MockResponse(
                    200, {"locations": [{"locationId": location_id}], "nextPageUri": page_2_url}
                ),
                f"{handler.root_url}{get_details_url(location_id)}": MockResponse(
                    200, {"registrationStatus": "Active"}
                ),
                f"{handler.root_url}{get_details_url('456')}": MockResponse(
                    200, {"registrationStatus": "Active"}
                ),
                f"{handler.root_url}/{page_2_url}": MockResponse(
                    200, {"locations": [{"locationId": "456"}]}
                ),
            },
        )
        result = await handler.fetch_data_for_asset_specification(
            {}, f"{handler.root_url}{search_url}"
        )
        assert len(result) == 2
        assert result[0].id == self.asset.id
        assert result[1].id == self.asset.id

        assert client.call_counts[f"{handler.root_url}{search_url}"] == 1
        assert client.call_counts[f"{handler.root_url}/{page_2_url}"] == 1
        assert client.call_counts[f"{handler.root_url}{get_details_url(location_id)}"] == 1
        assert client.call_counts[f"{handler.root_url}{get_details_url('456')}"] == 1
