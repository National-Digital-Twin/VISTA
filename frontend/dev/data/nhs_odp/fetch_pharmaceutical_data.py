#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""
Script to fetch pharmaceutical data from NHSBSA Open Data Portal, filter for Isle of Wight,
geocode addresses, and convert to internal asset format.

This data is not updated regularly, so we manually run this every so often and update the coeff-assets-with-geometry.json file.

e.g
- run data_removal_assets.py including PharmaceuticalDispensary
- run this script
- paste the generated assets from this script into coeff-assets-with-geometry.json
"""

import json
from typing import Dict, List, Optional, Tuple

import requests

PACKAGE_ID = "consolidated-pharmaceutical-list"
OUTPUT_FILE = "pharmaceutical_assets.json"


def get_package_latest_resource(package_id: str) -> str:
    """
    Get the ID of the latest resource in the package
    """
    params = {"id": package_id}
    response = requests.get("https://opendata.nhsbsa.net/api/3/action/package_show", params=params)
    response.raise_for_status()
    package_info = response.json()["result"]

    if not package_info["resources"]:
        raise ValueError("No resources found in the package")

    resources = sorted(
        package_info["resources"],
        key=lambda x: x.get("metadata_modified", ""),
        reverse=True,
    )

    return resources[0]["name"]


def fetch_data_with_sql(table_name: str) -> List[Dict]:
    """
    Fetch data using the datastore_search_sql API with filtering
    """
    sql_query = f"SELECT * from `{table_name}` WHERE HEALTH_AND_WELLBEING_BOARD = 'ISLE OF WIGHT'"

    params = {"resource_id": table_name, "sql": sql_query}

    response = requests.get(
        "https://opendata.nhsbsa.net/api/3/action/datastore_search_sql", params=params
    )
    response.raise_for_status()
    result = response.json()

    records = result["result"]["result"]["records"]

    if not records:
        raise ValueError(f"No data found {sql_query}")

    return records


def geocode_address(address_parts: List[str]) -> Optional[Tuple[float, float]]:
    """
    Geocode an address using Photon API from Komoot
    """
    address_str = ", ".join([part for part in address_parts if part and part.strip()])

    try:
        params = {"q": address_str, "limit": 1}

        print(f"Geocoding address: {address_str}")
        response = requests.get("https://photon.komoot.io/api/", params=params)
        response.raise_for_status()
        results = response.json()

        if results and "features" in results and len(results["features"]) > 0:
            # Photon returns GeoJSON coordinates as [lon, lat]
            coordinates = results["features"][0]["geometry"]["coordinates"]
            lon = float(coordinates[0])
            lat = float(coordinates[1])
            return lat, lon
        else:
            print(f"Failed to geocode address: {address_str}")
            print(f"Request URL: {response.url}")
            return None
    except Exception as e:
        print(f"Error geocoding address {address_str}: {str(e)}")
        return None


def create_asset(record: Dict, lat: float, lon: float) -> Dict:
    uri = f"https://www.iow.gov.uk/DigitalTwin#PHARM_{record['PHARMACY_ODS_CODE__F_CODE_']}"
    asset = {
        "uri": uri,
        "name": record["PHARMACY_TRADING_NAME"],
        "type": "http://ies.data.gov.uk/ontology/ies4#PharmaceuticalDispensary",
        "lat": lat,
        "lng": lon,
        "state": 0,  # AssetState.Live, prevent it trying to fetch the uri
        "geometry": [],
        "dependent": {"count": 0, "criticalitySum": 0},
        "styles": {
            "classUri": "http://ies.data.gov.uk/ontology/ies4#PharmaceuticalDispensary",
            "backgroundColor": "#242400",
            "color": "#FFFD04",
            "iconFallbackText": "PD",
            "alt": "PharmaceuticalDispensary",
            "shape": "cirle",
            "faUnicode": "\uf486",
            "faIcon": "fa-solid fa-prescription-bottle-medical",
        },
        "primaryCategory": "Essential Services",
        "secondaryCategory": "Health and social care",
    }

    return asset


def process_data(records: List[Dict]) -> List[Dict]:
    assets = []
    geocode_failures = 0

    for record in records:
        coords = geocode_address(
            [
                record.get("ADDRESS_FIELD_1", ""),
                record.get("ADDRESS_FIELD_2", ""),
                record.get("ADDRESS_FIELD_3", ""),
                record.get("ADDRESS_FIELD_4", ""),
                record.get("POST_CODE", ""),
            ]
        )

        if coords:
            lat, lon = coords
            asset = create_asset(record, lat, lon)
            assets.append(asset)
        else:
            geocode_failures += 1

    print(f"Successfully processed {len(assets)} pharmacies")
    print(f"Failed to geocode {geocode_failures} addresses")

    return assets


if __name__ == "__main__":
    try:
        print(f"Fetching latest resource from {PACKAGE_ID}...")
        resource_id = get_package_latest_resource(PACKAGE_ID)
        print(f"Latest resource: {resource_id}")

        print(f"Fetching data for Isle of Wight from {resource_id}...")
        records = fetch_data_with_sql(resource_id)
        print(f"Found {len(records)} pharmacies in Isle of Wight")

        print("Processing data and geocoding addresses...")
        assets = process_data(records)

        print(f"Writing {len(assets)} assets to {OUTPUT_FILE}...")
        with open(OUTPUT_FILE, "w") as f:
            json.dump(assets, f, indent=2)

        print("Done!")
    except Exception as e:
        print(f"Error: {str(e)}")
