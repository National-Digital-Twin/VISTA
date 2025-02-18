"""Example test."""

from __future__ import annotations

import json

import pytest
from django.urls import reverse
from model_bakery import baker

from api import models


@pytest.mark.django_db()
def test_vulnerable_people_query(client):
    """Test vulnerable people query."""
    baker.make(
        models.VulnerablePerson,
        mock_individual_index="example indivdual index",
        mock_property_index="example property index",
        mock_first_name="example first name",
        mock_last_name="example last name",
        mock_sex="example sex",
        mock_year_of_birth=1991,
        mock_disability="Activities limited a lot",
        mock_asc_primary_support_reason="example primary support reason",
        mock_address_line1="1 West High Down",
        mock_alert_category="example alert category",
        mock_alert_detail="example alert detail",
        uprn="100023336956",
        postcode_locator="PO39 0JH",
        latitude=50.6620948026467,
        longitude=-1.576471270240822,
    )
    query = """
    {
        vulnerablePeople(
            vulnerablePeopleInput: {
                latMin: 40
                latMax: 60
                lonMin: -2
                lonMax: 0
            }
        ){
            mockPropertyIndex
            mockFirstName
            mockLastName
            mockSex
            mockYearOfBirth
            mockDisability
            mockAscPrimarySupportReason
            mockAddressLine1
            mockAlertCategory
            mockAlertDetail
            uprn
            postcodeLocator
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
            "vulnerablePeople": [
                {
                    "mockPropertyIndex": "example property index",
                    "mockFirstName": "example first name",
                    "mockLastName": "example last name",
                    "mockSex": "example sex",
                    "mockYearOfBirth": 1991,
                    "mockDisability": "Activities limited a lot",
                    "mockAscPrimarySupportReason": "example primary support reason",
                    "mockAddressLine1": "1 West High Down",
                    "mockAlertCategory": "example alert category",
                    "mockAlertDetail": "example alert detail",
                    "uprn": "100023336956",
                    "postcodeLocator": "PO39 0JH",
                    "latitude": 50.6620948026467,
                    "longitude": -1.576471270240822,
                }
            ]
        }
    }
