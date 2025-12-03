"""API Views for Exposure Layers."""

from rest_framework import viewsets

from api.models import ExposureLayerType
from api.serializers import ExposureLayerTypeSerializer


class ExposureLayerViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint that allows exposure layers to be viewed."""

    queryset = ExposureLayerType.objects.all()
    serializer_class = ExposureLayerTypeSerializer
