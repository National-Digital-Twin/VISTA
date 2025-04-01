"""Subclass of GraphQLView that avoids CSRF in GraphQLView."""

from __future__ import annotations

from ariadne.constants import DATA_TYPE_JSON
from ariadne_django.views import GraphQLView
from django.http import HttpResponseBadRequest


class NoMultipartGraphQLView(GraphQLView):
    """Subclass of GraphQLView that avoids CSRF in GraphQLView."""

    def post(self, request, *args, **kwargs):
        """Block multipart/form-data and call super."""
        # GraphQLView is csrf_exempt and so vulnerable to CSRF when used with
        # multipart/form-data
        if (request.content_type or "").split(";")[0] != DATA_TYPE_JSON:
            return HttpResponseBadRequest(f"Posted content must be of type {DATA_TYPE_JSON}")

        return super().post(request, *args, **kwargs)
