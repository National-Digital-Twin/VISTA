"""Core views for system use."""

from django.http import HttpResponse
from django.views.decorators.http import require_GET

@require_GET
def ping(_request):
    """Confirm that we are up and that the user has been able to access us."""
    return HttpResponse("OK", content_type="text/plain")
