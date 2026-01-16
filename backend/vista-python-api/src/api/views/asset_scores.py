"""Views for asset scores."""

from decimal import Decimal

from django.db.models import Max
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.response import Response

from api.models import AssetScore, FocusArea, VisibleExposureAssetScore
from api.utils.auth import get_user_id_from_request


class AssetScoreViewSet(viewsets.ViewSet):
    """ViewSet for asset score retrieval."""

    def retrieve(self, request, scenario_id=None, pk=None):
        """Get scores for a specific asset.

        Query params:
            focus_area_id: Optional. If provided, returns exposure score for that
                          specific focus area. If not provided, returns max exposure
                          score across all active focus areas.
        """
        user_id = get_user_id_from_request(request)
        focus_area_id = request.query_params.get("focus_area_id")

        asset_score = get_object_or_404(AssetScore, id=pk, scenario_id=scenario_id)

        if focus_area_id:
            get_object_or_404(FocusArea, id=focus_area_id, scenario_id=scenario_id, user_id=user_id)
            exposure = VisibleExposureAssetScore.objects.filter(
                asset_id=pk,
                focus_area_id=focus_area_id,
            ).first()
            exposure_score = exposure.score if exposure else 0
        else:
            active_focus_area_ids = FocusArea.objects.filter(
                scenario_id=scenario_id,
                user_id=user_id,
                is_active=True,
            ).values("id")
            exposure = VisibleExposureAssetScore.objects.filter(
                asset_id=pk,
                focus_area_id__in=active_focus_area_ids,
            ).aggregate(max_score=Max("score"))
            exposure_score = exposure["max_score"] or 0

        return Response(
            {
                "id": str(pk),
                "scenarioId": str(scenario_id),
                "criticalityScore": f"{Decimal(asset_score.criticality_score):.2f}",
                "dependencyScore": f"{Decimal(asset_score.dependency_score):.2f}",
                "exposureScore": f"{Decimal(exposure_score):.2f}",
                "redundancyScore": f"{Decimal(asset_score.redundancy_score):.2f}",
            }
        )
