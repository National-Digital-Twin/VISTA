"""Handler for the OS Names data source."""

from django.conf import settings

from api.repository.external.external_asset_mapper import ExternalAssetMapper

from .base import DataSourceHandler


class OsNamesDataSourceHandler(DataSourceHandler):
    """Handler for the OS Names data source."""

    def build_urls_for_data_source(self, asset_specification):
        """Build the URLs for fetching the data per the specification given."""
        return [
            f"https://api.os.uk/search/names/v1/find?key={settings.OS_NAMES_API_KEY}\
            &query=Wight&fq=BBOX:{self.locator}&fq=LOCAL_TYPE:{asset_specification['description'][0]}"
        ]

    async def fetch_data_for_asset_specification(self, asset_specification, url):
        """Fetch the OS NGD data per the specification given."""
        data = await self.fetch_from_url_with_retry(url)
        return [
            ExternalAssetMapper.map_from_os_names(result["GAZETTEER_ENTRY"], asset_specification)
            for result in data["results"]
        ]
