# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

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
