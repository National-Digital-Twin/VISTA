"""Tests for mapping external asset data to asset model."""

import uuid

import pytest
from django.contrib.gis.geos import Point
from django.forms import ValidationError

from api.repository.external.external_asset_mapper import ExternalAssetMapper

name_unknown = "Name unknown"


@pytest.fixture
def asset_specification():
    """Stub asset specification."""
    return {
        "type": "f708192a-2345-4d45-6789-abcdef012345",
    }


@pytest.fixture
def ngd_feature():
    """Stub NGD feature."""
    return {
        "id": uuid.uuid4(),
        "properties": {},
        "geometry": {"type": "Point", "coordinates": [1, 0]},
    }


@pytest.fixture
def naptan_stop():
    """Stub NaPTAN stop."""
    return {"CommonName": "StopName", "Longitude": "1.0", "Latitude": "0.0", "ATCOCode": "1234"}


@pytest.fixture
def os_names_entry():
    """Stub OS Names entry."""
    return {"NAME1": "StopName", "GEOMETRY_X": 425000, "GEOMETRY_Y": 80000, "ID": "1234"}


@pytest.fixture
def cqc_location_details():
    """Stub CQC location details."""
    return {"name": "LocationName", "onspdLongitude": 1, "onspdLatitude": 0, "locationId": "1234"}


class NationalGridGeometry:
    """Represents geometry of National Grid."""

    x = 1
    y = 0


@pytest.fixture
def national_grid_record():
    """Stub National Grid record."""
    return {
        "SUBSTATION": "SubstationID",
        "Substation": "SubstationName",
        "centroid": NationalGridGeometry(),
    }


@pytest.fixture
def nhs_data_record():
    """Stub NHS data record."""
    return {"PHARMACY_ODS_CODE_F_CODE": "PH001", "PHARMACY_TRADING_NAME": "Boots"}


class TestOsNgd:
    """Tests for the OS NGD asset mapper."""

    def test_map_from_os_ngd_raises_exception_without_feature_properties(self, asset_specification):
        """Test feature attribute validation for OS NGD."""
        with pytest.raises(ValidationError):
            ExternalAssetMapper.map_from_os_ngd({}, asset_specification)

    def test_map_from_os_ngd_creates_correct_asset_with_name_unknown_with_no_name_field(
        self, ngd_feature, asset_specification
    ):
        """Test standard asset creation for OS NGD."""
        asset = ExternalAssetMapper.map_from_os_ngd(ngd_feature, asset_specification)
        assert asset.external_id == ngd_feature["id"]
        assert asset.name == name_unknown
        assert asset.geom.wkt == Point(1, 0).wkt
        assert asset.type.id == asset_specification["type"]

    def test_map_from_os_ngd_creates_asset_with_given_name_for_standard_name_field(
        self, ngd_feature, asset_specification
    ):
        """Test standard asset creation for OS NGD."""
        expected_name = "123"
        ngd_feature["properties"]["name1_text"] = expected_name
        asset = ExternalAssetMapper.map_from_os_ngd(ngd_feature, asset_specification)
        assert asset.name == expected_name

    def test_map_from_os_ngd_creates_asset_with_given_name_for_specified_name_field(
        self, ngd_feature, asset_specification
    ):
        """Test standard asset creation for OS NGD."""
        expected_name = "123"
        ngd_feature["properties"]["custom_name_field"] = expected_name
        asset_specification["nameField"] = "custom_name_field"
        asset = ExternalAssetMapper.map_from_os_ngd(ngd_feature, asset_specification)
        assert asset.name == expected_name


class TestNaptan:
    """Tests for the NaPTAN asset mapper."""

    def test_map_from_naptan_raises_exception_without_feature_properties(self, asset_specification):
        """Test feature attribute validation for Naptan."""
        with pytest.raises(ValidationError):
            ExternalAssetMapper.map_from_naptan({}, asset_specification)

    def test_map_from_naptan_creates_asset(self, naptan_stop, asset_specification):
        """Test standard asset creation for Naptan."""
        asset = ExternalAssetMapper.map_from_naptan(naptan_stop, asset_specification)
        assert asset.external_id == naptan_stop["ATCOCode"]
        assert asset.name == naptan_stop["CommonName"]
        assert asset.geom.wkt == Point(1, 0).wkt
        assert asset.type.id == asset_specification["type"]


class TestOsNames:
    """Tests for the OS Names asset mapper."""

    def test_map_from_os_names_raises_exception_without_feature_properties(
        self, asset_specification
    ):
        """Test feature attribute validation for OS Names."""
        with pytest.raises(ValidationError):
            ExternalAssetMapper.map_from_os_names({}, asset_specification)

    def test_map_from_os_names_creates_asset_with_name1(self, os_names_entry, asset_specification):
        """Test standard asset creation for OS Names."""
        asset = ExternalAssetMapper.map_from_os_names(os_names_entry, asset_specification)
        assert asset.external_id == os_names_entry["ID"]
        assert asset.name == os_names_entry["NAME1"]
        assert asset.geom.wkt == Point(-1.6479761079133526, 50.61917589987736).wkt
        assert asset.type.id == asset_specification["type"]

    def test_map_from_os_names_creates_asset_with_name2(self, os_names_entry, asset_specification):
        """Test standard asset creation for Naptan."""
        os_names_entry["NAME2"] = "StopName2"
        asset = ExternalAssetMapper.map_from_os_names(os_names_entry, asset_specification)
        assert asset.name == os_names_entry["NAME2"]


class TestCqc:
    """Tests for the CQC asset mapper."""

    def test_map_from_cqc_raises_exception_without_feature_properties(self, asset_specification):
        """Test feature attribute validation for CQC."""
        with pytest.raises(ValidationError):
            ExternalAssetMapper.map_from_cqc({}, asset_specification)

    def test_map_from_cqc_creates_asset(self, cqc_location_details, asset_specification):
        """Test standard asset creation for CQC."""
        asset = ExternalAssetMapper.map_from_cqc(cqc_location_details, asset_specification)
        assert asset.external_id == cqc_location_details["locationId"]
        assert asset.name == cqc_location_details["name"]
        assert asset.geom.wkt == Point(1, 0).wkt
        assert asset.type.id == asset_specification["type"]


class TestNationalGrid:
    """Tests for the National Grid asset mapper."""

    def test_map_from_national_grid_raises_exception_without_feature_properties(
        self, asset_specification
    ):
        """Test feature attribute validation for National Grid."""
        with pytest.raises(ValidationError):
            ExternalAssetMapper.map_from_national_grid({}, asset_specification)

    def test_map_from_national_grid_creates_asset(self, national_grid_record, asset_specification):
        """Test standard asset creation for National Grid."""
        asset = ExternalAssetMapper.map_from_national_grid(
            national_grid_record, asset_specification
        )
        assert asset.external_id == national_grid_record["SUBSTATION"]
        assert asset.name == national_grid_record["Substation"]
        assert asset.geom.wkt == Point(1, 0).wkt
        assert asset.type.id == asset_specification["type"]


class TestNhs:
    """Tests for the NHS asset mapper."""

    def test_map_from_nhs_raises_exception_without_feature_properties(self, asset_specification):
        """Test feature attribute validation for NHS."""
        with pytest.raises(ValidationError):
            ExternalAssetMapper.map_from_nhs({}, (0, 1), asset_specification)

    def test_map_from_nhs_creates_asset(self, nhs_data_record, asset_specification):
        """Test standard asset creation for NHS."""
        asset = ExternalAssetMapper.map_from_nhs(nhs_data_record, (0, 1), asset_specification)
        assert asset.external_id == nhs_data_record["PHARMACY_ODS_CODE_F_CODE"]
        assert asset.name == nhs_data_record["PHARMACY_TRADING_NAME"]
        assert asset.geom.wkt == Point(1, 0).wkt
        assert asset.type.id == asset_specification["type"]
