"""Contains static methods to create :class:api.models.assets.Asset from various data sources."""

from json import dumps

from django.contrib.gis.geos import GEOSGeometry, Point
from django.forms import ValidationError

from api.models.asset import Asset
from api.models.asset_type import AssetType


class ExternalAssetMapper:
    """Contains methods to create :class:api.models.assets.Asset from various data sources."""

    @staticmethod
    def map_from_os_ngd(feature, asset_specification):
        """Create an instance of :class:api.models.assets.Asset from an OS NGD feature."""
        ExternalAssetMapper.validate_fields(feature, ["properties", "geometry"], "os_ngd")
        name_field = (
            asset_specification["nameField"]
            if "nameField" in asset_specification is not None
            else "name1_text"
        )
        name = (
            feature["properties"][name_field]
            if name_field in feature["properties"] and feature["properties"][name_field] is not None
            else "Name unknown"
        )
        asset_type = AssetType(id=asset_specification["type"])
        geom = GEOSGeometry(dumps(feature["geometry"]))

        return Asset.create(feature["id"], name, asset_type, geom)

    @staticmethod
    def map_from_naptan(naptan_stop, asset_specification):
        """Create an instance of :class:api.models.assets.Asset from a NAPTAN stop."""
        ExternalAssetMapper.validate_fields(
            naptan_stop, ["CommonName", "Longitude", "Latitude", "ATCOCode"], "naptan"
        )
        external_id = naptan_stop["ATCOCode"]
        name = naptan_stop["CommonName"]
        asset_type = AssetType(id=asset_specification["type"])
        geom = Point(float(naptan_stop["Longitude"]), float(naptan_stop["Latitude"]))

        return Asset.create(external_id, name, asset_type, geom)

    @staticmethod
    def map_from_os_names(entry, asset_specification):
        """Create an instance of :class:api.models.assets.Asset from an OS names data record."""
        ExternalAssetMapper.validate_fields(
            entry, ["NAME1", "GEOMETRY_X", "GEOMETRY_Y", "ID"], "os_names"
        )
        external_id = entry["ID"]
        name = entry["NAME1"] if "NAME2" not in entry else entry["NAME2"]
        asset_type = AssetType(id=asset_specification["type"])

        geom = Point(entry["GEOMETRY_X"], entry["GEOMETRY_Y"], srid=27700)
        geom.transform(4326)

        return Asset.create(external_id, name, asset_type, geom)

    @staticmethod
    def map_from_cqc(location_details, asset_specification):
        """Create an instance of :class:api.models.assets.Asset from location details from CQC."""
        ExternalAssetMapper.validate_fields(
            location_details, ["name", "onspdLongitude", "onspdLatitude", "locationId"], "cqc"
        )
        external_id = location_details["locationId"]
        name = location_details["name"]
        asset_type = AssetType(id=asset_specification["type"])
        geom = Point(
            float(location_details["onspdLongitude"]), float(location_details["onspdLatitude"])
        )

        return Asset.create(external_id, name, asset_type, geom)

    @staticmethod
    def map_from_national_grid(record, asset_specification):
        """Create an instance of :class:api.models.assets.Asset from a National Grid data record."""
        ExternalAssetMapper.validate_fields(
            record, ["SUBSTATION", "Substation", "centroid"], "national_grid"
        )
        external_id = record["SUBSTATION"]
        name = record["Substation"]
        asset_type = AssetType(id=asset_specification["type"])
        geom = record["centroid"]
        geos_pt = Point(geom.x, geom.y)

        return Asset.create(external_id, name, asset_type, geos_pt)

    @staticmethod
    def map_from_nhs(record, coords, asset_specification):
        """Create an instance of :class:api.models.assets.Asset from an NHS data record."""
        ExternalAssetMapper.validate_fields(
            record, ["PHARMACY_ODS_CODE_F_CODE", "PHARMACY_TRADING_NAME"], "nhs"
        )
        external_id = record["PHARMACY_ODS_CODE_F_CODE"]
        name = record["PHARMACY_TRADING_NAME"]
        asset_type = AssetType(id=asset_specification["type"])
        lat, lon = coords
        geom = Point(lon, lat)

        return Asset.create(external_id, name, asset_type, geom)

    @staticmethod
    def validate_fields(input_data: dict, required_fields: list[str], source: str):
        """Check that all required fields are present in input_data."""
        missing = [f for f in required_fields if f not in input_data or input_data[f] is None]

        if missing:
            log_source = f" for {source}" if source else ""
            raise ValidationError(f"Missing required fields{log_source}: {', '.join(missing)}")
