# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Permissions for requests."""

from rest_framework.permissions import BasePermission

from api.utils.auth import get_user_is_admin_from_request


class Administrator(BasePermission):
    """Defines an Administrator permission."""

    def has_permission(self, request, view):  # noqa: ARG002
        """Check whether request has admin permissions."""
        return get_user_is_admin_from_request(request)
