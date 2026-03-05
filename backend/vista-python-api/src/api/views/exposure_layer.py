# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""API Views for Exposure Layers."""

from rest_framework import viewsets

from api.models import ExposureLayerType
from api.serializers import ExposureLayerTypeSerializer


class ExposureLayerViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint that allows exposure layers to be viewed."""

    queryset = ExposureLayerType.objects.all()
    serializer_class = ExposureLayerTypeSerializer
