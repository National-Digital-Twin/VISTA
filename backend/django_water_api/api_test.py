import requests
import json

# The URL of your running Django server
url = "http://127.0.0.1:8000/api/exposurelayers/"

print(f"Attempting to connect to {url}...")

try:
    # Make the GET request
    response = requests.get(url)
    
    # Check if the request was successful (HTTP 200)
    if response.status_code == 200:
        print("Success! Endpoint returned a 200 OK.")
        
        # Parse the JSON response
        data = response.json()
        
        print(f"Successfully retrieved {len(data)} water body polygons.")
        
        # Print info about the first item as a sample
        if data:
            print("\n--- Sample Data (First Item) ---")
            print(f"  ID:   {data[0].get('id')}")
            print(f"  Name: {data[0].get('name')}")
            print(f"  Type: {data[0].get('geometry', {}).get('type')}")
            # Only print a snippet of the long coordinates
            coords_str = json.dumps(data[0].get('geometry', {}).get('coordinates'))
            print(f"  Coords (snippet): {coords_str[:70]}...")

    else:
        print(f"Error: Endpoint returned status code {response.status_code}")
        print("Response text:", response.text)

except requests.exceptions.ConnectionError:
    print(f"Error: Could not connect to {url}")
    print("Is your Django server running? (python manage.py runserver)")
except Exception as e:
    print(f"An unexpected error occurred: {e}")