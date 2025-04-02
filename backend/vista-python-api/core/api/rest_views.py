"""REST views for user details and sign-out functionality."""

import requests
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
from rest_framework.decorators import api_view


@csrf_exempt
@api_view(["GET"])
@require_GET
def user_details_view(request):
    """
    Retrieve authenticated user details by forwarding the request to the identity API.

    Returns a mock response if not in production.
    """
    if not settings.IS_PROD:
        return JsonResponse({"displayName": "Local User", "email": "local.user@local.com"})

    token = request.headers.get("X-Auth-Request-Access-Token")

    if not token:
        return JsonResponse({"error": "Missing X-Auth-Request-Access-Token"}, status=401)

    forward_url = f"{settings.IDENTITY_API_URL}/api/v1/user-details"

    try:
        response = requests.get(
            url=forward_url, headers={"X-Auth-Request-Access-Token": token}, params=request.GET
        )
        return HttpResponse(
            response.content,
            status=response.status_code,
            content_type=response.headers.get("Content-Type", "application/json"),
        )
    except requests.RequestException as e:
        return JsonResponse({"error": "Error forwarding request", "details": str(e)}, status=500)


@csrf_exempt
@require_GET
@api_view(["GET"])
def signout_view(_request):
    """
    Retrieve sign-out URLs for OAuth flow and redirection.

    Returns mock links if not in production.
    """
    if not settings.IS_PROD:
        return JsonResponse({"oAuthLogoutUrl": "/", "redirect": "/"})

    try:
        oauth_logout_url = f"{settings.LANDING_PAGE_URL}/oauth2/sign_out"
        response = requests.get(f"{settings.IDENTITY_API_URL}/api/v1/links/sign-out")

        if not response.ok:
            return JsonResponse(
                {
                    "error": (
                        f"Error: {response.status_code} ({response.reason}) "
                        "received when fetching sign-out links."
                    )
                },
                status=response.status_code,
            )

        logout_redirect = response.json()
        return JsonResponse(
            {"oAuthLogoutUrl": oauth_logout_url, "redirect": logout_redirect.get("href", "/")}
        )

    except requests.RequestException as e:
        return JsonResponse(
            {"error": "Failed to fetch sign-out link", "details": str(e)}, status=500
        )
