"""Views relating to Assets."""

from django.db.models import Count, Max
from rest_framework import viewsets

from api.models.asset_type import DataSource
from api.serializers import DataSourceSerializer


class DataSourceViewSet(viewsets.ReadOnlyModelViewSet):
    """A ModelViewSet for the DataSource model."""

    queryset = DataSource.objects.all()
    serializer_class = DataSourceSerializer

    def get_queryset(self):
        """Get queryset in deference to request query parameters."""
        return DataSource.objects.annotate(
            asset_count=Count("types__assets"), last_updated=Max("types__assets__last_updated")
        )
