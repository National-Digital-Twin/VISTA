# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Views for exposure layer visibility toggling."""

from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import ExposureLayer, FocusArea, Scenario, VisibleExposureLayer
from api.models.exposure_layer import ExposureLayerType
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

        focus_area_id is required and specifies which focus area scope to toggle.
        """
        scenario = get_object_or_404(Scenario, id=scenario_id, is_active=True)
        user_id = get_user_id_from_request(request)

        serializer = VisibleExposureLayerToggleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        exposure_layer_id = serializer.validated_data["exposure_layer_id"]
        focus_area_id = serializer.validated_data["focus_area_id"]
        is_active = serializer.validated_data["is_active"]

        exposure_layer = get_object_or_404(ExposureLayer, id=exposure_layer_id)
        focus_area = get_object_or_404(
            FocusArea, id=focus_area_id, scenario=scenario, user_id=user_id
        )

        if is_active:
            VisibleExposureLayer.objects.get_or_create(
                focus_area=focus_area,
                exposure_layer=exposure_layer,
            )
        else:
            VisibleExposureLayer.objects.filter(
                focus_area=focus_area,
                exposure_layer=exposure_layer,
            ).delete()

        response_data = {
            "exposure_layer_id": exposure_layer_id,
            "focus_area_id": focus_area_id,
            "is_active": is_active,
        }
        response_serializer = VisibleExposureLayerResponseSerializer(data=response_data)
        response_serializer.is_valid(raise_exception=True)
        return Response(response_serializer.data, status=status.HTTP_200_OK)


class BulkVisibleExposureLayerView(APIView):
    """View for bulk toggling exposure layer visibility."""

    def put(self, request, scenario_id=None):
        """Bulk enable or disable visibility for multiple exposure layers.

        Request body options:
            1. Toggle specific layers:
               {"exposureLayerIds": [...], "focusAreaId": "...", "isActive": true/false}

            2. Toggle all layers of a type:
               {"typeId": "...", "focusAreaId": "...", "isActive": true/false}
        """
        scenario = get_object_or_404(Scenario, id=scenario_id, is_active=True)
        user_id = get_user_id_from_request(request)

        focus_area_id = request.data.get("focus_area_id")
        is_active = request.data.get("is_active")
        if focus_area_id is None or is_active is None:
            return Response(
                {"error": "focus_area_id and is_active are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        focus_area = get_object_or_404(
            FocusArea, id=focus_area_id, scenario=scenario, user_id=user_id
        )

        exposure_layer_ids = request.data.get("exposure_layer_ids")
        type_id = request.data.get("type_id")
        if not exposure_layer_ids and not type_id:
            return Response(
                {"error": "Either exposure_layer_ids or type_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        accessible_layers_filter = (
            Q(user_id__isnull=True)  # System layers
            | Q(user_id=user_id, scenario=scenario)  # User layers
            | Q(scenario=scenario, status=ExposureLayer.APPROVED)  # Approved layers
        )

        if type_id:
            exposure_layer_type = get_object_or_404(ExposureLayerType, id=type_id)
            exposure_layers = ExposureLayer.objects.filter(
                accessible_layers_filter, type=exposure_layer_type
            )
            exposure_layer_ids = list(exposure_layers.values_list("id", flat=True))
        else:
            exposure_layers = ExposureLayer.objects.filter(
                accessible_layers_filter, id__in=exposure_layer_ids
            )
            if exposure_layers.count() != len(exposure_layer_ids):
                return Response(
                    {"error": "One or more exposure layer IDs are invalid"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        with transaction.atomic():
            if is_active:
                for layer_id in exposure_layer_ids:
                    VisibleExposureLayer.objects.get_or_create(
                        focus_area=focus_area,
                        exposure_layer_id=layer_id,
                    )
            else:
                VisibleExposureLayer.objects.filter(
                    focus_area=focus_area,
                    exposure_layer_id__in=exposure_layer_ids,
                ).delete()

        return Response(
            {
                "focus_area_id": str(focus_area_id),
                "exposure_layer_ids": [str(layer_id) for layer_id in exposure_layer_ids],
                "is_active": is_active,
            },
            status=status.HTTP_200_OK,
        )
