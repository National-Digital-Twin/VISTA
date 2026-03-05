# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Supplies mocks for asynchronous HTTP client testing."""

import httpx


class MockResponse:
    """
    A minimal mock of an HTTP response compatible with `httpx.Response`.

    This class provides the subset of attributes and methods commonly
    used in application code, including `status_code`, `json()`,
    `text`, and `raise_for_status()`.

    It can be configured to return predefined JSON payloads or text
    bodies (such as CSV content) and to raise an
    `httpx.HTTPStatusError` when `raise_for_status()` is called on
    responses with error status codes (>= 400).

    `MockResponse` is intended for use in unit tests where HTTP
    interactions must be simulated deterministically without making
    real network requests.
    """

    def __init__(self, status_code=200, json_data=None, text=None):
        """
        Instantiate an instance of MockResponse.

        :param status_code: the HTTP status code
        :param json_data: a json response payload
        :param text: a text response payload
        """
        self.status_code = status_code
        self._json_data = json_data or {}
        self.text = text or ""

    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPStatusError(
                "Error",
                request=None,
                response=self,
            )

    def json(self):
        return self._json_data


class MockAsyncClient:
    """
    A lightweight asynchronous mock of `httpx.AsyncClient` used for testing.

    This class is designed to be a drop-in replacement for
    `httpx.AsyncClient` in unit tests. It supports usage as an
    asynchronous context manager (`async with`) and allows callers
    to define deterministic, URL-specific HTTP responses without
    performing real network I/O.

    Responses are provided via a mapping of URLs to either a single
    `MockResponse` or a list of `MockResponse` objects. When a list is
    provided, successive calls to the same URL will return responses
    in order, enabling simulation of retry behavior (e.g. failures
    followed by success).

    The client tracks how many times each URL is requested, which can
    be asserted in tests to verify retry logic and request patterns.

    This mock does not open network connections, manage sockets, or
    enforce timeouts. It exists solely to emulate the interface and
    minimal behavior required by code that depends on
    `httpx.AsyncClient`.
    """

    def __init__(self, responses_by_url):
        """
        Instantiate an instance of MockAsyncClient.

        responses_by_url: dict[str, MockResponse | list[MockResponse]]
        """
        self.responses_by_url = responses_by_url
        self.call_counts = {}

    async def __aenter__(self):
        """
        Enter the asynchronous context manager.

        This method allows `MockAsyncClient` to be used with an
        `async with` statement, matching the interface of
        `httpx.AsyncClient`.

        It returns the client instance itself so that calls such as
        `await client.get(...)` inside the context operate on this
        mock rather than a real HTTP client.

        No network resources are allocated.
        """
        return self

    async def __aexit__(self, exc_type, exc, tb):
        """
        Exit the asynchronous context manager.

        This method is called when leaving the `async with` block,
        regardless of whether an exception was raised.

        It performs no cleanup because the mock client does not manage
        real network connections or external resources. Returning
        `None` ensures that any exception raised inside the context
        is propagated, matching the behavior of `httpx.AsyncClient`.

        :param exc_type: The exception type, if an exception was raised.
        :param exc: The exception instance, if an exception was raised.
        :param tb: The traceback object, if an exception was raised.
        """

    async def get(self, url, *args, **kwargs):  # noqa: ARG002
        self.call_counts[url] = self.call_counts.get(url, 0) + 1

        response = self.responses_by_url[url]

        # Allow sequential responses (retry testing)
        if isinstance(response, list):
            index = self.call_counts[url] - 1
            return response[min(index, len(response) - 1)]

        return response


async def monkeypatch_client(monkeypatch, responses_by_url):
    """Set dynamic configuration of a mock async client."""
    client = MockAsyncClient(responses_by_url)

    def mock_client(*args, **kwargs):  # noqa: ARG001
        return client

    monkeypatch.setattr(httpx, "AsyncClient", mock_client)
    return client
