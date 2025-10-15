"""Command to refresh underlying data."""

import json
import logging
import time
from asyncio import as_completed, create_task
from pathlib import Path

from api.models.asset import Asset
from api.repository.external.asset_repository import fetch
from asgiref.sync import async_to_sync
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    """Command to refresh underlying data."""

    logger = logging.getLogger(__name__)

    async def fetch_all_for_source(self, asset_specifications, source):
        """Create and dispatch asynchronous tasks to get data for each asset specification."""
        start_time = time.perf_counter()
        tasks = {create_task(fetch(spec)): spec for spec in asset_specifications}

        new_assets = []

        self.logger.info("Dispatching %s %s fetch tasks...", len(tasks), source)

        for task in as_completed(tasks):
            spec_start = time.perf_counter()
            try:
                result = await task
                duration = time.perf_counter() - spec_start

                new_assets.extend(result)
                self.logger.info("Fetched %s assets  in %ss", len(result), duration)
            except Exception:
                duration = time.perf_counter() - spec_start
                self.logger.exception("Error fetching assets  in %ss", duration)

        total_time = time.perf_counter() - start_time
        self.logger.info(
            "Completed %s fetches in %ss total and fetched {len(new_assets)} assets.",
            len(asset_specifications),
            total_time,
        )

        return new_assets

    def get_asset_specifications_for_source(self, source):
        """Fetch the asset specifications for the given source."""
        base_dir = Path.parent(__file__)
        data_path = Path(base_dir, "..", "..", "data", f"{source}-asset-specifications.json")
        data_path = Path.resolve(data_path)

        with Path.open(data_path) as f:
            return json.load(f)

    async def get_assets(self):
        """Asynchronously query the data sources based on a set of asset specifications."""
        sources = ["os-ngd", "os-names", "naptan", "cqc", "nhs"]
        tasks = {
            create_task(
                self.fetch_all_for_source(self.get_asset_specifications_for_source(source), source)
            ): source
            for source in sources
        }
        assets = []

        for task in as_completed(tasks):
            try:
                result = await task
                assets.extend(result)
            except Exception as e:
                self.logger.exception("Error %s fetching assets", e)

        return assets

    def handle(self):
        """Command to load external data into the application's database."""
        assets = async_to_sync(self.get_assets)()

        Asset.objects.all().delete()
        Asset.objects.bulk_create(assets)
