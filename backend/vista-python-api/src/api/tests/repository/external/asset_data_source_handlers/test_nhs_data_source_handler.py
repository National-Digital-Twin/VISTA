"""Test cases for the NHS data source handler."""

from uuid import uuid4

from api.models.asset import Asset
from api.repository.external.asset_data_source_handlers.nhs_data_source_handler import (
    NhsDataSourceHandler,
)
from api.repository.external.external_asset_mapper import ExternalAssetMapper

from .utils import MockResponse, monkeypatch_client

url = "https://opendata.nhsbsa.net/api/3/action/datastore_search_sql"


class TestBuildUrlsForDataSource:
    """Tests for the `build_urls_for_data_source` method."""

    def test_correct_url_returned(self):
        handler = NhsDataSourceHandler("")
        result = handler.build_urls_for_data_source({})[0]
        assert result == url


class TestFetchDataForAssetSpecification:
    """Tests for the `fetch_data_for_asset_specification` method."""

    asset = Asset(id=uuid4())
    package_url = "https://opendata.nhsbsa.net/api/3/action/package_show"
    geocode_url = "https://nominatim.openstreetmap.org/search"

    def fake_map(self, record, coords, asset_specification):  # noqa: ARG002
        self.asset.id = record["id"]
        return self.asset

    async def test_fetch_data_for_one_record_successfully(self, monkeypatch):
        handler = NhsDataSourceHandler("")
        monkeypatch.setattr(ExternalAssetMapper, "map_from_nhs", self.fake_map)
        client = await monkeypatch_client(
            monkeypatch,
            {
                url: MockResponse(200, {"result": {"result": {"records": [{"id": uuid4()}]}}}),
                self.package_url: MockResponse(
                    200, {"result": {"resources": [{"name": "pharmacies"}]}}
                ),
                self.geocode_url: MockResponse(200, [{"lat": 0, "lon": 1}]),
            },
        )
        result = await handler.fetch_data_for_asset_specification({}, url)

        assert len(result) == 1
        assert result[0].id == self.asset.id
        assert client.call_counts[url] == 1
