"""Command to refresh underlying data."""

import csv
import logging
import uuid
from pathlib import Path

from api.models.asset import Asset
from api.models.dependency import Dependency
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    """Command to load dependency data from a CSV."""

    logger = logging.getLogger(__name__)

    def get_dependencies_from_csv(self, assets):
        """Fetch the CSV and interpret into dependencies."""
        base_dir = Path(__file__).parent
        data_path = Path(base_dir, "..", "..", "data", "dependencies.csv")
        data_path = Path.resolve(data_path)
        asset_cache = {a.external_id: a for a in assets}

        with Path.open(data_path) as f:
            reader = csv.DictReader(f)
            dependencies = []
            for row in reader:
                dependency = Dependency()
                dependency.id = uuid.uuid4()
                if row.get("from_asset") in asset_cache and row.get("to_asset") in asset_cache:
                    dependency.provider_asset = asset_cache[row.get("from_asset")]
                    dependency.dependent_asset = asset_cache[row.get("to_asset")]
                    dependencies.append(dependency)
            return dependencies

    def handle(self, **_kwargs):
        """Command to load external data into the application's database."""
        assets = Asset.objects.all()
        dependencies = self.get_dependencies_from_csv(assets)
        self.logger.info("Fetched %s dependencies", len(dependencies))

        Dependency.objects.all().delete()
        Dependency.objects.bulk_create(dependencies)
