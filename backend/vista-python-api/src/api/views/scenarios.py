"""Views for Scenarios."""

from rest_framework import viewsets

from api.models import Scenario
from api.serializers import ScenarioSerializer


class ScenarioViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Scenario read operations."""

    queryset = Scenario.objects.all()
    serializer_class = ScenarioSerializer
