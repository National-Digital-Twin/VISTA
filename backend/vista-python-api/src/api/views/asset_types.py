# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Views relating to Asset Types."""

from rest_framework import viewsets

from api.models.asset import AssetType
from api.serializers import AssetTypeSerializer


class AssetTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """A ModelViewSet for the Asset Type model."""

    queryset = AssetType.objects.select_related("sub_category").all()
    serializer_class = AssetTypeSerializer
