"""Repository for the assets_within_500m_exposure_layers view."""

from logging import getLogger

from django.db import connection

logger = getLogger(__name__)


def refresh():
    """Refresh exposure layer materialized view."""
    with connection.cursor() as cursor:
        cursor.execute("REFRESH MATERIALIZED VIEW public.assets_within_500m_exposure_layers;")
    logger.info("Successfully refreshed exposure layer view")
