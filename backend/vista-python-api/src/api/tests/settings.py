"""Test-specific settings."""

from core.settings import *  # noqa: F403

DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.spatialite",
        "NAME": ":memory:",
    }
}

SPATIALITE_LIBRARY_PATH = "mod_spatialite"
