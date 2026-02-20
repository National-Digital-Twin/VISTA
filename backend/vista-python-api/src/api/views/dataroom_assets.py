"""Views for dataroom asset listing and bulk criticality updates."""

from django.db import IntegrityError
from django.db.models import F, FilteredRelation, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import Scenario
from api.models.asset import Asset
from api.models.asset_criticality_override import AssetCriticalityOverride
from api.permissions import Administrator
from api.serializers.dataroom_asset import (
    BulkCriticalityUpdateSerializer,
    DataroomAssetListSerializer,
)
from api.serializers.geometry import parse_geojson
from api.utils.auth import get_user_id_from_request


class DataroomAssetsView(APIView):
    """View for listing assets with effective criticality in the dataroom."""

    def get_permissions(self):
        """Return permissions for the view."""
        return [Administrator()]

    def get(self, request, scenario_id):
        """List assets with effective criticality, hierarchy names, and geometry."""
        scenario = get_object_or_404(Scenario, id=scenario_id)

        queryset = Asset.objects.filter(
            type__scenario_scores__scenario=scenario,
        ).select_related("type__sub_category__category")

        category_id = request.query_params.get("category_id")
        if category_id:
            queryset = queryset.filter(type__sub_category__category_id=category_id)

        sub_category_id = request.query_params.get("sub_category_id")
        if sub_category_id:
            queryset = queryset.filter(type__sub_category_id=sub_category_id)

        asset_type_id = request.query_params.get("asset_type_id")
        if asset_type_id:
            queryset = queryset.filter(type_id=asset_type_id)

        geometry = request.query_params.get("geometry")
        if geometry:
            geom = parse_geojson(geometry)
            queryset = queryset.filter(geom__within=geom)

        search = request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(type__name__icontains=search)
                | Q(type__sub_category__name__icontains=search)
                | Q(type__sub_category__category__name__icontains=search)
            )

        queryset = queryset.annotate(
            score=FilteredRelation(
                "asset_scores_view",
                condition=Q(asset_scores_view__scenario_id=scenario.id),
            ),
            criticality_score=F("score__criticality_score"),
            criticality_is_overridden=F("score__criticality_is_overridden"),
        )

        serializer = DataroomAssetListSerializer(queryset, many=True)
        return Response(serializer.data)


class DataroomBulkCriticalityView(APIView):
    """View for bulk updating per-asset criticality overrides."""

    def get_permissions(self):
        """Return permissions for the view."""
        return [Administrator()]

    def put(self, request, scenario_id):
        """Upsert criticality overrides for the given asset IDs."""
        scenario = get_object_or_404(Scenario, id=scenario_id)

        serializer = BulkCriticalityUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        asset_ids = serializer.validated_data["asset_ids"]
        criticality_score = serializer.validated_data["criticality_score"]
        user_id = get_user_id_from_request(request)
        now = timezone.now()

        try:
            AssetCriticalityOverride.objects.bulk_create(
                [
                    AssetCriticalityOverride(
                        scenario=scenario,
                        asset_id=aid,
                        criticality_score=criticality_score,
                        created_by=user_id,
                        updated_by=user_id,
                        created_at=now,
                        updated_at=now,
                    )
                    for aid in asset_ids
                ],
                update_conflicts=True,
                unique_fields=["scenario", "asset"],
                update_fields=["criticality_score", "updated_at", "updated_by"],
            )
        except IntegrityError:
            return Response(
                {"detail": "One or more asset IDs do not exist."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({"updated_count": len(asset_ids)}, status=status.HTTP_200_OK)
