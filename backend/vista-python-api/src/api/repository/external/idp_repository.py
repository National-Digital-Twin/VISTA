"""An identity provider repository."""

from typing import ClassVar

import boto3
from django.conf import settings

from api.domain.cognito_user import IdpUser


class IdpRepository:
    """An identity provider repository."""

    user_pool_id: ClassVar[str] = settings.COGNITO_USER_POOL_ID
    user_group_name: ClassVar[str] = settings.COGNITO_MAIN_USER_GROUP_NAME

    def __init__(self):
        """Construct an instance."""
        self.client = boto3.client("cognito-idp", region_name=settings.REGION)

    def list_users_in_group(self) -> list[IdpUser]:
        """Get a list of users known to the identity provider."""
        response = self.client.list_users_in_group(
            UserPoolId=self.user_pool_id, GroupName=self.user_group_name
        )
        return [IdpUser.from_cognito(user) for user in response["Users"]]
