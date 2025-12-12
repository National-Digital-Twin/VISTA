"""Views for Scenarios."""

from typing import ClassVar

from rest_framework import viewsets

from api.models import Scenario
from api.serializers import ScenarioSerializer


class ScenarioViewSet(viewsets.ModelViewSet):
    """ViewSet for Scenario read operations."""

    http_method_names: ClassVar = ["get", "post", "patch"]
    queryset = Scenario.objects.all()
    serializer_class = ScenarioSerializer
