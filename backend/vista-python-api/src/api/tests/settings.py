"""Test-specific settings."""

from core.settings import *  # noqa: F403

DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.spatialite",
        "NAME": ":memory:",
    }
}
