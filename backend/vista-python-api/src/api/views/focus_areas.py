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

    def _get_scenario(self, scenario_id):
        """Get scenario or raise 404."""
        return get_object_or_404(Scenario, id=scenario_id, is_active=True)

    def _get_user_focus_areas(self, request, scenario):
        """Get focus areas for the authenticated user."""
        user_id = get_user_id_from_request(request)
        return FocusArea.objects.filter(scenario=scenario, user_id=user_id)

    def _get_next_area_name(self, scenario, user_id):
        """Generate the next sequential area name (Area 1, Area 2, etc.)."""
        existing_count = FocusArea.objects.filter(scenario=scenario, user_id=user_id).count()
        return f"Area {existing_count + 1}"

    def list(self, request, scenario_id=None):
        """List all focus areas for the authenticated user in a scenario."""
        scenario = self._get_scenario(scenario_id)
        focus_areas = self._get_user_focus_areas(request, scenario)
        serializer = FocusAreaSerializer(focus_areas, many=True)
        return Response(serializer.data)

    def retrieve(self, request, scenario_id=None, pk=None):
        """Get a specific focus area."""
        scenario = self._get_scenario(scenario_id)
        user_id = get_user_id_from_request(request)
        focus_area = get_object_or_404(FocusArea, id=pk, scenario=scenario, user_id=user_id)
        serializer = FocusAreaSerializer(focus_area)
        return Response(serializer.data)

    def create(self, request, scenario_id=None):
        """Create a new focus area."""
        scenario = self._get_scenario(scenario_id)
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
            is_active=serializer.validated_data["is_active"],
        )

        response_serializer = FocusAreaSerializer(focus_area)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, scenario_id=None, pk=None):
        """Update focus area properties (name, is_active, geometry)."""
        scenario = self._get_scenario(scenario_id)
        user_id = get_user_id_from_request(request)

        focus_area = get_object_or_404(FocusArea, id=pk, scenario=scenario, user_id=user_id)

        serializer = FocusAreaUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data
        if "name" in validated_data:
            focus_area.name = validated_data["name"]
        if "is_active" in validated_data:
            focus_area.is_active = validated_data["is_active"]
        if "geometry" in validated_data and validated_data["geometry"] is not None:
            focus_area.geometry = validated_data["geometry"]

        focus_area.save()

        response_serializer = FocusAreaSerializer(focus_area)
        return Response(response_serializer.data)

    def destroy(self, request, scenario_id=None, pk=None):
        """Delete a focus area."""
        scenario = self._get_scenario(scenario_id)
        user_id = get_user_id_from_request(request)

        focus_area = get_object_or_404(FocusArea, id=pk, scenario=scenario, user_id=user_id)

        focus_area.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
