"""Management command to load exposure layers from a JSON file."""

import json
import uuid
from pathlib import Path

from django.conf import settings
from django.contrib.gis.geos import GEOSGeometry
from django.core.management.base import BaseCommand

from api.models import ExposureLayer


class Command(BaseCommand):
    """Loads exposure layer data from a JSON file in api/data/."""

    help = "Loads exposure layer data from a JSON file in api/data/"

    def add_arguments(self, parser):
        """Add command line arguments to the parser."""
        parser.add_argument(
            "file_name",
            type=str,
            help="The name of the JSON file in the api/data/ directory.",
        )

    def handle(self, *_args, **options):
        """Handle the command execution."""
        file_name = options["file_name"]
        file_path = Path(settings.BASE_DIR) / "api" / "data" / file_name

        if not file_path.exists():  # <--- FIX for PTH110
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
