# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Command to refresh road network data from OS NGD."""

import asyncio
import logging
import time

from asgiref.sync import async_to_sync
from django.conf import settings
from django.core.management.base import BaseCommand

from api.models.road_link import RoadLink
from api.repository.external.asset_data_source_handlers.base import DataSourceHandler
from api.repository.external.road_link_mapper import RoadLinkMapper

ISLE_OF_WIGHT_BBOX = "-1.585464,50.562959,-0.926285,50.761219"
OS_NGD_BASE_URL = "https://api.os.uk/features/ngd/ofa/v1/collections"
ROAD_LINK_COLLECTION = "trn-ntwk-roadlink-4"
SPEED_COLLECTION = "trn-rami-averageandindicativespeed-1"

PAGE_SIZE = 100
PAGES_PER_WORKER = 10  # Each worker fetches 1000 features
NUM_WORKERS = 5


class RoadNetworkHandler(DataSourceHandler):
    """Handler for fetching road network data from OS NGD."""

    def __init__(self):
        """Construct instance with Isle of Wight bbox."""
        super().__init__(ISLE_OF_WIGHT_BBOX)
        self.logger = logging.getLogger(__name__)

    async def fetch_all_from_collection(self, collection: str) -> list[dict]:
        """Fetch all features from a collection with concurrent workers."""
        url = (
            f"{OS_NGD_BASE_URL}/{collection}/items"
            f"?key={settings.OS_NGD_API_KEY}&bbox={self.locator}"
        )
        return await self._fetch_paginated(url, collection)

    async def _fetch_paginated(self, base_url: str, collection: str) -> list[dict]:
        """Paginate through all results for a given base URL.

        Workers fetch chunks in parallel (0-1k, 1k-2k, etc).
        After each round, check if we hit the end and need more.
        """
        all_features = []
        round_start_page = 0

        while True:
            tasks = []
            for i in range(NUM_WORKERS):
                start_page = round_start_page + (i * PAGES_PER_WORKER)
                tasks.append(self._fetch_page_range(base_url, start_page, PAGES_PER_WORKER))

            results = await asyncio.gather(*tasks)

            hit_end = False
            for features, worker_hit_end in results:
                all_features.extend(features)
                if worker_hit_end:
                    hit_end = True

            self.logger.info("Fetched %s features so far from %s", len(all_features), collection)

            if hit_end:
                break

            round_start_page += NUM_WORKERS * PAGES_PER_WORKER

        return all_features

    async def _fetch_page_range(
        self, base_url: str, start_page: int, num_pages: int
    ) -> tuple[list[dict], bool]:
        """Fetch a range of pages sequentially. Returns (features, hit_end)."""
        features = []
        for page in range(start_page, start_page + num_pages):
            offset = page * PAGE_SIZE
            response = await self.fetch_from_url_with_retry(
                f"{base_url}&offset={offset}&limit={PAGE_SIZE}"
            )
            if not response:
                return features, True

            page_features = response.get("features", [])
            features.extend(page_features)

            if len(page_features) < PAGE_SIZE:
                return features, True

        return features, False


class Command(BaseCommand):
    """Refresh road network data from OS NGD.

    Fetches from two collections:
    1. trn-ntwk-roadlink-4 - Road geometry, directionality, classification
    2. trn-rami-averageandindicativespeed-1 - Speed limits (joined by osid)

    Writes data to the RoadLink table.
    """

    help = "Refresh road network data from OS NGD Road Links and RAMI speed data"
    logger = logging.getLogger(__name__)

    def handle(self, *_args, **_kwargs):
        """Fetch road network and save to RoadLink table."""
        start_time = time.perf_counter()
        self.logger.info("Starting road network refresh...")

        road_links = async_to_sync(self._fetch_and_build_road_links)()
        self.logger.info("Fetched %s road links", len(road_links))

        RoadLink.objects.all().delete()
        RoadLink.objects.bulk_create(road_links, batch_size=1000)

        self.logger.info("Road network refresh complete in %ss", time.perf_counter() - start_time)

    async def _fetch_and_build_road_links(self) -> list[RoadLink]:
        """Fetch road links and speed data in parallel, then combine them."""
        handler = RoadNetworkHandler()

        self.logger.info("Fetching road links and speed data in parallel...")
        road_link_features, speed_features = await asyncio.gather(
            handler.fetch_all_from_collection(ROAD_LINK_COLLECTION),
            handler.fetch_all_from_collection(SPEED_COLLECTION),
        )
        self.logger.info(
            "Fetched %s road links and %s speed records",
            len(road_link_features),
            len(speed_features),
        )

        speed_lookup = self._build_speed_lookup(speed_features)
        self.logger.info("Built speed lookup with %s entries", len(speed_lookup))

        return [
            RoadLinkMapper.map_from_os_ngd(feature, speed_lookup) for feature in road_link_features
        ]

    def _build_speed_lookup(self, speed_features: list[dict]) -> dict[str, float]:
        """Build lookup from road link OSID to speed limit in mph."""
        lookup = {}
        for feature in speed_features:
            props = feature.get("properties", {})
            osid = props.get("osid")
            if not osid:
                continue

            speed_mph = props.get("indicativespeedlimit_mph")
            if speed_mph:
                lookup[osid] = float(speed_mph)

        return lookup
