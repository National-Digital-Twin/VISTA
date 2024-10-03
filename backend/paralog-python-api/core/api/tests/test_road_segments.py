"""Example test."""

from __future__ import annotations

import json

import pytest
from django.urls import reverse
from model_bakery import baker

from api import models


@pytest.mark.django_db
def test_traffic_data_query_blank(client):
    """Test blank traffic data query."""
    query = """
    {
        roadSegment(
            roadSegmentInput: {
                coordinates: "xyz"
                direction: "up"
                dayOfWeek: "Friday"
                time: "01:00:00"
            }
        ){
            volume
            averageSpeed
            busyness
        }
    }
    """
    assert client.post(
        reverse("graphql"),
        json.dumps({"query": query}),
        content_type="application/json",
    ).json() == {"data": {"roadSegment": None}}


@pytest.mark.django_db
def test_traffic_data_query(client):
    """Test traffic data query."""
    baker.make(
        models.TrafficData,
        coordinates="xyz",
        direction="up",
        day_of_week="Friday",
        hour="01:00:00",
        volume=1,
        average_speed=2,
        busyness=3,
    )
    query = """
    {
        roadSegment(
            roadSegmentInput: {
                coordinates: "xyz"
                direction: "up"
                dayOfWeek: "Friday"
                time: "01:00:00"
            }
        ){
            volume
            averageSpeed
            busyness
        }
    }
    """
    assert client.post(
        reverse("graphql"),
        json.dumps({"query": query}),
        content_type="application/json",
    ).json() == {"data": {"roadSegment": {"averageSpeed": 2, "busyness": 3, "volume": 1}}}
