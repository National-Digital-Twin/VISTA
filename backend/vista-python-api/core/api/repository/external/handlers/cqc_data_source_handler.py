"""Handler for the CQC data source."""

from asyncio import as_completed, create_task
from typing import ClassVar

from django.conf import settings

from api.repository.external.external_asset_mapper import ExternalAssetMapper

from .base import DataSourceHandler


class CqcDataSourceHandler(DataSourceHandler):
    """Handler for the CQC data source."""

    root_url: ClassVar[str] = "https://api.service.cqc.org.uk/public/v1"
    headers: ClassVar[dict] = {"Ocp-Apim-Subscription-Key": settings.CQC_API_KEY}

    def build_urls_for_data_source(self):
        """Build the URLs for fetching the data per the specification given."""
        return [f"{self.root_url}/locations?localAuthority={self.locator}&careHome=Y&perPage=1000"]

    async def fetch_data_for_asset_specification(self, asset_specification, url):
        """Fetch the OS NGD data per the specification given."""
        all_locations = []
        current_url = url
        while current_url:
            response = await self.fetch_from_url_with_retry(url, headers=self.headers)
            all_locations.extend(response["locations"])
            current_url = (
                f"{self.root_url}/{response['nextPageUri']}" if response["nextPageUri"] else None
            )

        tasks = {
            create_task(self.fetch_location_details(location["locationId"])): location
            for location in all_locations
        }

        locations = []

        for task in as_completed(tasks):
            try:
                result = await task
                locations.append(result)
            except Exception as e:
                self.logger.exception("Error %s fetching locations", e)

        return [
            ExternalAssetMapper.map_from_cqc(location, asset_specification)
            for location in locations
            if location["registrationStatus"] != "Deregistered"
        ]

    async def _fetch_location_details(self, location_id):
        return await self.fetch_from_url_with_retry(
            f"{self.root_url}/locations/{location_id}", headers=self.headers
        )
