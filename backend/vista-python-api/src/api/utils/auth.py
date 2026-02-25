"""Authentication utilities for extracting user identity."""

import base64
import json
import secrets
import string
import uuid

from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed

MINIMUM_PWD_LENGTH = 10
cognito_group_attr = "cognito:groups"


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


def is_user_authenticated(request) -> bool:
    """
    Determine whether the user is authenticated.

    The token is already validated by the gateway (Istio), so we just
    decode the JWT payload to extract the subject claim.

    In development, returns true.

    Args:
        request: The HTTP request object

    Returns:
        boolean: true if user is authenticated

    Raises:
        AuthenticationFailed: If user is not authenticated
    """
    if not settings.IS_PROD:
        return True
    jwt = _validate_header_fetch_jwt(request)
    token = _decode_jwt(jwt)
    try:
        return cognito_group_attr in token and "vista_access" in token[cognito_group_attr]
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
    return "vista_admin" in token[cognito_group_attr]


def generate_temp_password(length: int = 16) -> str:
    """Generate a Cognito-compatible temporary password."""
    if length < MINIMUM_PWD_LENGTH:
        raise ValueError("Password length must be at least 10 characters")

    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    special = "!@#$%^&*()-_=+[]{}<>?"

    password_chars = [
        secrets.choice(lowercase),
        secrets.choice(uppercase),
        secrets.choice(digits),
        secrets.choice(special),
    ]

    all_chars = lowercase + uppercase + digits + special

    password_chars.extend(secrets.choice(all_chars) for _ in range(length - len(password_chars)))

    # Fisher-Yates shuffle using secrets
    for i in range(len(password_chars) - 1, 0, -1):
        j = secrets.randbelow(i + 1)
        password_chars[i], password_chars[j] = password_chars[j], password_chars[i]

    return "".join(password_chars)
