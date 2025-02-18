"""Example test."""

from __future__ import annotations

import json

import pytest
from django.urls import reverse
from model_bakery import baker

from api import models


@pytest.mark.django_db()
def test_low_bridges_query(client):
    """Test vulnerable people query."""
    baker.make(
        models.LowBridge,
        local_id="example id",
        dimension_in=3,
        direction="up",
        latitude=50.693848,
        longitude=-1.304734,
        name="nice bridge",
    )
    query = """
    {
        lowBridges(
            lowBridgeInput: {
                latMin: 40
                latMax: 60
                lonMin: -2
                lonMax: 0
            }
        ){
            localId
            dimensionIn
            direction
            latitude
            longitude
        }
    }
    """
    assert client.post(
        reverse("graphql"),
        json.dumps({"query": query}),
        content_type="application/json",
    ).json() == {
        "data": {
            "lowBridges": [
                {
                    "localId": "example id",
                    "dimensionIn": 3,
                    "direction": "up",
                    "latitude": 50.693848,
                    "longitude": -1.304734,
                }
            ]
        }
    }
