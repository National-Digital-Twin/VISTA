"""Views for scenario-scoped exposure layer operations."""

from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import FocusArea, Scenario, VisibleExposureLayer
from api.models.exposure_layer import ExposureLayer, ExposureLayerType
from api.utils.auth import get_user_id_from_request


class ScenarioExposureLayersView(APIView):
    """View for listing exposure layers with visibility status for a scenario."""

    def get(self, request, scenario_id):
        """List all exposure layer types with nested exposure layers.

        Each exposure layer includes isActive indicating visibility for the user.
        Only exposure layers that intersect the focus area geometry are returned.
        If focus area has no geometry (map-wide), all exposure layers are returned.

        Query params:
            focus_area_id: Required UUID. Returns visibility status for that
                specific focus area.
        """
        scenario = get_object_or_404(Scenario, id=scenario_id)
        user_id = get_user_id_from_request(request)
        focus_area_id = request.query_params.get("focus_area_id")

        if not focus_area_id:
            return Response(
                {"error": "focus_area_id query parameter is required"},
                status=400,
            )

        focus_area = get_object_or_404(
            FocusArea, id=focus_area_id, scenario=scenario, user_id=user_id
        )

        visible_exposure_layer_ids = set(
            VisibleExposureLayer.objects.filter(focus_area=focus_area).values_list(
                "exposure_layer_id", flat=True
            )
        )

        # Filter exposure layers by geometry intersection if focus area has geometry
        if focus_area.geometry:
            exposure_layers_filter = ExposureLayer.objects.filter(
                geometry__intersects=focus_area.geometry
            )
        else:
            # Map-wide focus area: return all exposure layers
            exposure_layers_filter = ExposureLayer.objects.all()

        exposure_layer_types = ExposureLayerType.objects.prefetch_related(
            Prefetch("exposure_layers", queryset=exposure_layers_filter)
        )

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
