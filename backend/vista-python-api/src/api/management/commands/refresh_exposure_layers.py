"""Management command to refresh exposure layers."""

import json
from pathlib import Path

from django.conf import settings
from django.contrib.gis.geos import GEOSGeometry
from django.core.management.base import BaseCommand

from api.models import ExposureLayer


class Command(BaseCommand):
    """Command to delete existing water bodies and reload them from a JSON file."""

    help = "Deletes existing water bodies and reloads them from a JSON file."

    def add_arguments(self, parser):
        """Accept an optional file path argument."""
        parser.add_argument(
            "file_path",
            type=str,
            nargs="?",
            help="Path to the water bodies data JSON file",
        )

    def handle(self, **options):
        """Handle filepath provided by user or a default path to the json file."""
        user_input = options["file_path"]

        # Ensure BASE_DIR is treated as a Path object
        base_dir = Path(settings.BASE_DIR)
        data_dir = base_dir / "api" / "data"
        default_path = data_dir / "water_bodies_data.json"

        # Determine the file path to use
        file_path = default_path
        if user_input:
            input_path = Path(user_input)
            # Check if the user input exists as an absolute or relative path
            if input_path.exists():
                file_path = input_path
            # Check if the input is a filename inside the default api/data folder
            elif (data_dir / user_input).exists():
                file_path = data_dir / user_input
            else:
                self.stdout.write(self.style.ERROR(f"File not found: {user_input}"))
                return

        self.stdout.write(f"Reading data from: {file_path}")

        if not file_path.exists():
            self.stdout.write(self.style.ERROR(f"Target file does not exist: {file_path}"))
            return

        # Clear existing data
        self.stdout.write("Deleting existing ExposureLayers...")
        count, _ = ExposureLayer.objects.all().delete()
        self.stdout.write(f"Deleted {count} items.")

        # Load new data from JSON
        self.stdout.write("Loading new data...")
        try:
            with file_path.open("r") as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            self.stdout.write(self.style.ERROR(f"Invalid JSON: {e!s}"))
            return

        # Parse and Prepare Objects
        objects_to_create = []
        for item in data:
            try:
                geom = GEOSGeometry(json.dumps(item["geometry"]))

                obj = ExposureLayer(id=item["id"], name=item["name"], geometry=geom)
                objects_to_create.append(obj)
            except Exception as e:
                msg = f"Skipping item {item.get('name', 'Unknown')}: {e!s}"
                self.stdout.write(self.style.WARNING(msg))

        # Bulk Insert to Database
        ExposureLayer.objects.bulk_create(objects_to_create, batch_size=1000)

        self.stdout.write(
            self.style.SUCCESS(f"Successfully loaded {len(objects_to_create)} water bodies.")
        )
