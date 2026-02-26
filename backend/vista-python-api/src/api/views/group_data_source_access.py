"""Views for Group data source access."""

from typing import ClassVar

from django.shortcuts import get_object_or_404
from rest_framework import viewsets

from api.models import AssetType, DataSource, FocusArea, GroupDataSourceAccess, GroupMembership
from api.permissions import Administrator
from api.serializers import GroupDataSourceAccessSerializer
from api.services.data_source_access_service import cleanup_stale_visible_assets
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
        self._cleanup_affected_users(data_source)

    def perform_destroy(self, instance):
        """Delete the access record and clean up stale visible assets for affected users."""
        affected_user_ids = list(
            GroupMembership.objects.filter(group=instance.group).values_list("user_id", flat=True)
        )
        super().perform_destroy(instance)
        cleanup_stale_visible_assets(affected_user_ids)

    def _cleanup_affected_users(self, data_source):
        """Clean up visible assets for users who lost access to a data source's asset types."""
        asset_type_ids = AssetType.objects.filter(data_source=data_source).values_list(
            "id", flat=True
        )
        affected_user_ids = list(
            FocusArea.objects.filter(visible_assets__asset_type_id__in=asset_type_ids)
            .values_list("user_id", flat=True)
            .distinct()
        )
        cleanup_stale_visible_assets(affected_user_ids)
