"""Views for Scenarios."""

from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.response import Response

from api.models import AssetScore
from api.serializers import AssetScoreSerializer
from api.utils.auth import get_user_id_from_request


class AssetScoreViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Scenario read operations."""

    queryset = AssetScore.objects.all()
    serializer_class = AssetScoreSerializer

    def retrieve(self, request, scenario_id=None, pk=None):
        """Get a specific asset score."""
        user_id = get_user_id_from_request(request)
        asset_score = AssetScore.objects.filter(
            id=pk, scenario_id=scenario_id, user_id=user_id
        ).first()
        if not asset_score:
            asset_score = get_object_or_404(
                AssetScore, id=pk, scenario_id=scenario_id, user_id=None
            )
        serializer = AssetScoreSerializer(asset_score)
        return Response(serializer.data)
