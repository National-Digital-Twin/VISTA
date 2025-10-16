"""Tests for the NaptanDataSourceHandler."""

from api.repository.external.handlers import NaptanDataSourceHandler


def test_build_urls_for_data_source_uses_locator():
    """Test the correct URL is returned ."""
    test_handler = NaptanDataSourceHandler("test")
    assert (
        test_handler.build_urls_for_data_source(None)
        == "https://naptan.api.dft.gov.uk/v1/access-nodes?dataFormat=csv&atcoAreaCodes=test"
    )
