"""Core views for system use."""

from api.utils.auth import is_user_authenticated
from django.core.exceptions import PermissionDenied
from django.http import HttpResponse
from django.views.decorators.http import require_http_methods


@require_http_methods(["GET", "HEAD"])
def ping(request):
    """Confirm that a user is able to access us if authenticated."""
    if is_user_authenticated(request):
        return HttpResponse("OK", content_type="text/plain")
    raise PermissionDenied


@require_http_methods(["GET", "HEAD"])
def health(_request):
    """Confirm that we are up and healthy."""
    return HttpResponse("OK", content_type="text/plain")
