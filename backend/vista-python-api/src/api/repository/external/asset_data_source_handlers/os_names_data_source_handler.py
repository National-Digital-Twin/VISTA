# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Handler for the OS Names data source."""

from functools import reduce

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
        """Fetch the OS Names data per the specification given."""
        data = await self.fetch_from_url_with_retry(url)
        simplified_data = reduce(
            self._merge_entries_with_same_name_at_same_location(set()), data["results"], []
        )
        return [
            ExternalAssetMapper.map_from_os_names(result, asset_specification)
            for result in simplified_data
        ]

    def _merge_entries_with_same_name_at_same_location(self, seen):
        def reduce(entries, next_entry):
            entry = next_entry["GAZETTEER_ENTRY"]
            if "NAME1" not in entry:
                entries.append(entry)
            else:
                location = f"{entry['NAME1']}_{entry['GEOMETRY_X']}_{entry['GEOMETRY_Y']}"
                if location in seen:
                    return entries
                seen.add(location)
                entries.append(entry)
            return entries

        return reduce
