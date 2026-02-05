"""Provides fixtures and utility functions for this test module."""

import pytest

from api.models import FocusArea


@pytest.fixture
def create_mapwide_focus_area(mock_user_id):
    """Create a map-wide focus area for a given scenario."""

    def _create(scenario, *, user_id=None, is_active=True):
        return FocusArea.objects.create(
            scenario=scenario,
            user_id=user_id or mock_user_id,
            name="Map-wide",
            is_active=is_active,
            is_system=True,
        )

    return _create
