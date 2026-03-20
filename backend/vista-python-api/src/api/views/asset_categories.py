# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Views relating to Asset Categories."""

from rest_framework import viewsets

from api.models.asset_type import AssetCategory
from api.serializers import AssetCategorySerializer


class AssetCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """A ModelViewSet for the Asset Category model."""

    queryset = AssetCategory.objects.prefetch_related("sub_categories__asset_types").all()
    serializer_class = AssetCategorySerializer
