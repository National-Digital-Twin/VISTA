"""Views for scenario-scoped exposure layer operations."""

from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import Scenario, VisibleExposureLayer
from api.models.exposure_layer import ExposureLayerType
from api.utils.auth import get_user_id_from_request


class ScenarioExposureLayersView(APIView):
    """View for listing exposure layers with visibility status for a scenario."""

    def get(self, request, scenario_id):
        """List all exposure layer types with nested exposure layers.

        Each exposure layer includes isActive indicating visibility for the user.

        Query params:
            focus_area_id: Optional UUID. If provided, returns visibility status
                for that specific focus area. If omitted, returns map-wide
                (global) visibility status where focus_area is NULL.
        """
        get_object_or_404(Scenario, id=scenario_id)

        focus_area_id = request.query_params.get("focus_area_id")
        user_id = get_user_id_from_request(request)

        visible_query = VisibleExposureLayer.objects.filter(
            scenario_id=scenario_id,
            user_id=user_id,
        )

        if focus_area_id:
            visible_query = visible_query.filter(focus_area_id=focus_area_id)
        else:
            visible_query = visible_query.filter(focus_area__isnull=True)

        visible_exposure_layer_ids = set(visible_query.values_list("exposure_layer_id", flat=True))
        exposure_layer_types = ExposureLayerType.objects.prefetch_related("exposure_layers")
        result = [
            {
                "id": str(exposure_layer_type.id),
                "name": exposure_layer_type.name,
                "exposureLayers": [
                    {
                        "id": str(exposure_layer.id),
                        "name": exposure_layer.name,
                        "isActive": exposure_layer.id in visible_exposure_layer_ids,
                    }
                    for exposure_layer in exposure_layer_type.exposure_layers.all()
                ],
            }
            for exposure_layer_type in exposure_layer_types
        ]

        return Response(result)
