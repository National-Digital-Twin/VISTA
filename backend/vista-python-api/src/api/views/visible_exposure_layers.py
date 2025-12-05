"""Views for exposure layer visibility toggling."""

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import ExposureLayer, FocusArea, Scenario, VisibleExposureLayer
from api.serializers import (
    VisibleExposureLayerResponseSerializer,
    VisibleExposureLayerToggleSerializer,
)
from api.utils.auth import get_user_id_from_request


class VisibleExposureLayerView(APIView):
    """View for toggling exposure layer visibility."""

    def put(self, request, scenario_id=None):
        """Enable or disable visibility for an exposure layer.

        When is_active is true, creates a VisibleExposureLayer record.
        When is_active is false, deletes the VisibleExposureLayer record.

        If focus_area_id is provided, toggles visibility for that specific
        focus area. Otherwise, toggles map-wide visibility.
        """
        scenario = get_object_or_404(Scenario, id=scenario_id, is_active=True)
        user_id = get_user_id_from_request(request)

        serializer = VisibleExposureLayerToggleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        exposure_layer_id = serializer.validated_data["exposure_layer_id"]
        focus_area_id = serializer.validated_data.get("focus_area_id")
        is_active = serializer.validated_data["is_active"]

        exposure_layer = get_object_or_404(ExposureLayer, id=exposure_layer_id)

        focus_area = None
        if focus_area_id:
            focus_area = get_object_or_404(
                FocusArea, id=focus_area_id, scenario=scenario, user_id=user_id
            )

        if is_active:
            VisibleExposureLayer.objects.get_or_create(
                scenario=scenario,
                user_id=user_id,
                focus_area=focus_area,
                exposure_layer=exposure_layer,
            )
        else:
            VisibleExposureLayer.objects.filter(
                scenario=scenario,
                user_id=user_id,
                focus_area=focus_area,
                exposure_layer=exposure_layer,
            ).delete()

        response_data = {
            "exposure_layer_id": exposure_layer_id,
            "focus_area_id": focus_area_id,
            "is_active": is_active,
        }
        response_serializer = VisibleExposureLayerResponseSerializer(data=response_data)
        response_serializer.is_valid()
        return Response(response_serializer.data, status=status.HTTP_200_OK)
