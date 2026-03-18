# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Handler for the CQC data source."""

import zipfile
from logging import getLogger
from os import walk
from pathlib import Path
from typing import ClassVar

from geopandas import read_file
from requests import get
from shapely.geometry import box

from api.repository.external.external_asset_mapper import ExternalAssetMapper

from .base import DataSourceHandler


class NationalGridDataSourceHandler(DataSourceHandler):
    """Handler for the CQC data source."""

    root_url: ClassVar[str] = "https://www.nationalgrid.com/document/81216/download"
    output_file = "high_voltage_substations.json"
    logger = getLogger(__name__)
    wsg84_crs = 4326

    def _download_zip(self, url, dest_path):
        self.logger.info("Downloading %s...", url)
        r = get(url)
        with Path.open(dest_path, "wb") as f:
            f.write(r.content)
        self.logger.info("Download complete.")

    def _extract_zip(self, zip_path, extract_to):
        self.logger.info("Extracting %s...", zip_path)
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(extract_to)
        self.logger.info("Extraction complete.")

    def _find_shapefile(self, directory):
        for root, _dirs, files in walk(directory):
            for file in files:
                if file.endswith(".shp"):
                    return Path(root) / file
        raise FileNotFoundError("No .shp file found in extracted data.")

    def _filter_by_bbox(self, gdf):
        minx, miny, maxx, maxy = eval(self.locator)
        bbox_geom = box(minx, miny, maxx, maxy)
        return gdf[gdf.geometry.intersects(bbox_geom)]

    def build_urls_for_data_source(self, _asset_specification):
        """Build the URLs for fetching the data per the specification given."""
        return [self.root_url]

    async def fetch_data_for_asset_specification(self, asset_specification, url):
        """Fetch the National Grid data per the specification given."""
        # Step 1: Download and extract
        dir_path = "substations"
        self._download_zip(url, f"${dir_path}.zip")
        self._extract_zip(f"${dir_path}.zip", dir_path)

        # Step 2: Read shapefile
        shp_path = self._find_shapefile(dir_path)
        self.logger.info("Reading shapefile: %s", shp_path)
        gdf = read_file(shp_path)

        # Step 3: Convert to WGS84 if needed
        if gdf.crs and gdf.crs.to_epsg() != self.wsg84_crs:
            self.logger.info("Reprojecting from %s to WGS 84 (EPSG:4326)...", gdf.crs)
            gdf = gdf.to_crs(epsg=self.wsg84_crs)

        gdf["centroid"] = gdf.geometry.centroid

        # Step 4: Filter by bounding box
        self.logger.info("Filtering data for the Isle of Wight (bounding box %s)...", self.locator)
        filtered = self._filter_by_bbox(gdf)

        self.logger.info("Found %s features.", len(filtered))
        self.logger.info(filtered.head())
        return [
            ExternalAssetMapper.map_from_national_grid(
                row.drop("geometry").to_dict(), asset_specification
            )
            for _, row in filtered.iterrows()
        ]
