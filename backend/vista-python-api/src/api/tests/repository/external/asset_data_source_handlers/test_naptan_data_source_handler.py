# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Test cases for the NaPTAN data source handler."""

from typing import ClassVar
from uuid import uuid4

from api.models.asset import Asset
from api.repository.external.asset_data_source_handlers.naptan_data_source_handler import (
    NaptanDataSourceHandler,
)
from api.repository.external.external_asset_mapper import ExternalAssetMapper

from .utils import MockResponse, monkeypatch_client

area_code = "123"


class TestBuildUrlsForDataSource:
    """Tests for the `build_urls_for_data_source` method."""

    def test_correct_url_returned(self):
        handler = NaptanDataSourceHandler(area_code)
        result = handler.build_urls_for_data_source({})[0]
        assert (
            result
            == f"https://naptan.api.dft.gov.uk/v1/access-nodes?dataFormat=csv&atcoAreaCodes={area_code}"
        )


class TestFetchDataForAssetSpecification:
    """Tests for the `fetch_data_for_asset_specification` method."""

    asset = Asset(id=uuid4())
    asset_specification: ClassVar = {"filters": []}
    url = "test.com/naptan"

    def fake_map(self, naptan_stop, asset_specification):  # noqa: ARG002
        self.asset.id = naptan_stop["ATCOCode"]
        return self.asset

    async def test_fetch_data_for_one_stop_no_duplicates_or_filters(self, monkeypatch):
        handler = NaptanDataSourceHandler(area_code)
        monkeypatch.setattr(ExternalAssetMapper, "map_from_naptan", self.fake_map)
        csv_text = """ATCOCode\n23000002001A"""
        client = await monkeypatch_client(monkeypatch, {self.url: MockResponse(200, text=csv_text)})
        result = await handler.fetch_data_for_asset_specification(
            self.asset_specification, self.url
        )

        assert len(result) == 1
        assert result[0].id == self.asset.id
        assert client.call_counts[self.url] == 1

    async def test_fetch_data_for_two_stops_duplicate_names_returns_one(self, monkeypatch):
        handler = NaptanDataSourceHandler(area_code)
        monkeypatch.setattr(ExternalAssetMapper, "map_from_naptan", self.fake_map)
        csv_text = (
            """ATCOCode,CommonName,LocalityName\n23000002001A,Apple,A\n23000002001B,Apple,A"""
        )
        url = "test.com/naptan"
        client = await monkeypatch_client(monkeypatch, {url: MockResponse(200, text=csv_text)})
        result = await handler.fetch_data_for_asset_specification(self.asset_specification, url)

        assert len(result) == 1
        assert result[0].id == self.asset.id
        assert client.call_counts[url] == 1

    async def test_fetch_data_for_two_stops_filters_correctly(self, monkeypatch):
        asset_specification = {
            "filters": [
                {"filterName": "StopType", "filterValue": ["RSE", "TMU"]},
                {"filterName": "Status", "filterValue": "active"},
            ]
        }
        handler = NaptanDataSourceHandler(area_code)
        monkeypatch.setattr(ExternalAssetMapper, "map_from_naptan", self.fake_map)
        csv_text = """ATCOCode,CommonName,LocalityName,StopType,Status\n23000002001A,Apple,A,BCT \
        ,inactive\n23000002001B,Banana,B,RSE,active"""
        url = "test.com/naptan"
        client = await monkeypatch_client(monkeypatch, {url: MockResponse(200, text=csv_text)})
        result = await handler.fetch_data_for_asset_specification(asset_specification, url)

        assert len(result) == 1
        assert result[0].id == "23000002001B"
        assert client.call_counts[url] == 1
