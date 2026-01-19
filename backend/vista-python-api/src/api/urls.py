"""vista Backend URLs with GraphQL View constructor."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from api import rest_views, views
from api.schema import schema
from api.views.asset_categories import AssetCategoryViewSet
from api.views.asset_types import AssetTypeViewSet
from api.views.assets import AssetViewSet
from api.views.data_sources import DataSourceViewSet
from api.views.dependency import DependencyViewSet
from api.views.graph import NoMultipartGraphQLView
from api.views.users import ApplicationUserViewSet

router = DefaultRouter()
router.register(r"assetcategories", AssetCategoryViewSet)
router.register(r"assets", AssetViewSet)
router.register(r"assettypes", AssetTypeViewSet)
router.register(r"users", ApplicationUserViewSet, basename="user")
router.register(r"datasources", DataSourceViewSet, basename="datasource")
router.register(r"dependency", DependencyViewSet)
router.register(r"exposurelayers", views.ExposureLayerViewSet, basename="exposurelayer")
router.register(r"scenarios", views.ScenarioViewSet, basename="scenario")

urlpatterns = [
    path("graphql/", NoMultipartGraphQLView.as_view(schema=schema), name="graphql"),
    path("user/", rest_views.user_details_view, name="api-user"),
    path("auth/signout/", rest_views.signout_view, name="signout"),
    path(
        "scenarios/<uuid:scenario_id>/focus-areas/",
        views.FocusAreaViewSet.as_view({"get": "list", "post": "create"}),
        name="focus-area-list",
    ),
    path(
        "scenarios/<uuid:scenario_id>/focus-areas/<uuid:pk>/",
        views.FocusAreaViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="focus-area-detail",
    ),
    path(
        "scenarios/<uuid:scenario_id>/visible-asset-types/",
        views.VisibleAssetTypeView.as_view(),
        name="visible-asset-types",
    ),
    path(
        "scenarios/<uuid:scenario_id>/visible-exposure-layers/",
        views.VisibleExposureLayerView.as_view(),
        name="visible-exposure-layers",
    ),
    path(
        "scenarios/<uuid:scenario_id>/visible-exposure-layers/bulk/",
        views.BulkVisibleExposureLayerView.as_view(),
        name="visible-exposure-layers-bulk",
    ),
    path(
        "scenarios/<uuid:scenario_id>/asset-types/",
        views.ScenarioAssetTypesView.as_view(),
        name="scenario-asset-types",
    ),
    path(
        "scenarios/<uuid:scenario_id>/exposure-layers/",
        views.ScenarioExposureLayersView.as_view(),
        name="scenario-exposure-layers",
    ),
    path(
        "scenarios/<uuid:scenario_id>/exposure-layers/<uuid:exposure_layer_id>/",
        views.ScenarioExposureLayersView.as_view(),
        name="scenario-exposure-layer-detail",
    ),
    path(
        "scenarios/<uuid:scenario_id>/assets/",
        views.ScenarioAssetsView.as_view(),
        name="scenario-assets",
    ),
    path(
        "scenarios/<uuid:scenario_id>/assetscores/<uuid:pk>/",
        views.AssetScoreViewSet.as_view({"get": "retrieve"}),
        name="asset-score-detail",
    ),
    path(
        "scenarios/<uuid:scenario_id>/asset-score-filters/",
        views.AssetScoreFiltersView.as_view(),
        name="asset-score-filters",
    ),
    path("", include(router.urls)),
]
