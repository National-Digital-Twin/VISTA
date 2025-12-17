"""Permissions for requests."""

from rest_framework.permissions import BasePermission

from api.utils.auth import get_user_is_admin_from_request


class Administrator(BasePermission):
    """Defines an Administrator permission."""

    def has_permission(self, request, view):  # noqa: ARG002
        """Check whether request has admin permissions."""
        return get_user_is_admin_from_request(request)
