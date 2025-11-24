"""Views relating to Asset Categories."""

from rest_framework import viewsets

from api.models.asset_type import AssetCategory
from api.serializers import AssetCategorySerializer


class AssetCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """A ModelViewSet for the Asset Category model."""

    queryset = AssetCategory.objects.prefetch_related("sub_categories__asset_types").all()
    serializer_class = AssetCategorySerializer
