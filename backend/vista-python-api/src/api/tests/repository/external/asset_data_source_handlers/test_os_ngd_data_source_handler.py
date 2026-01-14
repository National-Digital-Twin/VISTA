"""Test cases for the OS NGD data source handler."""

from dataclasses import dataclass
from uuid import uuid4

import pytest
from django.conf import settings

from api.models.asset import Asset
from api.repository.external.asset_data_source_handlers.os_ngd_data_source_handler import (
    OsNgdDataSourceHandler,
)
from api.repository.external.external_asset_mapper import ExternalAssetMapper

from .utils import MockResponse, monkeypatch_client

coordinates = "123"
description = "test"
root_url = "https://api.os.uk/features/ngd/ofa/v1/collections/"


@dataclass
class TestCase:
    """Represents data that should be supplied to an asset specification."""

    description: list[str] | None
    collection: str
    cql_filter: str | None
    filters: list[dict]


def build_asset_spec(test_case: TestCase):
    """Build an asset_specification from a TestCase."""
    asset_specification = {"collection": test_case.collection}
    if test_case.cql_filter:
        asset_specification["cqlFilter"] = test_case.cql_filter
    if test_case.description:
        asset_specification["description"] = test_case.description
    if test_case.filters:
        asset_specification["filters"] = test_case.filters
    return asset_specification


test_params = [
    (
        TestCase(
            ["Telephone Exchange"],
            "bld-fts-building-4",
            None,
            [{"filterName": "physicalcontainment", "filterValue": "In Culvert"}],
        ),
        f"{root_url}bld-fts-building-4/items?key=abc&bbox=123&filter=description='Telephone%20Exchange'",
    ),
    (
        TestCase(
            None,
            "bld-fts-building-4",
            "description='Commercial Building' AND buildinguse='Commercial Activity: Retail'",
            [{"filterName": "buildinguse", "filterValue": ["commercial", "residential"]}],
        ),
        f"{root_url}bld-fts-building-4/items?key=abc&bbox=123&filter=description%3D%27Commercial%20Building%27%20AND%20buildinguse%3D%27Commercial%20Activity%3A%20Retail%27",
    ),
]


class TestBuildUrlsForDataSource:
    """Tests for the `build_urls_for_data_source` method."""

    @pytest.mark.parametrize(
        ("test_case", "expected"),
        test_params,
        ids=["description", "cql_filter"],
    )
    def test_correct_url_returned(self, test_case, expected):
        handler = OsNgdDataSourceHandler(coordinates)
        result = handler.build_urls_for_data_source(build_asset_spec(test_case))[0]
        assert result == expected


class TestFetchDataForAssetSpecification:
    """Tests for the `fetch_data_for_asset_specification` method."""

    def fake_map(self, feature, asset_specification):  # noqa: ARG002
        return Asset(id=feature["id"])

    @pytest.mark.parametrize(
        ("test_case", "url"),
        test_params,
        ids=["description", "cql_filter"],
    )
    async def test_fetch_data_for_one_entry_is_successful(self, test_case, url, monkeypatch):
        handler = OsNgdDataSourceHandler(coordinates)
        asset_specification = build_asset_spec(test_case)
        monkeypatch.setattr(ExternalAssetMapper, "map_from_os_ngd", self.fake_map)
        known_id = uuid4()
        client = await monkeypatch_client(
            monkeypatch,
            {
                f"{url}&offset=0": MockResponse(
                    200,
                    {
                        "features": [
                            {
                                "id": known_id,
                                "properties": {
                                    "physicalcontainment": "In Culvert",
                                    "buildinguse": "commercial",
                                },
                            },
                            {
                                "id": uuid4(),
                                "properties": {
                                    "physicalcontainment": "Inapplicable",
                                    "buildinguse": "other",
                                },
                            },
                        ]
                    },
                )
            },
        )
        result = await handler.fetch_data_for_asset_specification(asset_specification, url)

        assert len(result) == 1
        assert result[0].id == known_id
        assert client.call_counts[f"{url}&offset=0"] == 1
