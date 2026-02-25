"""Views relating to Assets."""

from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from api.models.asset import Asset
from api.serializers import (
    AssetDetailSerializer,
    AssetExternalIdLookupSerializer,
    AssetListSerializer,
)
from api.services.data_source_access_service import user_can_access_asset
from api.utils.auth import get_user_id_from_request


class AssetViewSet(viewsets.ReadOnlyModelViewSet):
    """A ModelViewSet for the Asset model."""

    queryset = Asset.objects.all()

    def get_serializer_class(self):
        """Get serializer class for action."""
        if self.action == "list":
            return AssetListSerializer
        return AssetDetailSerializer

    def get_queryset(self):
        """Get queryset in deference to request query parameters."""
        asset_type_id = self.request.query_params.get("asset_type", None)
        if asset_type_id is not None:
            self.queryset = self.queryset.filter(type=asset_type_id)

        if self.action == "retrieve":
            # Prefetch reverse relationships only for the detail view
            return Asset.objects.select_related("type").prefetch_related("provider", "dependent")
        return super().get_queryset()

    def retrieve(self, request, *_args, **_kwargs):
        """Return asset details only if the user has access to its data source."""
        instance = self.get_object()
        user_id = get_user_id_from_request(request)
        if not user_can_access_asset(user_id, instance):
            return Response(
                {"detail": "You do not have permission to view this asset."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="")
    def list_by_asset_type(self, asset_type: str) -> list[Asset]:
        """List assets by asset type."""
        return Asset.objects.filter(type=asset_type)

    @action(detail=False, methods=["get"], url_path="resolve-external-id")
    def resolve_external_id(self, request):
        """Resolve an external asset ID to internal asset details."""
        external_id = request.query_params.get("external_id")
        if not external_id:
            return Response(
                {"detail": "external_id query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        asset = get_object_or_404(Asset.objects.select_related("type"), external_id=external_id)
        user_id = get_user_id_from_request(request)
        if not user_can_access_asset(user_id, asset):
            return Response(
                {"detail": "You do not have permission to view this asset."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = AssetExternalIdLookupSerializer(asset)
        return Response(serializer.data, status=status.HTTP_200_OK)
