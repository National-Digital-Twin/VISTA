"""Authentication utilities for extracting user identity."""

import base64
import json
import uuid

from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed


def get_user_id_from_request(request) -> uuid.UUID:
    """
    Extract user ID from the authentication token.

    The token is already validated by the gateway (Istio), so we just
    decode the JWT payload to extract the subject claim.

    In development, returns a mock user ID.

    Args:
        request: The HTTP request object

    Returns:
        UUID of the authenticated user

    Raises:
        AuthenticationFailed: If token is missing or invalid
    """
    if not settings.IS_PROD:
        return uuid.UUID("00000000-0000-0000-0000-000000000001")

    token = request.headers.get("X-Auth-Request-Access-Token")
    if not token:
        raise AuthenticationFailed("Missing X-Auth-Request-Access-Token")

    try:
        payload = token.split(".")[1]
        decoded = json.loads(base64.urlsafe_b64decode(payload + "=="))
        return uuid.UUID(decoded["sub"])
    except (IndexError, KeyError, ValueError) as e:
        raise AuthenticationFailed(f"Invalid token format: {e}") from e
