# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Road network link model for routing calculations."""

import uuid
from typing import ClassVar

from django.contrib.gis.db import models


class Directionality(models.TextChoices):
    """Directionality values from OS NGD.

    See: https://docs.os.uk/osngd/code-lists/code-lists-overview/linkdirectionvalue
    """

    BOTH = "Both Directions"
    IN_DIRECTION = "In Direction"
    IN_OPPOSITE = "In Opposite Direction"


class RoadClassification(models.TextChoices):
    """Road classification values from OS NGD.

    See: https://docs.os.uk/osngd/code-lists/code-lists-overview/roadclassificationvalue
    """

    A_ROAD = "A Road"
    B_ROAD = "B Road"
    CLASSIFIED_UNNUMBERED = "Classified Unnumbered"
    MOTORWAY = "Motorway"
    NOT_CLASSIFIED = "Not Classified"
    UNCLASSIFIED = "Unclassified"
    UNKNOWN = "Unknown"


class RouteHierarchy(models.TextChoices):
    """Route hierarchy/road function values from OS NGD.

    See: https://docs.os.uk/osngd/code-lists/code-lists-overview/roadfunctionvalue
    """

    A_ROAD = "A Road"
    A_ROAD_PRIMARY = "A Road Primary"
    B_ROAD = "B Road"
    B_ROAD_PRIMARY = "B Road Primary"
    LOCAL_ACCESS_ROAD = "Local Access Road"
    LOCAL_ROAD = "Local Road"
    MINOR_ROAD = "Minor Road"
    MOTORWAY = "Motorway"
    RESTRICTED_LOCAL_ACCESS_ROAD = "Restricted Local Access Road"
    RESTRICTED_SECONDARY_ACCESS_ROAD = "Restricted Secondary Access Road"
    SECONDARY_ACCESS_ROAD = "Secondary Access Road"
    SHARED_USE_ROAD = "Shared Use Road"


class FormOfWay(models.TextChoices):
    """Form of way type values from OS NGD.

    See: https://docs.os.uk/osngd/code-lists/code-lists-overview/formofwaytypevalue
    """

    CANAL_PATH = "Canal Path"
    DUAL_CARRIAGEWAY = "Dual Carriageway"
    ENCLOSED_TRAFFIC_AREA = "Enclosed Traffic Area"
    FOOTBRIDGE = "Footbridge"
    GUIDED_BUSWAY = "Guided Busway"
    LAYBY = "Layby"
    PATH = "Path"
    PATH_WITH_FORD = "Path With Ford"
    PATH_WITH_LEVEL_CROSSING = "Path With Level Crossing"
    PATH_WITH_STEPS = "Path With Steps"
    ROUNDABOUT = "Roundabout"
    SERVICE_ROAD = "Service Road"
    SHARED_USE_CARRIAGEWAY = "Shared Use Carriageway"
    SINGLE_CARRIAGEWAY = "Single Carriageway"
    SLIP_ROAD = "Slip Road"
    SUBWAY = "Subway"
    TRACK = "Track"
    TRAFFIC_ISLAND_LINK = "Traffic Island Link"
    TRAFFIC_ISLAND_LINK_AT_JUNCTION = "Traffic Island Link At Junction"


class OperationalState(models.TextChoices):
    """Operational state values from OS NGD.

    See: https://docs.os.uk/osngd/code-lists/code-lists-overview/operationalstatevalue
    """

    ADDRESSING_ONLY = "Addressing Only"
    OPEN = "Open"
    PERMANENTLY_CLOSED = "Permanently Closed"
    PROSPECTIVE = "Prospective"
    TEMPORARILY_CLOSED = "Temporarily Closed"
    UNDER_CONSTRUCTION = "Under Construction"


DEFAULT_SPEEDS_MPH = {
    RoadClassification.MOTORWAY: 70,
    RoadClassification.A_ROAD: 60,
    RoadClassification.B_ROAD: 60,
    RoadClassification.CLASSIFIED_UNNUMBERED: 30,
    RoadClassification.NOT_CLASSIFIED: 30,
    RoadClassification.UNCLASSIFIED: 60,
    RoadClassification.UNKNOWN: 30,
}


class RoadLink(models.Model):
    """Road network link for routing calculations.

    Data sourced from OS NGD Road Link collection (trn-ntwk-roadlink-4).
    Speed limits from RAMI collection (trn-rami-averageandindicativespeed-1).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    osid = models.CharField(max_length=100, unique=True, db_index=True)
    geometry = models.LineStringField(srid=4326)
    length_m = models.FloatField()

    directionality = models.CharField(
        max_length=50, choices=Directionality.choices, default=Directionality.BOTH
    )

    road_number = models.CharField(max_length=20, null=True, blank=True)

    road_classification = models.CharField(
        max_length=50, choices=RoadClassification.choices, blank=True
    )

    route_hierarchy = models.CharField(max_length=50, choices=RouteHierarchy.choices, blank=True)

    form_of_way = models.CharField(max_length=50, choices=FormOfWay.choices, blank=True)

    operational_state = models.CharField(
        max_length=50, choices=OperationalState.choices, blank=True
    )

    trunk_road = models.BooleanField(default=False)
    primary_route = models.BooleanField(default=False)

    start_node = models.CharField(max_length=100, blank=True, db_index=True)
    end_node = models.CharField(max_length=100, blank=True, db_index=True)

    speed_limit_mph = models.FloatField(null=True, blank=True)

    name = models.CharField(max_length=255, blank=True)
    versiondate = models.DateTimeField(null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta configuration."""

        indexes: ClassVar = [
            models.Index(fields=["start_node", "end_node"], name="roadlink_node_idx"),
        ]

    def __str__(self) -> str:
        """Return string representation."""
        display_name = self.name or self.road_number or self.osid
        classification = self.road_classification or RoadClassification.UNKNOWN
        return f"{display_name} ({classification})"

    def get_speed(self) -> float:
        """Get speed in mph, falling back to default by classification."""
        if self.speed_limit_mph:
            return self.speed_limit_mph
        return DEFAULT_SPEEDS_MPH.get(self.road_classification, 30)
