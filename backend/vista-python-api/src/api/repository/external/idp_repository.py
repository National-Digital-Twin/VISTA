"""An identity provider repository."""

from typing import ClassVar

import boto3
from django.conf import settings

from api.domain.cognito_user import IdpUser


class IdpRepository:
    """An identity provider repository."""

    user_pool_id: ClassVar[str] = settings.COGNITO_USER_POOL_ID

    def __init__(self):
        """Construct an instance."""
        self.client = boto3.client("cognito-idp", region_name=settings.REGION)

    def list_users(self) -> list[IdpUser]:
        """Get a list of users known to the identity provider."""
        response = self.client.list_users(UserPoolId=self.user_pool_id)
        return [IdpUser.from_cognito(user) for user in response["Users"]]
