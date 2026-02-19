"""Views for dataroom exposure layer listing."""

import logging

from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import Scenario
from api.models.exposure_layer import ExposureLayer
from api.permissions import Administrator
from api.repository.external.idp_repository import IdpRepository
from api.serializers.dataroom_exposure_layer import DataroomExposureLayerSerializer

logger = logging.getLogger(__name__)


class DataroomExposureLayersView(APIView):
    """View for listing exposure layers in the dataroom."""

    def get_permissions(self):
        """Return permissions for the view."""
        return [Administrator()]

    def get(self, request, scenario_id):  # noqa: ARG002
        """List all exposure layers for the scenario with user and type info."""
        scenario = get_object_or_404(Scenario, id=scenario_id)

        queryset = (
            ExposureLayer.objects.filter(
                Q(user_id__isnull=True)
                | Q(scenario=scenario, status__in=[ExposureLayer.PENDING, ExposureLayer.APPROVED])
            )
            .select_related("type")
            .defer("geometry_buffered")
            .order_by("created_at")
        )

        has_user_layers = queryset.filter(user_id__isnull=False).exists()
        user_name_map = IdpRepository().get_user_name_map() if has_user_layers else {}

        serializer = DataroomExposureLayerSerializer(
            queryset, many=True, context={"user_name_map": user_name_map}
        )
        return Response(serializer.data)
