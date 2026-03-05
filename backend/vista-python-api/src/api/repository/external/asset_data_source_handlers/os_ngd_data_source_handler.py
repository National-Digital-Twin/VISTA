# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Handler for the OS NGD data source."""

import urllib
import warnings
from typing import ClassVar

from django.conf import settings

from api.models.asset import Asset
from api.repository.external.external_asset_mapper import ExternalAssetMapper

from .base import DataSourceHandler


class OsNgdDataSourceHandler(DataSourceHandler):
    """Handler for the OS NGD data source."""

    filterable_fields: ClassVar[list[str]] = ["buildinguse", "roadstructure"]
    os_ngd_response_page_size: ClassVar[int] = 100

    def build_urls_for_data_source(self, asset_specification):
        """Build the URLs for fetching the data per the specification given."""
        query_strings = self._build_query_strings(asset_specification)
        return [
            f"https://api.os.uk/features/ngd/ofa/v1/collections/"
            f"{asset_specification['collection']}/items{query_string}"
            for query_string in query_strings
        ]

    async def fetch_data_for_asset_specification(
        self, asset_specification, url: str
    ) -> list[Asset]:
        """Fetch the OS NGD data per the specification given."""
        fetch_next_page = True
        offset = 0
        assets = []
        while fetch_next_page:
            offset_url = url + f"&offset={offset}"
            response = await self.fetch_from_url_with_retry(offset_url)
            fetch_next_page = (
                response["numberReturned"] == self.os_ngd_response_page_size
                if "numberReturned" in response
                else False
            )
            offset += self.os_ngd_response_page_size
            filtered_assets = []
            for feature in response["features"]:
                mapped_asset = ExternalAssetMapper.map_from_os_ngd(feature, asset_specification)
                if "filters" in asset_specification:
                    if self._is_feature_match_for_asset_specification_filter(
                        asset_specification["filters"], feature
                    ):
                        filtered_assets.append(mapped_asset)
                else:
                    filtered_assets.append(mapped_asset)
            assets.extend(filtered_assets)
        return assets

    def _build_query_string(
        self, all_filters: dict[str, str], filters: list[tuple[str, str]] | None = None
    ) -> str:
        filters = [] if filters is None else filters
        for key, value in all_filters.items():
            if isinstance(value, str) and key in self.filterable_fields:
                filters.append((key, value))

        filter_parts = [
            f"filter={urllib.parse.quote(key)}='{urllib.parse.quote(val)}'" for key, val in filters
        ]
        filter_str = "&".join(filter_parts)

        if all_filters.get("cqlFilter"):
            if filters:
                warnings.warn(
                    f"Do not specify other filters when using cqlFilter: {all_filters}",
                    stacklevel=2,
                )
            filter_str = f"filter={urllib.parse.quote(all_filters['cqlFilter'])}"

        if filter_str:
            return f"?key={settings.OS_NGD_API_KEY}&bbox={self.locator}&{filter_str}"
        return f"?key={settings.OS_NGD_API_KEY}&bbox={self.locator}"

    def _build_query_strings(self, filters: dict[str, str | list[str]]) -> list[str]:
        description = filters.get("description")

        if not description:
            return [self._build_query_string(filters, [])]

        if not isinstance(description, list):
            description = [description]

        query_strings = []
        for desc in description:
            all_filters = [("description", desc)]
            query = self._build_query_string(filters, all_filters)
            query_strings.append(query)
        return query_strings

    def _is_feature_match_for_asset_specification_filter(self, data_filters, feature) -> bool:
        if data_filters:
            matches_all_filters = True
            for data_filter in data_filters:
                if isinstance(data_filter["filterValue"], list):
                    matches_all_filters = self._is_match_for_any_filter_value(feature, data_filter)
                else:
                    matches_all_filters = (
                        "properties" in feature
                        and feature["properties"].get(data_filter["filterName"])
                        == data_filter["filterValue"]
                    )
            return matches_all_filters
        return True

    def _is_match_for_any_filter_value(self, feature, data_filter):
        return any(
            "properties" in feature and feature["properties"].get(data_filter["filterName"]) == prop
            for prop in data_filter["filterValue"]
        )
