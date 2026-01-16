"""Views for scenario-scoped exposure layer operations."""

import json

from django.contrib.gis.gdal import GDALException
from django.contrib.gis.geos import GEOSException, GEOSGeometry
from django.db import connection
from django.db.models import Case, CharField, F, Prefetch, Q, Value, When
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import FocusArea, Scenario, VisibleExposureLayer
from api.models.exposure_layer import ExposureLayer, ExposureLayerType
from api.utils.auth import get_user_id_from_request
from api.utils.geometry import buffer_geometry


class ScenarioExposureLayersView(APIView):
    """View for listing and managing exposure layers for a scenario."""

    def get(self, request, scenario_id):
        """List all exposure layer types with nested exposure layers.

        Each exposure layer includes:
        - isActive: visibility toggle for the user
        - focusAreaRelation: spatial relationship with focus area
          ("contained", "overlaps", "elsewhere", or null if no focus_area_id)

        All exposure layers are returned regardless of spatial relationship.

        For user-drawn layers, also includes geometry, createdAt, and isUserDefined.

        Query params:
            focus_area_id: Optional UUID. If provided, returns layers scoped to that
                focus area with focusAreaRelation calculated. If not provided, returns
                layers for all active focus areas with focusAreaRelation as null.
        """
        scenario = get_object_or_404(Scenario, id=scenario_id)
        user_id = get_user_id_from_request(request)
        focus_area_id = request.query_params.get("focus_area_id")

        if focus_area_id:
            return self._get_for_focus_area(scenario, user_id, focus_area_id)
        return self._get_for_all_active_focus_areas(scenario, user_id)

    def _get_for_focus_area(self, scenario, user_id, focus_area_id):
        """Get exposure layers scoped to a specific focus area.

        Returns all layers with focusAreaRelation indicating spatial relationship.
        isActive is set based on whether the layer is enabled for this focus area.
        """
        focus_area = get_object_or_404(
            FocusArea, id=focus_area_id, scenario=scenario, user_id=user_id
        )

        visible_exposure_layer_ids = set(
            VisibleExposureLayer.objects.filter(focus_area=focus_area).values_list(
                "exposure_layer_id", flat=True
            )
        )

        return self._build_response(
            visible_exposure_layer_ids,
            user_id,
            scenario,
            focus_area=focus_area,
        )

    def _get_for_all_active_focus_areas(self, scenario, user_id):
        """Get exposure layers visible in any active focus area.

        Returns all layers with focusAreaRelation as null (not calculated).
        isActive is set based on visibility in any active focus area.
        """
        focus_area_ids = list(
            FocusArea.objects.filter(
                scenario=scenario,
                user_id=user_id,
                is_active=True,
            ).values_list("id", flat=True)
        )

        if not focus_area_ids:
            return self._build_response(set(), user_id, scenario)

        all_visible_ids = set(
            VisibleExposureLayer.objects.filter(focus_area_id__in=focus_area_ids).values_list(
                "exposure_layer_id", flat=True
            )
        )

        return self._build_response(all_visible_ids, user_id, scenario)

    def _build_response(
        self,
        visible_exposure_layer_ids,
        user_id,
        scenario,
        focus_area=None,
    ):
        """Build the response with exposure layer types and their layers.

        Args:
            visible_exposure_layer_ids: Set of layer IDs that are visible
            user_id: Current user's ID
            scenario: The scenario object
            focus_area: Optional focus area. If provided, spatial relation is calculated.
        """
        ownership_filter = Q(user_id__isnull=True) | Q(user_id=user_id, scenario=scenario)
        exposure_layers_qs = ExposureLayer.objects.filter(ownership_filter)
        exposure_layers_qs = exposure_layers_qs.order_by(F("created_at").asc(nulls_first=True))

        if focus_area and focus_area.geometry:
            fa_geom = focus_area.geometry
            exposure_layers_qs = exposure_layers_qs.annotate(
                focus_area_relation=Case(
                    When(geometry__contained=fa_geom, then=Value("contained")),
                    When(geometry__intersects=fa_geom, then=Value("overlaps")),
                    default=Value("elsewhere"),
                    output_field=CharField(),
                )
            )
        elif focus_area and focus_area.geometry is None:
            exposure_layers_qs = exposure_layers_qs.annotate(
                focus_area_relation=Value("contained", output_field=CharField())
            )

        exposure_layer_types = ExposureLayerType.objects.prefetch_related(
            Prefetch("exposure_layers", queryset=exposure_layers_qs)
        )

        result = []
        for exposure_layer_type in exposure_layer_types:
            layers_data = []
            for exposure_layer in exposure_layer_type.exposure_layers.all():
                layer_data = {
                    "id": str(exposure_layer.id),
                    "name": exposure_layer.name,
                    "isActive": exposure_layer.id in visible_exposure_layer_ids,
                    "isUserDefined": exposure_layer.is_user_defined,
                    "focusAreaRelation": getattr(exposure_layer, "focus_area_relation", None),
                    "geometry": (
                        json.loads(exposure_layer.geometry.json)
                        if exposure_layer.geometry
                        else None
                    ),
                    "createdAt": (
                        exposure_layer.created_at.isoformat() if exposure_layer.created_at else None
                    ),
                }
                layers_data.append(layer_data)

            result.append(
                {
                    "id": str(exposure_layer_type.id),
                    "name": exposure_layer_type.name,
                    "isUserEditable": exposure_layer_type.is_user_editable,
                    "exposureLayers": layers_data,
                }
            )

        return Response(result)

    def post(self, request, scenario_id):
        """Create a new user-drawn exposure layer.

        Request body:
            type_id: UUID of the exposure layer type (required, must be user-editable)
            geometry: GeoJSON geometry (required)
            name: Optional name (auto-generated if not provided)
            focus_area_id: Optional focus area ID to auto-enable visibility
        """
        scenario = get_object_or_404(Scenario, id=scenario_id)
        user_id = get_user_id_from_request(request)

        type_id = request.data.get("type_id")
        if not type_id:
            return Response(
                {"error": "type_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        exposure_layer_type = ExposureLayerType.objects.filter(id=type_id).first()
        if not exposure_layer_type:
            return Response(
                {"error": "Exposure layer type not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not exposure_layer_type.is_user_editable:
            return Response(
                {"error": "Cannot create layers for this type"},
                status=status.HTTP_403_FORBIDDEN,
            )

        geometry_data = request.data.get("geometry")
        if not geometry_data:
            return Response(
                {"error": "geometry is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            geom = GEOSGeometry(json.dumps(geometry_data))
            geom.srid = 4326
        except (GDALException, GEOSException, ValueError, TypeError):
            return Response(
                {"error": "Invalid geometry format"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        name = request.data.get("name")
        if not name:
            existing_count = ExposureLayer.objects.filter(
                user_id=user_id, scenario_id=scenario_id
            ).count()
            name = f"Exposure {existing_count + 1}"

        exposure_layer = ExposureLayer.objects.create(
            name=name,
            geometry=geom,
            geometry_buffered=buffer_geometry(connection, geom),
            type=exposure_layer_type,
            user_id=user_id,
            scenario=scenario,
        )

        focus_area_id = request.data.get("focus_area_id")
        if focus_area_id:
            focus_area = FocusArea.objects.filter(
                id=focus_area_id, scenario=scenario, user_id=user_id
            ).first()
            if focus_area:
                VisibleExposureLayer.objects.get_or_create(
                    focus_area=focus_area,
                    exposure_layer=exposure_layer,
                )

        return Response(
            {
                "id": str(exposure_layer.id),
                "name": exposure_layer.name,
                "geometry": json.loads(exposure_layer.geometry.json),
                "isActive": focus_area_id is not None,
                "isUserDefined": True,
                "createdAt": exposure_layer.created_at.isoformat(),
            },
            status=status.HTTP_201_CREATED,
        )

    def patch(self, request, scenario_id, exposure_layer_id):
        """Update a user-drawn exposure layer (rename or update geometry).

        Request body:
            name: Optional new name
            geometry: Optional new GeoJSON geometry
        """
        scenario = get_object_or_404(Scenario, id=scenario_id)
        user_id = get_user_id_from_request(request)

        exposure_layer = get_object_or_404(
            ExposureLayer,
            id=exposure_layer_id,
            user_id=user_id,
            scenario=scenario,
        )

        if not exposure_layer.type.is_user_editable:
            return Response(
                {"error": "Cannot edit layers of this type"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if "name" in request.data:
            exposure_layer.name = request.data["name"]

        if "geometry" in request.data:
            try:
                geom = GEOSGeometry(json.dumps(request.data["geometry"]))
                geom.srid = 4326
                exposure_layer.geometry = geom
                exposure_layer.geometry_buffered = buffer_geometry(connection, geom)
            except (GDALException, GEOSException, ValueError, TypeError):
                return Response(
                    {"error": "Invalid geometry format"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        exposure_layer.save()

        return Response(
            {
                "id": str(exposure_layer.id),
                "name": exposure_layer.name,
                "geometry": json.loads(exposure_layer.geometry.json),
                "isUserDefined": True,
                "createdAt": (
                    exposure_layer.created_at.isoformat() if exposure_layer.created_at else None
                ),
            }
        )

    def delete(self, request, scenario_id, exposure_layer_id):
        """Delete a user-drawn exposure layer."""
        scenario = get_object_or_404(Scenario, id=scenario_id)
        user_id = get_user_id_from_request(request)

        exposure_layer = get_object_or_404(
            ExposureLayer,
            id=exposure_layer_id,
            user_id=user_id,
            scenario=scenario,
        )

        if not exposure_layer.type.is_user_editable:
            return Response(
                {"error": "Cannot delete layers of this type"},
                status=status.HTTP_403_FORBIDDEN,
            )

        exposure_layer.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
