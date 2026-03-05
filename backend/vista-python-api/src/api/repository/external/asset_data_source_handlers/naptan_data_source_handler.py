# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Handler for the NAPTAN data source."""

from functools import reduce

from api.repository.external.external_asset_mapper import ExternalAssetMapper

from .base import DataSourceHandler


class NaptanDataSourceHandler(DataSourceHandler):
    """Handler for the NAPTAN data source."""

    def build_urls_for_data_source(self, _asset_specification):
        """Build the URLs for fetching the data per the specification given."""
        return [
            f"https://naptan.api.dft.gov.uk/v1/access-nodes?dataFormat=csv&atcoAreaCodes={self.locator}"
        ]

    async def fetch_data_for_asset_specification(self, asset_specification, url):
        """Fetch the OS NGD data per the specification given."""
        stops = await self.fetch_csv_from_url(url)
        unique_stops = reduce(self._merge_stops_with_same_name_at_same_location(set()), stops, [])
        return [
            ExternalAssetMapper.map_from_naptan(stop, asset_specification)
            for stop in unique_stops
            if self._is_stop_match_for_asset_specification_filters(
                stop, asset_specification["filters"]
            )
        ]

    def _merge_stops_with_same_name_at_same_location(self, seen):
        def reduce(stops, next_stop):
            if "CommonName" not in next_stop:
                stops.append(next_stop)
            else:
                location = f"{next_stop['CommonName']}_{next_stop['LocalityName']}"
                if location in seen:
                    return stops
                seen.add(location)
                stops.append(next_stop)
            return stops

        return reduce

    def _is_stop_match_for_asset_specification_filters(self, stop, data_filters):
        if data_filters:
            conditions = []
            for data_filter in data_filters:
                if isinstance(data_filter["filterValue"], list):
                    conditions.append(
                        any(
                            stop[f"{data_filter['filterName']}"] == filter_value
                            for filter_value in data_filter["filterValue"]
                        )
                    )
                else:
                    conditions.append(
                        stop[f"{data_filter['filterName']}"] == data_filter["filterValue"]
                    )
            return all(conditions)
        return True
