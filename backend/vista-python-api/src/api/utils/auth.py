"""Authentication utilities for extracting user identity."""

import base64
import json
import uuid

from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed


def _decode_jwt(jwt):
    try:
        payload = jwt.split(".")[1]
        return json.loads(base64.urlsafe_b64decode(payload + "=="))
    except (IndexError, KeyError, ValueError) as e:
        raise AuthenticationFailed(f"Invalid token format: {e}") from e


def _validate_header_fetch_jwt(request):
    jwt = request.headers.get("X-Auth-Request-Access-Token")
    if not jwt:
        raise AuthenticationFailed("Missing X-Auth-Request-Access-Token")
    return jwt


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
    jwt = _validate_header_fetch_jwt(request)
    token = _decode_jwt(jwt)
    try:
        return uuid.UUID(token["sub"])
    except (IndexError, KeyError, ValueError) as e:
        raise AuthenticationFailed(f"Invalid token format: {e}") from e


def get_user_is_admin_from_request(request) -> bool:
    """
    Extract whether the user is an admin from the authentication token.

    The token is already validated by the gateway (Istio), so we just
    decode the JWT payload to extract the subject claim.

    In development, returns true.

    Args:
        request: The HTTP request object

    Returns:
        bool indicating whether user is an admin

    Raises:
        AuthenticationFailed: If token is missing or invalid
    """
    if not settings.IS_PROD:
        return True
    jwt = _validate_header_fetch_jwt(request)
    token = _decode_jwt(jwt)
    return "vista_admin" in token["cognito:groups"]
