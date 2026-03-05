# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Views for Focus Areas."""

from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.response import Response

from api.models import FocusArea, Scenario
from api.serializers import (
    FocusAreaCreateSerializer,
    FocusAreaSerializer,
    FocusAreaUpdateSerializer,
)
from api.utils.auth import get_user_id_from_request


class FocusAreaViewSet(viewsets.ViewSet):
    """ViewSet for Focus Area CRUD operations."""

    def _get_next_area_name(self, scenario, user_id):
        """Generate the next sequential area name (Area 1, Area 2, etc.)."""
        existing_count = FocusArea.objects.filter(
            scenario=scenario, user_id=user_id, is_system=False
        ).count()
        return f"Area {existing_count + 1}"

    def list(self, request, scenario_id=None):
        """List all focus areas for the authenticated user in a scenario.

        Returns map-wide (auto-created if needed) followed by user-created focus areas.
        """
        scenario = get_object_or_404(Scenario, id=scenario_id, is_active=True)
        user_id = get_user_id_from_request(request)

        focus_areas = list(FocusArea.objects.filter(scenario=scenario, user_id=user_id))

        # Check if Map-wide exists, create if not
        has_mapwide = any(fa.is_system for fa in focus_areas)
        if not has_mapwide:
            mapwide = FocusArea.objects.create(
                scenario=scenario,
                user_id=user_id,
                is_system=True,
                name="Map-wide",
                geometry=None,
                filter_mode="by_asset_type",
                is_active=True,
            )
            focus_areas.insert(0, mapwide)

        serializer = FocusAreaSerializer(focus_areas, many=True)
        return Response(serializer.data)

    def retrieve(self, request, scenario_id=None, pk=None):
        """Get a specific focus area."""
        scenario = get_object_or_404(Scenario, id=scenario_id, is_active=True)
        user_id = get_user_id_from_request(request)
        focus_area = get_object_or_404(FocusArea, id=pk, scenario=scenario, user_id=user_id)
        serializer = FocusAreaSerializer(focus_area)
        return Response(serializer.data)

    def create(self, request, scenario_id=None):
        """Create a new focus area (not map-wide)."""
        scenario = get_object_or_404(Scenario, id=scenario_id, is_active=True)
        user_id = get_user_id_from_request(request)

        serializer = FocusAreaCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        name = serializer.validated_data.get("name")
        if not name:
            name = self._get_next_area_name(scenario, user_id)

        focus_area = FocusArea.objects.create(
            scenario=scenario,
            user_id=user_id,
            name=name,
            geometry=serializer.validated_data["geometry"],
            filter_mode="by_asset_type",
            is_active=True,
            is_system=False,
        )

        response_serializer = FocusAreaSerializer(focus_area)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, scenario_id=None, pk=None):
        """Update focus area properties (name, geometry, filterMode, isActive)."""
        scenario = get_object_or_404(Scenario, id=scenario_id, is_active=True)
        user_id = get_user_id_from_request(request)

        focus_area = get_object_or_404(FocusArea, id=pk, scenario=scenario, user_id=user_id)

        serializer = FocusAreaUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data

        # Don't allow updating name/geometry on system (map-wide) focus areas
        if not focus_area.is_system:
            if "name" in validated_data:
                focus_area.name = validated_data["name"]
            if "geometry" in validated_data and validated_data["geometry"] is not None:
                focus_area.geometry = validated_data["geometry"]

        # Allow updating filter mode and is_active on all focus areas
        if "filter_mode" in validated_data:
            focus_area.filter_mode = validated_data["filter_mode"]
        if "is_active" in validated_data:
            focus_area.is_active = validated_data["is_active"]

        focus_area.save()

        response_serializer = FocusAreaSerializer(focus_area)
        return Response(response_serializer.data)

    def destroy(self, request, scenario_id=None, pk=None):
        """Delete a focus area (not allowed for system/map-wide)."""
        scenario = get_object_or_404(Scenario, id=scenario_id, is_active=True)
        user_id = get_user_id_from_request(request)

        focus_area = get_object_or_404(FocusArea, id=pk, scenario=scenario, user_id=user_id)

        if focus_area.is_system:
            return Response(
                {"detail": "Cannot delete the map-wide focus area."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        focus_area.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
