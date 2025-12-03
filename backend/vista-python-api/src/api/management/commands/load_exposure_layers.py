"""Management command to load exposure layers from a JSON file."""

import json
import logging
import uuid
from pathlib import Path

import geopandas as gpd
from django.conf import settings
from django.contrib.gis.geos import GEOSGeometry
from django.core.management.base import BaseCommand

from api.models import ExposureLayer, ExposureLayerType


class Command(BaseCommand):
    """Loads exposure layer data from files in api/data/."""

    flood_file_name = "flood_data.json"
    environmentally_sensitive_area_file_name = "environmental-stewardship-schema-areas-esa.json"
    flood_type_id = "2d373dca-1337-4e60-ba08-c8326d27042d"
    environmentally_sensitive_area_type_id = "60a0280e-bd04-4150-8a9a-f414d21cd031"

    logger = logging.getLogger(__name__)

    def get_fully_qualified_path(self, file_name):
        """Get the fully qualified path for a data file."""
        return Path(settings.BASE_DIR) / "api" / "data" / file_name

    def import_environmentally_sensitive_areas(self):
        """Import environmentally sensitive area-type exposure layers."""
        self.logger.info("Beginning import of environmentally sensitive areas")
        gdf = gpd.read_file(
            self.get_fully_qualified_path(self.environmentally_sensitive_area_file_name)
        )

        skipped_count = 0

        for _idx, row in gdf.iterrows():
            name = row.get("AGREF")

            # Check if this object already exists
            if ExposureLayer.objects.filter(name=name).exists():
                skipped_count += 1
                continue

            geom = GEOSGeometry(row.geometry.wkt)
            geom.srid = 4326

            ExposureLayer.objects.create(
                name=name,
                geometry=geom,
                type=ExposureLayerType(id=self.environmentally_sensitive_area_type_id),
            )

        if skipped_count > 0:
            self.stdout.write(
                self.style.WARNING(
                    f"Skipped {skipped_count} layers that already exist in the database."
                )
            )
        self.logger.info("Import completed successfully.")

    def import_floods(self):
        """Import flood-type exposure layers."""
        file_path = self.get_fully_qualified_path(self.flood_file_name)

        if not file_path.exists():
            self.stdout.write(self.style.ERROR(f"File not found at {file_path}"))
            return

        self.stdout.write(self.style.SUCCESS(f"Loading data from {file_path}..."))

        with file_path.open() as f:
            data = json.load(f)

        loaded_count = 0
        skipped_count = 0
        for item in data:
            item_id = uuid.UUID(item["id"])  # Convert string ID to UUID object

            # Check if this object already exists
            if ExposureLayer.objects.filter(id=item_id).exists():
                skipped_count += 1
                continue

            # The geometry data must be converted to a GEOSGeometry object
            try:
                geos_geometry = GEOSGeometry(json.dumps(item["geometry"]))
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"Error parsing geometry for {item['name']}: {e}")
                )
                continue

            try:
                ExposureLayer.objects.create(
                    id=item_id,
                    name=item["name"],
                    geometry=geos_geometry,
                    type=ExposureLayerType(id=self.flood_type_id),
                )
                loaded_count += 1
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"Error saving {item['name']} (ID: {item_id}): {e}")
                )

        self.stdout.write(
            self.style.SUCCESS(f"Successfully loaded {loaded_count} new exposure layers.")
        )
        if skipped_count > 0:
            self.stdout.write(
                self.style.WARNING(
                    f"Skipped {skipped_count} layers that already exist in the database."
                )
            )

    def handle(self, *_args, **_kwargs):
        """Handle the command execution."""
        self.import_floods()
        self.import_environmentally_sensitive_areas()
