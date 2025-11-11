"""API Views for Exposure Layers."""
from rest_framework import viewsets

from api.models import ExposureLayer
from api.serializers import ExposureLayerSerializer


class ExposureLayerViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint that allows exposure layers to be viewed."""

    queryset = ExposureLayer.objects.all()
    serializer_class = ExposureLayerSerializer
