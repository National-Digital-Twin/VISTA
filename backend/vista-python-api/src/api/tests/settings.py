"""Test-specific settings."""

import os

from core.settings import *  # noqa: F403

DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": os.getenv("TEST_DB_NAME", "test_db"),
        "USER": os.getenv("TEST_DB_USER", "postgres"),
        "PASSWORD": os.getenv("TEST_DB_PASSWORD", "postgres"),
        "HOST": os.getenv("TEST_DB_HOST", "localhost"),
        "PORT": os.getenv("TEST_DB_PORT", "5432"),
    }
}
COGNITO_USER_POOL_ID = "test-pool-id"
VISTA_INVITE_EMAIL = "vista-invite-email@vista.com"
COGNITO_MAIN_USER_GROUP_NAME = "users"
COGNITO_ADMIN_USER_GROUP_NAME = "admins"
REGION = "eu-west-2"
OS_NAMES_API_KEY = "987654321"
OS_NGD_API_KEY = "abc"
