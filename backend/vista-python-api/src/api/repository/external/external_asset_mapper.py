"""Contains static methods to create :class:api.models.assets.Asset from various data sources."""

from json import dumps

from django.contrib.gis.geos import GEOSGeometry, Point

from api.models.asset import Asset
from api.models.asset_type import AssetType


class ExternalAssetMapper:
    """Contains methods to create :class:api.models.assets.Asset from various data sources."""

    @staticmethod
    def map_from_os_ngd(feature, asset_specification):
        """Create an instance of :class:api.models.assets.Asset from an OS NGD feature."""
        name = (
            feature["properties"]["name1_text"]
            if "name1_text" in feature["properties"]
            and feature["properties"]["name1_text"] is not None
            else "Name unknown"
        )
        asset_type = AssetType(id=asset_specification["type"])
        geom = GEOSGeometry(dumps(feature["geometry"]))

        return Asset.create(name, asset_type, geom)

    @staticmethod
    def map_from_naptan(naptan_stop, asset_specification):
        """Create an instance of :class:api.models.assets.Asset from a NAPTAN stop."""
        name = naptan_stop["CommonName"]
        asset_type = AssetType(id=asset_specification["type"])
        geom = Point(float(naptan_stop["Longitude"]), float(naptan_stop["Latitude"]))

        return Asset.create(name, asset_type, geom)

    @staticmethod
    def map_from_os_names(entry, asset_specification):
        """Create an instance of :class:api.models.assets.Asset from an OS names data record."""
        name = entry["NAME1"] if "NAME2" not in entry else entry["NAME2"]
        asset_type = AssetType(id=asset_specification["type"])

        geom = Point(entry["GEOMETRY_X"], entry["GEOMETRY_Y"], srid=27700)
        geom.transform(4326)

        return Asset.create(name, asset_type, geom)

    @staticmethod
    def map_from_cqc(location_details, asset_specification):
        """Create an instance of :class:api.models.assets.Asset from location details from CQC."""
        name = location_details["name"]
        asset_type = AssetType(id=asset_specification["type"])
        geom = Point(
            float(location_details["onspdLongitude"]), float(location_details["onspdLatitude"])
        )

        return Asset.create(name, asset_type, geom)

    @staticmethod
    def map_from_nhs(record, coords, asset_specification):
        """Create an instance of :class:api.models.assets.Asset from an NHS data record."""
        name = record["PHARMACY_TRADING_NAME"]
        asset_type = AssetType(id=asset_specification["type"])
        lat, lon = coords
        geom = Point(lon, lat)

        return Asset.create(name, asset_type, geom)
