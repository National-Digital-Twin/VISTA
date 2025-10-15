"""A base class for data source handlers."""

import asyncio
import csv
import io
import logging
import random

import httpx
import requests


class DataSourceHandler:
    """Base class for data source handlers."""

    logger = logging.getLogger(__name__)

    def __init__(self, locator: str):
        """Construct instance."""
        self.locator = locator

    def build_urls_for_data_source(self):
        """Return a list of URLs for the data source."""
        raise NotImplementedError

    def fetch_data_for_asset_specification(self, asset_specification, url: str):
        """Fetch and parse data for the given asset spec."""
        raise NotImplementedError

    def fetch_csv_from_url(self, url: str):
        """Fetch CSV from URL."""
        response = requests.get(url)
        response.raise_for_status()
        csv_data = io.StringIO(response.text)
        reader = csv.DictReader(csv_data)
        return list(reader)

    async def fetch_from_url_with_retry(
        self, url: str, retries: int = 5, backoff: float = 0.5, **kwargs
    ) -> dict | None:
        """
        Fetch JSON data from a URL with exponential backoff retries.

        :param url: The URL to fetch.
        :param retries: How many times to retry on failure.
        :param backoff: Base delay between retries (in seconds).
        :return: Parsed JSON response.
        :raises: Exception if all retries fail.
        """
        http_params = kwargs.get("params")
        headers = kwargs.get("headers")
        async with httpx.AsyncClient(timeout=10.0) as client:
            for attempt in range(retries + 1):
                try:
                    response = await client.get(url, params=http_params, headers=headers)
                    response.raise_for_status()
                    return response.json()

                except Exception as err:
                    if attempt < retries:
                        delay = backoff * (2**attempt) + random.uniform(0, 0.1)
                        self.logger.info(
                            "Retrying %s, attempt %s after %ss", url, attempt + 1, delay
                        )
                        await asyncio.sleep(delay)
                    else:
                        raise RuntimeError from err(
                            f"Failed to fetch {url} after {retries + 1} attempts: {err}"
                        )
        return None
