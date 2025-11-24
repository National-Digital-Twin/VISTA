"""Test-specific settings."""

from core.settings import *  # noqa: F403

DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.spatialite",
        "NAME": ":memory:",
    }
}

SPATIALITE_LIBRARY_PATH = "/usr/local/lib/mod_spatialite.so"
GDAL_LIBRARY_PATH = "/usr/local/lib/libgdal.so"