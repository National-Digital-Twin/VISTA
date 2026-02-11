"""Views for Group data source access."""

from typing import ClassVar

from django.shortcuts import get_object_or_404
from rest_framework import viewsets

from api.models import DataSource, GroupDataSourceAccess
from api.permissions import Administrator
from api.serializers import GroupDataSourceAccessSerializer
from api.utils.auth import get_user_id_from_request


class GroupDataSourceAccessViewSet(viewsets.ModelViewSet):
    """ViewSet for Group data source access operations."""

    http_method_names: ClassVar = ["post", "delete"]
    queryset = GroupDataSourceAccess.objects.all()
    serializer_class = GroupDataSourceAccessSerializer
    lookup_field = "group_id"
    lookup_url_kwarg = "group_id"

    def get_queryset(self):
        """Get queryset in deference to request query parameters."""
        return GroupDataSourceAccess.objects.filter(data_source_id=self.kwargs["data_source_id"])

    def get_permissions(self):
        """Get permissions for viewset methods."""
        return [Administrator()]

    def perform_create(self, serializer):
        """Doctor create request with authenticated user for created field."""
        data_source = get_object_or_404(DataSource, pk=self.kwargs["data_source_id"])
        serializer.save(created_by=get_user_id_from_request(self.request), data_source=data_source)
