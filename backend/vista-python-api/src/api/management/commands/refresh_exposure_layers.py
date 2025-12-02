import json
import os
from django.conf import settings
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import GEOSGeometry
from api.models import ExposureLayer

class Command(BaseCommand):
    help = 'Deletes existing water bodies and reloads them from a JSON file.'

    def add_arguments(self, parser):
        """Accept an optional file path argument"""
        parser.add_argument('file_path', type=str, nargs='?', help='Path to the water bodies data JSON file')

    def handle(self, *args, **options):
        """Handle filepath provided by user or a default path to the json file"""
        user_input = options['file_path']

        default_path = os.path.join(settings.BASE_DIR, 'api', 'data', 'water_bodies_data.json')

        # Determine the file path to use
        if user_input:
            # Check if the user input exists
            if os.path.exists(user_input):
                file_path = user_input
            # Check if the input is a filename inside the default api/data folder
            elif os.path.exists(os.path.join(settings.BASE_DIR, 'api', 'data', user_input)):
                file_path = os.path.join(settings.BASE_DIR, 'api', 'data', user_input)
            else:
                self.stdout.write(self.style.ERROR(f'File not found: {user_input}'))
                return
        else:
            # Fallback to default if no argument provided
            file_path = default_path

        self.stdout.write(f"Reading data from: {file_path}")

        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'Target file does not exist: {file_path}'))
            return

        # Clear existing data
        self.stdout.write('Deleting existing ExposureLayers...')
        count, _ = ExposureLayer.objects.all().delete()
        self.stdout.write(f'Deleted {count} items.')

        # Load new data from JSON
        self.stdout.write('Loading new data...')
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            self.stdout.write(self.style.ERROR(f'Invalid JSON: {str(e)}'))
            return

        # Parse and Prepare Objects
        objects_to_create = []
        for item in data:
            try:
                geom = GEOSGeometry(json.dumps(item['geometry']))

                obj = ExposureLayer(
                    id=item['id'],
                    name=item['name'],
                    geometry=geom
                )
                objects_to_create.append(obj)
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"Skipping item {item.get('name', 'Unknown')}: {str(e)}"))

        # Bulk Insert to Database
        ExposureLayer.objects.bulk_create(objects_to_create, batch_size=1000)

        self.stdout.write(self.style.SUCCESS(f'Successfully loaded {len(objects_to_create)} water bodies.'))
