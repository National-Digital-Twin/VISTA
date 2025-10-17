"""vista Backend URLs with GraphQL View constructor."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from api import rest_views
from api.schema import schema
from api.views.assets import AssetViewSet
from api.views.dependency import DependencyViewSet
from api.views.graph import NoMultipartGraphQLView

router = DefaultRouter()
router.register(r"assets", AssetViewSet)
router.register(r"dependency", DependencyViewSet)

urlpatterns = [
    path("graphql/", NoMultipartGraphQLView.as_view(schema=schema), name="graphql"),
    path("user/", rest_views.user_details_view, name="api-user"),
    path("auth/signout/", rest_views.signout_view, name="signout"),
    path("", include(router.urls)),
]
