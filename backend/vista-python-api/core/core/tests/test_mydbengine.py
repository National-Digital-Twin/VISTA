"""Test mydbengine."""

from __future__ import annotations

from unittest import mock

from core.mydbengine.base import DatabaseWrapper


def test_mydbengine():
    """Test mydbengine."""
    with mock.patch(
        "boto3.client",
        **{"return_value.generate_db_auth_token.return_value": mock.sentinel.example},
    ):
        assert DatabaseWrapper(
            {
                "ENGINE": "core.mydbengine",
                "NAME": "vista",
                "USER": "vista",
                "HOST": "example.com",
                "PORT": 5432,
                "REGION": "eu-west-2",
                "OPTIONS": {"sslmode": "verify-full", "sslrootcert": "system"},
                "CONN_MAX_AGE": None,
            }
        ).get_connection_params() == {
            "client_encoding": "UTF8",
            "cursor_factory": mock.ANY,
            "dbname": "vista",
            "host": "example.com",
            "password": mock.sentinel.example,
            "port": 5432,
            "sslmode": "verify-full",
            "sslrootcert": "system",
            "user": "vista",
        }
