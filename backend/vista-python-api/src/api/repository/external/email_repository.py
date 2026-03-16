# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""An email repository."""

import json
from typing import ClassVar

import boto3
from django.conf import settings


class EmailRepository:
    """Contains methods to dispatch emails."""

    vista_invite_email: ClassVar[str] = settings.VISTA_INVITE_EMAIL

    def __init__(self):
        """Initiate `EmailRepository`."""
        self.ses = boto3.client("ses", region_name=settings.REGION)

    def send_added_email(self, email):
        """Dispatch VISTA invite email via SES."""
        self.ses.send_templated_email(
            Source=self.vista_invite_email,
            Destination={"ToAddresses": [email]},
            Template="UserAddedToVista",
            TemplateData=json.dumps({}),
        )
