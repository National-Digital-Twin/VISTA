"""Views relating to Dependency."""

from rest_framework import viewsets

from api.models.dependency import Dependency
from api.serializers import DependencySerializer


class DependencyViewSet(viewsets.ModelViewSet):
    """A ModelViewSet for the Dependency model."""

    queryset = Dependency.objects.all()
    serializer_class = DependencySerializer
