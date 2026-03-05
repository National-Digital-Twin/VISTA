# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Tests for the refresh scheduler."""

import threading
from unittest.mock import Mock

from api.routing.refresh_scheduler import RefreshScheduler

THREAD_NAME = "routing-cache-refresh"


def _scheduler_thread_alive() -> bool:
    """Check if the scheduler thread is currently running."""
    return any(t.name == THREAD_NAME for t in threading.enumerate())


class TestRefreshScheduler:
    """Tests for RefreshScheduler background thread management."""

    def test_start_begins_background_thread(self):
        """Starting the scheduler should create a background thread."""
        scheduler = RefreshScheduler(
            has_changed_fn=Mock(return_value=False),
            rebuild_fn=Mock(),
            interval=60,
        )

        scheduler.start()
        try:
            assert _scheduler_thread_alive()
        finally:
            scheduler.stop()

    def test_stop_terminates_thread(self):
        """Stopping the scheduler should terminate the background thread."""
        scheduler = RefreshScheduler(
            has_changed_fn=Mock(return_value=False),
            rebuild_fn=Mock(),
            interval=60,
        )

        scheduler.start()
        assert _scheduler_thread_alive()

        scheduler.stop()
        assert not _scheduler_thread_alive()

    def test_rebuild_called_when_data_changes(self):
        """Scheduler should call rebuild_fn when has_changed_fn returns True."""
        rebuilt = threading.Event()
        rebuild_fn = Mock(side_effect=rebuilt.set)

        scheduler = RefreshScheduler(
            has_changed_fn=Mock(return_value=True),
            rebuild_fn=rebuild_fn,
            interval=0.05,
        )

        scheduler.start()
        try:
            rebuilt.wait(timeout=2)
            assert rebuild_fn.called
        finally:
            scheduler.stop()

    def test_no_rebuild_when_data_unchanged(self):
        """Scheduler should not call rebuild_fn when has_changed_fn returns False."""
        checked = threading.Event()
        has_changed = Mock(return_value=False, side_effect=lambda: checked.set() or False)
        rebuild_fn = Mock()

        scheduler = RefreshScheduler(
            has_changed_fn=has_changed,
            rebuild_fn=rebuild_fn,
            interval=0.05,
        )

        scheduler.start()
        try:
            checked.wait(timeout=2)
            assert not rebuild_fn.called
        finally:
            scheduler.stop()

    def test_exception_in_refresh_does_not_crash_thread(self):
        """Exception in has_changed_fn should be logged, not crash the thread."""
        call_count = threading.Event()
        calls = []

        def failing_check():
            calls.append(1)
            if len(calls) >= 2:
                call_count.set()
            raise RuntimeError("test error")

        scheduler = RefreshScheduler(
            has_changed_fn=failing_check,
            rebuild_fn=Mock(),
            interval=0.05,
        )

        scheduler.start()
        try:
            call_count.wait(timeout=2)
            assert len(calls) >= 2, "Thread should survive exceptions and keep running"
            assert _scheduler_thread_alive()
        finally:
            scheduler.stop()

    def test_double_start_is_safe(self):
        """Calling start() twice should not create multiple threads."""
        scheduler = RefreshScheduler(
            has_changed_fn=Mock(return_value=False),
            rebuild_fn=Mock(),
            interval=60,
        )

        scheduler.start()
        scheduler.start()

        try:
            count = sum(1 for t in threading.enumerate() if t.name == THREAD_NAME)
            assert count == 1
        finally:
            scheduler.stop()

    def test_stop_without_start_is_safe(self):
        """Calling stop() before start() should not raise."""
        scheduler = RefreshScheduler(
            has_changed_fn=Mock(return_value=False),
            rebuild_fn=Mock(),
            interval=60,
        )

        scheduler.stop()
