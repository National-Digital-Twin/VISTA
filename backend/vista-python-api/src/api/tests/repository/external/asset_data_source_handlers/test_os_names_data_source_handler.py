# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Test cases for the OS Names data source handler."""

from typing import ClassVar
from uuid import uuid4

from django.conf import settings

from api.models.asset import Asset
from api.repository.external.asset_data_source_handlers.os_names_data_source_handler import (
    OsNamesDataSourceHandler,
)
from api.repository.external.external_asset_mapper import ExternalAssetMapper

from .utils import MockResponse, monkeypatch_client

coordinates = "123"
description = "test"
url = f"https://api.os.uk/search/names/v1/find?key={settings.OS_NAMES_API_KEY}\
            &query=Wight&fq=BBOX:{coordinates}&fq=LOCAL_TYPE:{description}"


class TestBuildUrlsForDataSource:
    """Tests for the `build_urls_for_data_source` method."""

    def test_correct_url_returned(self):
        handler = OsNamesDataSourceHandler(coordinates)
        result = handler.build_urls_for_data_source({"description": [description]})[0]
        assert result == url


class TestFetchDataForAssetSpecification:
    """Tests for the `fetch_data_for_asset_specification` method."""

    asset = Asset(id=uuid4())
    asset_specification: ClassVar = {"filters": []}

    def fake_map(self, entry, asset_specification):  # noqa: ARG002
        self.asset.id = entry["ID"]
        return self.asset

    async def test_fetch_data_for_one_entry_no_duplicates_is_successful(self, monkeypatch):
        handler = OsNamesDataSourceHandler(coordinates)
        monkeypatch.setattr(ExternalAssetMapper, "map_from_os_names", self.fake_map)
        client = await monkeypatch_client(
            monkeypatch,
            {url: MockResponse(200, {"results": [{"GAZETTEER_ENTRY": {"ID": uuid4()}}]})},
        )
        result = await handler.fetch_data_for_asset_specification(self.asset_specification, url)

        assert len(result) == 1
        assert result[0].id == self.asset.id
        assert client.call_counts[url] == 1

    async def test_fetch_data_with_duplicate_names_merges_successfully(self, monkeypatch):
        handler = OsNamesDataSourceHandler(coordinates)
        monkeypatch.setattr(ExternalAssetMapper, "map_from_os_names", self.fake_map)
        client = await monkeypatch_client(
            monkeypatch,
            {
                url: MockResponse(
                    200,
                    {
                        "results": [
                            {
                                "GAZETTEER_ENTRY": {
                                    "ID": uuid4(),
                                    "NAME1": "apple",
                                    "GEOMETRY_X": 0,
                                    "GEOMETRY_Y": 1,
                                }
                            },
                            {
                                "GAZETTEER_ENTRY": {
                                    "ID": uuid4(),
                                    "NAME1": "apple",
                                    "GEOMETRY_X": 0,
                                    "GEOMETRY_Y": 1,
                                }
                            },
                        ]
                    },
                )
            },
        )
        result = await handler.fetch_data_for_asset_specification(self.asset_specification, url)

        assert len(result) == 1
        assert result[0].id == self.asset.id
        assert client.call_counts[url] == 1
