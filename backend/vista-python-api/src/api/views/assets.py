"""Views relating to Assets."""

from rest_framework import viewsets
from rest_framework.decorators import action

from api.models.asset import Asset
from api.serializers import AssetDetailSerializer, AssetListSerializer


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
            return Asset.objects.prefetch_related("provider", "dependent")
        return super().get_queryset()

    @action(detail=False, methods=["get"], url_path="")
    def list_by_asset_type(self, asset_type: str) -> list[Asset]:
        """List assets by asset type."""
        return Asset.objects.filter(type=asset_type)
