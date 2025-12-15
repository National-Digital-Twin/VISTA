"""Views for interfacing with application users."""

from typing import ClassVar

from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from api.permissions import Administrator
from api.repository.external.idp_repository import IdpRepository
from api.serializers import IdpUserSerializer


class ApplicationUserViewSet(ViewSet):
    """Views for interfacing with application users."""

    permission_classes: ClassVar = [Administrator]

    def __init__(self, **kwargs):
        """Construct an instance of `ApplicationUserViewSet`."""
        super().__init__(**kwargs)
        self.idp_repository = IdpRepository()

    def list(self, _request):
        """Return a list of all users."""
        users = self.idp_repository.list_users_in_group()
        serializer = IdpUserSerializer(users, many=True)
        return Response(serializer.data)
