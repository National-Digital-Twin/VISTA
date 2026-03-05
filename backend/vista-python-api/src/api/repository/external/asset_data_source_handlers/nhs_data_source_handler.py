# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Handler for the NHS data source."""

import logging

from api.repository.external.external_asset_mapper import ExternalAssetMapper

from .base import DataSourceHandler


class NhsDataSourceHandler(DataSourceHandler):
    """Handler for the NHS data source."""

    _PACKAGE_ID = "consolidated-pharmaceutical-list"

    logger = logging.getLogger(__name__)

    def build_urls_for_data_source(self, _asset_specification):
        """Build the URLs for fetching the data per the specification given."""
        return ["https://opendata.nhsbsa.net/api/3/action/datastore_search_sql"]

    async def fetch_data_for_asset_specification(self, asset_specification, url):
        """Fetch the NHS data per the specification given."""
        table_name = await self.get_package_latest_resource()
        sql_query = (
            f"SELECT * from `{table_name}` WHERE HEALTH_AND_WELLBEING_BOARD = 'ISLE OF WIGHT'"
        )

        params = {"resource_id": table_name, "sql": sql_query}
        response = await self.fetch_from_url_with_retry(url, params=params)
        records = response["result"]["result"]["records"]

        if not records:
            raise ValueError(f"No data found {sql_query}")
        return await self.process_data(records, asset_specification)

    async def get_package_latest_resource(self) -> str:
        """Get the ID of the latest resource in the package."""
        params = {"id": self._PACKAGE_ID}
        response = await self.fetch_from_url_with_retry(
            "https://opendata.nhsbsa.net/api/3/action/package_show", params=params
        )
        result = response["result"]

        if "resources" not in result:
            raise ValueError("No resources found in the package")

        resources = sorted(
            result["resources"],
            key=lambda x: x.get("metadata_modified", ""),
            reverse=True,
        )

        return resources[0]["name"]

    async def process_data(self, records: list[dict], asset_specification) -> list[dict]:
        """Process records to get coordinates."""
        assets = []
        geocode_failures = 0

        for record in records:
            coords = await self.geocode_address(
                [
                    record.get("ADDRESS_FIELD_1", ""),
                    record.get("ADDRESS_FIELD_2", ""),
                    record.get("ADDRESS_FIELD_3", ""),
                    record.get("ADDRESS_FIELD_4", ""),
                    record.get("POST_CODE", ""),
                ]
            )

            if coords:
                asset = ExternalAssetMapper.map_from_nhs(record, coords, asset_specification)
                assets.append(asset)
            else:
                geocode_failures += 1

        self.logger.info("Successfully processed %s pharmacies", len(assets))
        self.logger.info("Failed to geocode %s addresses", geocode_failures)

        return assets

    async def geocode_address(self, address_parts: list[str]) -> tuple[float, float] | None:
        """Geocode an address using Photon API from Komoot."""
        address_str = ", ".join([part for part in address_parts if part and part.strip()])

        try:
            params = {"q": address_str, "format": "jsonv2"}

            self.logger.info("Geocoding address: %s", address_str)
            response = await self.fetch_from_url(
                "https://nominatim.openstreetmap.org/search", params=params
            )

            if response and len(response) > 0:
                lon = float(response[0]["lon"])
                lat = float(response[0]["lat"])
                return lat, lon
            self.logger.error(
                "Failed to geocode address: %s with request params: %s", address_str, params
            )
            return None
        except Exception as e:
            self.logger.error("Error geocoding address %s: %s", address_str, e)
            return None
