"""Core views for system use."""

from django.http import HttpResponse
from django.views.decorators.http import require_http_methods


@require_http_methods(["GET", "HEAD"])
def ping(_request):
    """Confirm that we are up and that the user has been able to access us."""
    return HttpResponse("OK", content_type="text/plain")
