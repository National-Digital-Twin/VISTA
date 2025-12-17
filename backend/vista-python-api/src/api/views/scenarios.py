"""Views for Scenarios."""

from typing import ClassVar

from rest_framework import viewsets

from api.models import Scenario
from api.permissions import Administrator
from api.serializers import ScenarioSerializer


class ScenarioViewSet(viewsets.ModelViewSet):
    """ViewSet for Scenario read operations."""

    http_method_names: ClassVar = ["get", "patch"]
    queryset = Scenario.objects.all()
    serializer_class = ScenarioSerializer

    def get_permissions(self):
        """Get permissions for viewset methods."""
        permission_classes = [Administrator] if self.request.method == "PATCH" else []
        return [permission() for permission in permission_classes]
