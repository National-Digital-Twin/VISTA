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
