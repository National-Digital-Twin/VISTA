# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Views for scenario-scoped route calculation."""

import time

from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import Scenario
from api.routing import ConstraintProvider, RouteCalculator, RoutePoint, routing_cache
from api.serializers import RouteCalculateSerializer
from api.utils.auth import get_user_id_from_request


class ScenarioRouteView(APIView):
    """View for calculating routes within a scenario context."""

    def post(self, request, scenario_id):
        """Calculate a route with scenario constraints applied."""
        start_time = time.time()

        scenario = get_object_or_404(Scenario, id=scenario_id)
        user_id = get_user_id_from_request(request)

        serializer = RouteCalculateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        start = RoutePoint(
            lon=serializer.validated_data["start_lon"],
            lat=serializer.validated_data["start_lat"],
        )
        end = RoutePoint(
            lon=serializer.validated_data["end_lon"],
            lat=serializer.validated_data["end_lat"],
        )

        calculator = RouteCalculator(
            graph_provider=routing_cache,
            constraint_provider=ConstraintProvider(),
        )
        route_geojson = calculator.calculate_route(
            start=start,
            end=end,
            scenario_id=scenario.id,
            user_id=user_id,
            vehicle=serializer.validated_data.get("vehicle"),
        )

        runtime_seconds = round(time.time() - start_time, 4)
        if "properties" in route_geojson:
            route_geojson["properties"]["runtimeSeconds"] = runtime_seconds

        return Response(route_geojson)
