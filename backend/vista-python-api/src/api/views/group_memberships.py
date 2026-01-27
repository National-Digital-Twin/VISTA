"""Views for Group Memberships."""

from typing import ClassVar

from rest_framework import viewsets

from api.models import GroupMembership
from api.permissions import Administrator
from api.repository.external.idp_repository import IdpRepository
from api.serializers import GroupMembershipSerializer
from api.utils.auth import get_user_id_from_request


class GroupMembershipViewSet(viewsets.ModelViewSet):
    """ViewSet for Group operations."""

    http_method_names: ClassVar = ["post", "delete"]
    queryset = GroupMembership.objects.all()
    serializer_class = GroupMembershipSerializer
    lookup_field = "user_id"
    lookup_url_kwarg = "user_id"

    def __init__(self, **kwargs):
        """Construct an instance of `GroupViewSet`."""
        super().__init__(**kwargs)
        self.idp_repository = IdpRepository()

    def get_queryset(self):
        """Get queryset in deference to request query parameters."""
        return GroupMembership.objects.filter(group_id=self.kwargs["group_id"])

    def get_permissions(self):
        """Get permissions for viewset methods."""
        return [Administrator()]

    def get_serializer_context(self):
        """Get external user context for serializer."""
        context = super().get_serializer_context()
        idp_users = self.idp_repository.list_users_in_group()
        context["idp_user_map"] = {idp_user.id: idp_user for idp_user in idp_users}
        return context

    def perform_create(self, serializer):
        """Doctor create request with authenticated user for created field."""
        serializer.save(
            created_by=get_user_id_from_request(self.request), group_id=self.kwargs["group_id"]
        )
