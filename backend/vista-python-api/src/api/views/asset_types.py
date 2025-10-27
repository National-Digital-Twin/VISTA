"""Views relating to Asset Types."""

from rest_framework import viewsets

from api.models.asset import AssetType
from api.serializers import AssetTypeSerializer


class AssetTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """A ModelViewSet for the Asset Type model."""

    queryset = AssetType.objects.all()
    serializer_class = AssetTypeSerializer
