"""Views relating to Assets."""

from rest_framework import viewsets

from api.models.asset import Asset
from api.serializers import AssetSerializer


class AssetViewSet(viewsets.ReadOnlyModelViewSet):
    """A ModelViewSet for the Asset model."""

    queryset = Asset.objects.all()
    serializer_class = AssetSerializer
