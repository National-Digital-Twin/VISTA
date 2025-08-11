#!/usr/bin/env python3
"""
Script to fetch substation data from National Grid, filter for Isle of Wight and convert to internal asset format.

This data is not updated regularly, so we manually run this intermittently and update the coeff-assets-with-geometry.json file.

e.g
- run data_removal_assets.py including HighVoltageElectricitySubstationComplex, LowVoltageElectricitySubstationComplex
- run this script
- paste the generated assets from this script into coeff-assets-with-geometry.json
"""

import os
import json
from typing import Dict
import requests
import zipfile
import geopandas as gpd
from shapely.geometry import box

BBOX = (-1.824417, 50.532539, -0.780029, 50.829)
OUTPUT_FILE = "high_voltage_substations.json"

def download_zip(url, dest_path):
    print(f"Downloading {url}...")
    r = requests.get(url)
    with open(dest_path, "wb") as f:
        f.write(r.content)
    print("Download complete.")

def extract_zip(zip_path, extract_to):
    print(f"Extracting {zip_path}...")
    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        zip_ref.extractall(extract_to)
    print("Extraction complete.")

def find_shapefile(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".shp"):
                return os.path.join(root, file)
    raise FileNotFoundError("No .shp file found in extracted data.")

def filter_by_bbox(gdf, bbox):
    minx, miny, maxx, maxy = bbox
    bbox_geom = box(minx, miny, maxx, maxy)
    return gdf[gdf.geometry.intersects(bbox_geom)]


def create_asset(record: Dict) -> Dict:
    centroid = record["centroid"]
    asset = {
        "uri": f"https://www.iow.gov.uk/DigitalTwin#{record['GDO_GID']}",
        "name": record["Substation"],
        "type": "http://ies.data.gov.uk/ontology/ies4#HighVoltageElectricitySubstationComplex",
        "lat": centroid.y,
        "lng": centroid.x,
        "state": 0,  # AssetState.Live, prevent it trying to fetch the uri
        "geometry": [],
        "dependent": {"count": 0, "criticalitySum": 0},
        "styles": {
            "classUri": "http://ies.data.gov.uk/ontology/ies4#HighVoltageElectricitySubstationComplex",
            "backgroundColor": "#242400",
            "color": "#FFFD04",
            "iconFallbackText": "HVE",
            "alt": "HighVoltageElectricitySubstationComplex",
            "shape": "cirle",
            "faUnicode": "\ue2c4",
            "faIcon": "fa-solid fa-utility-pole-double",
        },
        "primaryCategory": "Essential Services",
        "secondaryCategory": "Utility Infrastructure",
    }

    return asset

def main():
    # Step 1: Download and extract
    dir_path = "substations"
    download_zip("https://www.nationalgrid.com/document/81216/download", f"${dir_path}.zip")
    extract_zip(f"${dir_path}.zip", dir_path)

    # Step 2: Read shapefile
    shp_path = find_shapefile(dir_path)
    print(f"Reading shapefile: {shp_path}")
    gdf = gpd.read_file(shp_path)

    # Step 3: Convert to WGS84 if needed
    if gdf.crs and gdf.crs.to_epsg() != 4326:
        print(f"Reprojecting from {gdf.crs} to WGS 84 (EPSG:4326)...")
        gdf = gdf.to_crs(epsg=4326)

    gdf["centroid"] = gdf.geometry.centroid

    # Step 4: Filter by bounding box
    print(f"Filtering data for the Isle of Wight (bounding box {BBOX})...")
    filtered = filter_by_bbox(gdf, BBOX)

    print(f"Found {len(filtered)} features.")
    print(filtered.head())
    assets = []
    for _, row in filtered.iterrows():
        assets.append(create_asset(row.drop("geometry").to_dict()))

    print(f"Writing {len(assets)} assets to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, "w") as f:
        json.dump(assets, f, indent=2)

if __name__ == "__main__":
    main()
