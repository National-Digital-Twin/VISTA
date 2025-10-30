"""vista Backend URLs with GraphQL View constructor."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from api import rest_views
from api.schema import schema
from api.views.asset_types import AssetTypeViewSet
from api.views.assets import AssetViewSet
from api.views.data_sources import DataSourceViewSet
from api.views.dependency import DependencyViewSet
from api.views.graph import NoMultipartGraphQLView
from api.views.users import ApplicationUserViewSet

router = DefaultRouter()
router.register(r"assets", AssetViewSet)
router.register(r"assettypes", AssetTypeViewSet)
router.register(r"datasources", DataSourceViewSet)
router.register(r"dependency", DependencyViewSet)
router.register(r"users", ApplicationUserViewSet, basename="user")

urlpatterns = [
    path("graphql/", NoMultipartGraphQLView.as_view(schema=schema), name="graphql"),
    path("user/", rest_views.user_details_view, name="api-user"),
    path("auth/signout/", rest_views.signout_view, name="signout"),
    path("", include(router.urls)),
]
