"""Views for interfacing with application users."""

from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from api.repository.external.idp_repository import IdpRepository
from api.serializers import IdpUserSerializer


class ApplicationUserViewSet(ViewSet):
    """Views for interfacing with application users."""

    def __init__(self, idp_repository=None, **kwargs):
        """Construct an instance of `ApplicationUserViewSet`."""
        super().__init__(**kwargs)
        self.idp_repository = idp_repository if idp_repository else IdpRepository()

    def list(self, _request):
        """Return a list of all users."""
        users = self.idp_repository.list_users_in_group()
        serializer = IdpUserSerializer(users, many=True)
        return Response(serializer.data)
