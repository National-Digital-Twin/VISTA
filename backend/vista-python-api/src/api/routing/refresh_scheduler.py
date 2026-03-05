# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Background refresh scheduler for routing cache."""

from __future__ import annotations

import logging
import threading
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from collections.abc import Callable

logger = logging.getLogger(__name__)

REFRESH_INTERVAL_SECONDS = 300


class RefreshScheduler:
    """Periodically checks for data changes and triggers a rebuild callback."""

    def __init__(
        self,
        has_changed_fn: Callable[[], bool],
        rebuild_fn: Callable[[], None],
        interval: float = REFRESH_INTERVAL_SECONDS,
    ) -> None:
        """Initialize the scheduler with change detection and rebuild callbacks."""
        self._has_changed = has_changed_fn
        self._rebuild = rebuild_fn
        self._interval = interval
        self._thread: threading.Thread | None = None
        self._shutdown = threading.Event()

    def start(self) -> None:
        """Start the background refresh thread."""
        if self._thread and self._thread.is_alive():
            return
        self._shutdown.clear()
        self._thread = threading.Thread(
            target=self._loop,
            daemon=True,
            name="routing-cache-refresh",
        )
        self._thread.start()
        logger.info("Started routing cache refresh scheduler")

    def stop(self, timeout: float = 5.0) -> None:
        """Stop the background refresh thread."""
        self._shutdown.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=timeout)
        self._thread = None

    def _loop(self) -> None:
        """Background loop that checks for changes and rebuilds."""
        while not self._shutdown.is_set():
            self._shutdown.wait(timeout=self._interval)
            if self._shutdown.is_set():
                break
            try:
                if self._has_changed():
                    logger.info("Road network data changed, rebuilding cache...")
                    self._rebuild()
            except Exception:
                logger.exception("Error during cache refresh")
