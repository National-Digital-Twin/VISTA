"""Example test."""

from __future__ import annotations

import json
from decimal import Decimal

import pytest
from django.urls import reverse
from model_bakery import baker

from api import models


@pytest.mark.django_db()
def test_sandbag_list(client):
    """Test sandbag bulk query."""
    sandbag = baker.make(
        models.SandbagPlacement,
        name="example",
        latitude=Decimal("50.693848"),
        longitude=Decimal("-1.304734"),
    )
    query = """
    {
        sandbagPlacements {
            id
            name
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
            "sandbagPlacements": [
                {
                    "id": f"{sandbag.pk}",
                    "name": "example",
                    "latitude": 50.693848,
                    "longitude": -1.304734,
                }
            ],
        }
    }


@pytest.mark.django_db()
def test_sandbag_by_name(client):
    """Test individual lookup."""
    sandbag = baker.make(
        models.SandbagPlacement,
        name="example",
        latitude=Decimal("50.693848"),
        longitude=Decimal("-1.304734"),
    )
    query = """
    {
        sandbagPlacement(name: "example") {
            id
            name
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
            "sandbagPlacement": [
                {
                    "id": f"{sandbag.pk}",
                    "name": "example",
                    "latitude": 50.693848,
                    "longitude": -1.304734,
                }
            ],
        }
    }


@pytest.mark.django_db()
def test_sandbag_create(client):
    """Test sandbag creation."""
    query = """
    mutation {
        createSandbagPlacement(
            sandbagPlacementInput: {
              name: "example"
              latitude: 50.693848
              longitude: -1.304734,
            }
        ) {
            sandbagPlacement {
                id
                name
                latitude
                longitude
            }
            success
            errors {
                field
                messages
            }
        }
    }
    """
    response = client.post(
        reverse("graphql"),
        json.dumps({"query": query}),
        content_type="application/json",
    )
    sandbag = models.SandbagPlacement.objects.get()
    assert response.json() == {
        "data": {
            "createSandbagPlacement": {
                "sandbagPlacement": {
                    "id": f"{sandbag.pk}",
                    "name": "example",
                    "latitude": 50.693848,
                    "longitude": -1.304734,
                },
                "errors": [],
                "success": True,
            }
        }
    }


def _sandbag_to_dict(sandbag):
    return {
        "name": sandbag.name,
        "latitude": sandbag.latitude,
        "longitude": sandbag.longitude,
    }


@pytest.mark.django_db()
def test_sandbag_update(client):
    """Test sandbag creation."""
    sandbag = baker.make(
        models.SandbagPlacement,
        name="example",
        latitude=50.693848,
        longitude=-1.304734,
    )
    query = """
    mutation {
        updateSandbagPlacement(
            sandbagPlacementInput: {
              name: "example"
              latitude: 2
              longitude: -1,
            }
        ) {
            sandbagPlacement {
                id
                name
                latitude
                longitude
            }
            success
            errors {
                field
                messages
            }
        }
    }
    """
    response = client.post(
        reverse("graphql"),
        json.dumps({"query": query}),
        content_type="application/json",
    )
    assert response.json() == {
        "data": {
            "updateSandbagPlacement": {
                "sandbagPlacement": {
                    "id": f"{sandbag.pk}",
                    "name": "example",
                    "latitude": 2.0,
                    "longitude": -1.0,
                },
                "errors": [],
                "success": True,
            }
        }
    }
    sandbag.refresh_from_db()
    assert _sandbag_to_dict(sandbag) == {
        "name": "example",
        "latitude": 2.0,
        "longitude": -1.0,
    }


@pytest.mark.django_db()
def test_sandbag_update_does_not_exist(client):
    """Test sandbag creation does not exist."""
    query = """
    mutation {
        updateSandbagPlacement(
            sandbagPlacementInput: {
              name: "example"
              latitude: 2
              longitude: -1,
            }
        ) {
            sandbagPlacement {
                id
                name
                latitude
                longitude
            }
            errors {
                field
                messages
            }
            success
        }
    }
    """
    response = client.post(
        reverse("graphql"),
        json.dumps({"query": query}),
        content_type="application/json",
    )
    assert response.json() == {
        "data": {
            "updateSandbagPlacement": {
                "sandbagPlacement": None,
                "errors": [
                    {
                        "field": "name",
                        "messages": [
                            "SandbagPlacement matching query does not exist.",
                        ],
                    }
                ],
                "success": False,
            }
        }
    }


@pytest.mark.django_db()
def test_sandbag_delete(client):
    """Test sandbag deletion."""
    sandbag = baker.make(models.SandbagPlacement, name="example")
    query = """
    mutation {
        deleteSandbagPlacement(
          name: "example"
        ) {
            sandbagPlacement {
                id
                name
                latitude
                longitude
            }
            success
            errors {
                field
                messages
            }
        }
    }
    """
    response = client.post(
        reverse("graphql"),
        json.dumps({"query": query}),
        content_type="application/json",
    )
    assert response.json() == {
        "data": {
            "deleteSandbagPlacement": {
                "sandbagPlacement": None,
                "errors": [],
                "success": True,
            }
        }
    }
    with pytest.raises(models.SandbagPlacement.DoesNotExist):
        sandbag.refresh_from_db()


@pytest.mark.django_db()
def test_sandbag_delete_not_found(client):
    """Test sandbag deletion for when not found."""
    query = """
    mutation {
        deleteSandbagPlacement(
          name: "example"
        ) {
            sandbagPlacement {
                id
                name
                latitude
                longitude
            }
            success
            errors {
                field
                messages
            }
        }
    }
    """
    response = client.post(
        reverse("graphql"),
        json.dumps({"query": query}),
        content_type="application/json",
    )
    assert response.json() == {
        "data": {
            "deleteSandbagPlacement": {
                "sandbagPlacement": None,
                "errors": [
                    {
                        "field": "name",
                        "messages": ["SandbagPlacement matching query does not exist."],
                    },
                ],
                "success": False,
            }
        }
    }
