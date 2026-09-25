# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the UK's Department for Business, Innovation, Science and Trade (BIST) as the governing entity.

"""Views relating to Dependency."""

from rest_framework import viewsets

from api.models.dependency import Dependency
from api.serializers import DependencySerializer


class DependencyViewSet(viewsets.ModelViewSet):
    """A ModelViewSet for the Dependency model."""

    queryset = Dependency.objects.all()
    serializer_class = DependencySerializer
