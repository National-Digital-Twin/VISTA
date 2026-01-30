"""Mapper for OS NGD Road Link features to RoadLink model instances."""

from datetime import UTC, datetime
from json import dumps

from django.contrib.gis.geos import GEOSGeometry

from api.models.road_link import Directionality, RoadLink


class RoadLinkMapper:
    """Maps OS NGD Road Link features to RoadLink model instances."""

    @staticmethod
    def map_from_os_ngd(feature: dict, speed_lookup: dict[str, float] | None = None) -> RoadLink:
        """Map a Road Link feature to RoadLink model.

        Args:
            feature: GeoJSON feature from trn-ntwk-roadlink-4
            speed_lookup: Dict mapping road link OSID to speed_limit_mph (from RAMI)

        Returns:
            RoadLink model instance
        """
        props = feature.get("properties", {})
        osid = feature.get("id", "")

        speed_limit = None
        if speed_lookup and osid in speed_lookup:
            speed_limit = speed_lookup[osid]

        road_number = props.get("roadclassificationnumber")
        name = props.get("name1_text") or road_number or osid

        versiondate = RoadLinkMapper._parse_versiondate(props.get("versiondate"))

        return RoadLink(
            osid=osid,
            geometry=GEOSGeometry(dumps(feature["geometry"])),
            length_m=props.get("geometry_length_m", 0),
            directionality=props.get("directionality", Directionality.BOTH),
            road_classification=props.get("roadclassification") or "",
            route_hierarchy=props.get("routehierarchy") or "",
            road_number=road_number,
            form_of_way=props.get("description") or "",
            operational_state=props.get("operationalstate") or "",
            trunk_road=props.get("trunkroad", False),
            primary_route=props.get("primaryroute", False),
            start_node=props.get("startnode") or "",
            end_node=props.get("endnode") or "",
            name=name,
            speed_limit_mph=speed_limit,
            versiondate=versiondate,
        )

    @staticmethod
    def _parse_versiondate(value: str | None) -> datetime | None:
        """Parse a versiondate string from OS NGD into a datetime."""
        if not value:
            return None
        return datetime.fromisoformat(value).replace(tzinfo=UTC)
