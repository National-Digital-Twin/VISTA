from django.conf import settings
import requests
from django.http import HttpResponse, JsonResponse
from rest_framework.decorators import api_view

@api_view(['GET'])
def user_details_view(request):
    if not settings.IS_PROD:
        return JsonResponse({"displayName": "Local User", "email": "local.user@local.com"})

    token = request.headers.get("X-Auth-Request-Access-Token")

    if not token:
        return JsonResponse({"error": "Missing X-Auth-Request-Access-Token"}, status=401)

    forward_url = f"{settings.IDENTITY_API_URL}/api/v1/user-details"

    try:
        response = requests.request(
            method=request.method,
            url=forward_url,
            headers={
            "X-Auth-Request-Access-Token": token
            },
            data=request.body,
            params=request.GET
        )
        return HttpResponse(
            response.content,
            status=response.status_code,
            content_type=response.headers.get("Content-Type", "application/json"),
        )
    except requests.RequestException as e:
        return JsonResponse({"error": "Error forwarding request", "details": str(e)}, status=500)



@api_view(['GET'])
def signout_view(request):
    if not settings.IS_PROD:
        return JsonResponse({"oAuthLogoutUrl": "/", "redirect": "/"})

    try:
        oauth_logout_url = f"{settings.LANDING_PAGE_URL}/oauth2/sign_out"
        response = requests.get(f"{settings.IDENTITY_API_URL}/api/v1/links/sign-out")

        if not response.ok:
            return JsonResponse({
                "error": f"Error: {response.status_code} ({response.reason}) received when fetching sign-out links."
            }, status=response.status_code)

        logout_redirect = response.json()
        return JsonResponse({
            "oAuthLogoutUrl": oauth_logout_url,
            "redirect": logout_redirect.get("href", "/")
        })

    except requests.RequestException as e:
        return JsonResponse({"error": "Failed to fetch sign-out link", "details": str(e)}, status=500)
