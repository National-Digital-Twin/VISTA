"""Tests for authentication utilities."""

import base64
import json
import uuid

import pytest
from rest_framework.exceptions import AuthenticationFailed

from api.utils.auth import get_user_id_from_request


def _create_jwt(payload: dict) -> str:
    """Create a mock JWT token with the given payload."""
    header = base64.urlsafe_b64encode(b'{"alg":"RS256","typ":"JWT"}').rstrip(b"=")
    payload_bytes = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=")
    signature = base64.urlsafe_b64encode(b"mock-signature").rstrip(b"=")
    return f"{header.decode()}.{payload_bytes.decode()}.{signature.decode()}"


class MockRequest:
    """Mock request object for testing."""

    def __init__(self, headers: dict | None = None):
        """Initialize with optional headers."""
        self.headers = headers or {}


@pytest.fixture
def user_id():
    """Return a consistent user ID for testing."""
    return uuid.UUID("a662a214-60e1-7064-9816-9fde0e9489b2")


@pytest.fixture
def valid_token(user_id):
    """Create a valid JWT token with standard Cognito claims."""
    return _create_jwt(
        {
            "sub": str(user_id),
            "cognito:groups": ["vista_access"],
            "iss": "https://cognito-idp.eu-west-2.amazonaws.com/eu-west-2_test",
            "token_use": "access",
            "exp": 9999999999,
            "iat": 1700000000,
        }
    )


class TestGetUserIdFromRequest:
    """Tests for get_user_id_from_request function."""

    def test_returns_mock_user_in_dev_mode(self, settings):
        """In development mode, returns a consistent mock user ID."""
        settings.IS_PROD = False
        request = MockRequest()

        result = get_user_id_from_request(request)

        assert result == uuid.UUID("00000000-0000-0000-0000-000000000001")

    def test_extracts_user_id_from_valid_token(self, settings, valid_token, user_id):
        """Extracts the sub claim from a valid JWT token."""
        settings.IS_PROD = True
        request = MockRequest({"X-Auth-Request-Access-Token": valid_token})

        result = get_user_id_from_request(request)

        assert result == user_id

    def test_raises_error_when_token_missing(self, settings):
        """Raises AuthenticationFailed when token header is missing."""
        settings.IS_PROD = True
        request = MockRequest()

        with pytest.raises(AuthenticationFailed, match="Missing X-Auth-Request-Access-Token"):
            get_user_id_from_request(request)

    def test_raises_error_for_malformed_token(self, settings):
        """Raises AuthenticationFailed when token is not a valid JWT."""
        settings.IS_PROD = True
        request = MockRequest({"X-Auth-Request-Access-Token": "not-a-jwt"})

        with pytest.raises(AuthenticationFailed, match="Invalid token format"):
            get_user_id_from_request(request)

    def test_raises_error_when_sub_claim_missing(self, settings):
        """Raises AuthenticationFailed when sub claim is not in token."""
        settings.IS_PROD = True
        token = _create_jwt({"exp": 9999999999})
        request = MockRequest({"X-Auth-Request-Access-Token": token})

        with pytest.raises(AuthenticationFailed, match="Invalid token format"):
            get_user_id_from_request(request)

    def test_raises_error_when_sub_is_not_valid_uuid(self, settings):
        """Raises AuthenticationFailed when sub claim is not a valid UUID."""
        settings.IS_PROD = True
        token = _create_jwt({"sub": "not-a-uuid"})
        request = MockRequest({"X-Auth-Request-Access-Token": token})

        with pytest.raises(AuthenticationFailed, match="Invalid token format"):
            get_user_id_from_request(request)
