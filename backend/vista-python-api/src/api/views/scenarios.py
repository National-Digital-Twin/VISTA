"""Views for Scenarios."""

from typing import ClassVar

from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from api.models import Scenario
from api.permissions import Administrator
from api.serializers import ScenarioSerializer


class ScenarioViewSet(viewsets.ModelViewSet):
    """ViewSet for Scenario read operations."""

    http_method_names: ClassVar = ["get", "post"]
    queryset = Scenario.objects.all()
    serializer_class = ScenarioSerializer

    @action(detail=True, methods=["post"])
    def activate(self, request, pk):  # noqa: ARG002
        """Set the `is_active` flag for given scenario and deactivates all others."""
        get_object_or_404(Scenario, id=pk)
        try:
            with transaction.atomic():
                Scenario.objects.filter(is_active=True).update(is_active=False)
                Scenario.objects.filter(pk=pk).update(is_active=True)
        except IntegrityError:
            return Response(
                {"detail": "Another entity is already active."},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_permissions(self):
        """Get permissions for viewset methods."""
        permission_classes = [Administrator] if self.request.method == "POST" else []
        return [permission() for permission in permission_classes]
