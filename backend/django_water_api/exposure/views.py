from django.http import JsonResponse
from django.conf import settings
import json
import os

# Define the path to our pre-generated data file
DATA_FILE_PATH = os.path.join(settings.BASE_DIR, 'data', 'water_bodies_data.json')

def get_exposure_layers(request):
    """
    A high-performance view that serves a pre-generated JSON file.
    """
    try:
        # Open and load the JSON file
        with open(DATA_FILE_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Return the data as a JSON response.
        # safe=False is required because our root object is a list, not a dict.
        return JsonResponse(data, safe=False)

    except FileNotFoundError:
        return JsonResponse(
            {"error": "Data file not found. Please run the parser script."},
            status=500
        )
    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "Failed to decode data file. The file may be corrupt."},
            status=500
        )
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)