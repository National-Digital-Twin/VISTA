# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Tests for email repository."""

from unittest.mock import MagicMock, call, patch

import pytest

from api.repository.external.email_repository import EmailRepository


@pytest.fixture
def mock_boto_client():
    """Mock boto3 ses client."""
    return MagicMock()


@pytest.fixture
def repository(mock_boto_client):
    """Create repository with mocked boto3 client."""
    with patch(
        "api.repository.external.email_repository.boto3.client",
        return_value=mock_boto_client,
    ):
        return EmailRepository()


def test_send_added_email_calls_ses_correctly(repository, mock_boto_client, settings):  # noqa: ARG001
    """Ensure ses called correctly."""
    email = "bob@test.com"
    repository.send_added_email(email)

    assert mock_boto_client.send_templated_email.call_count == 1
    mock_boto_client.send_templated_email.assert_has_calls(
        [
            call(
                Source="vista-invite-email@vista.com",
                Destination={"ToAddresses": [email]},
                Template="UserAddedToVista",
                TemplateData="{}",
            ),
        ]
    )
