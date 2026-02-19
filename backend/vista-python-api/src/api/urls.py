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
from api.views.group_data_source_access import GroupDataSourceAccessViewSet
from api.views.group_memberships import GroupMembershipViewSet
from api.views.groups import GroupViewSet
from api.views.users import ApplicationUserViewSet

router = DefaultRouter()
router.register(r"assetcategories", AssetCategoryViewSet)
router.register(r"assets", AssetViewSet)
router.register(r"assettypes", AssetTypeViewSet)
router.register(r"datasources", DataSourceViewSet, basename="datasource")
router.register(r"dependency", DependencyViewSet)
router.register(r"exposurelayers", views.ExposureLayerViewSet, basename="exposurelayer")
router.register(r"groups", GroupViewSet)
router.register(r"scenarios", views.ScenarioViewSet, basename="scenario")
router.register(r"users", ApplicationUserViewSet, basename="user")

urlpatterns = [
    path("graphql/", NoMultipartGraphQLView.as_view(schema=schema), name="graphql"),
    path("user/", rest_views.user_details_view, name="api-user"),
    path("auth/signout/", rest_views.signout_view, name="signout"),
    path(
        "groups/<uuid:group_id>/members/",
        GroupMembershipViewSet.as_view(
            {
                "post": "create",
            }
        ),
    ),
    path(
        "groups/<uuid:group_id>/members/<uuid:user_id>/",
        GroupMembershipViewSet.as_view(
            {
                "delete": "destroy",
            }
        ),
    ),
    path(
        "datasources/<uuid:data_source_id>/access/",
        GroupDataSourceAccessViewSet.as_view(
            {
                "post": "create",
            }
        ),
    ),
    path(
        "datasources/<uuid:data_source_id>/access/<uuid:group_id>/",
        GroupDataSourceAccessViewSet.as_view(
            {
                "delete": "destroy",
            }
        ),
    ),
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
        "scenarios/<uuid:scenario_id>/visible-asset-types/bulk/",
        views.BulkVisibleAssetTypeView.as_view(),
        name="visible-asset-types-bulk",
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
        views.ScenarioExposureLayersView.as_view({"get": "list", "post": "create"}),
        name="scenario-exposure-layers",
    ),
    path(
        "scenarios/<uuid:scenario_id>/exposure-layers/<uuid:exposure_layer_id>/",
        views.ScenarioExposureLayersView.as_view({"delete": "destroy", "patch": "partial_update"}),
        name="scenario-exposure-layer-detail",
    ),
    path(
        "scenarios/<uuid:scenario_id>/exposure-layers/<uuid:exposure_layer_id>/publish/",
        views.ScenarioExposureLayersView.as_view({"post": "publish"}),
        name="scenario-exposure-layer-publish",
    ),
    path(
        "scenarios/<uuid:scenario_id>/exposure-layers/<uuid:exposure_layer_id>/approve/",
        views.ScenarioExposureLayersView.as_view({"post": "approve"}),
        name="scenario-exposure-layer-approve",
    ),
    path(
        "scenarios/<uuid:scenario_id>/exposure-layers/<uuid:exposure_layer_id>/reject/",
        views.ScenarioExposureLayersView.as_view({"post": "reject"}),
        name="scenario-exposure-layer-reject",
    ),
    path(
        "scenarios/<uuid:scenario_id>/exposure-layers/<uuid:exposure_layer_id>/remove/",
        views.ScenarioExposureLayersView.as_view({"post": "remove"}),
        name="scenario-exposure-layer-remove",
    ),
    path(
        "scenarios/<uuid:scenario_id>/assets/",
        views.ScenarioAssetsView.as_view(),
        name="scenario-assets",
    ),
    path(
        "scenarios/<uuid:scenario_id>/dataroom/assets/",
        views.DataroomAssetsView.as_view(),
        name="dataroom-assets",
    ),
    path(
        "scenarios/<uuid:scenario_id>/dataroom/assets/criticality/",
        views.DataroomBulkCriticalityView.as_view(),
        name="dataroom-bulk-criticality",
    ),
    path(
        "scenarios/<uuid:scenario_id>/dataroom/exposure-layers/",
        views.DataroomExposureLayersView.as_view(),
        name="dataroom-exposure-layers",
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
    path(
        "scenarios/<uuid:scenario_id>/constraint-interventions/",
        views.ScenarioConstraintInterventionsView.as_view(),
        name="scenario-constraint-interventions",
    ),
    path(
        "scenarios/<uuid:scenario_id>/constraint-interventions/<uuid:intervention_id>/",
        views.ScenarioConstraintInterventionsView.as_view(),
        name="scenario-constraint-intervention-detail",
    ),
    path(
        "scenarios/<uuid:scenario_id>/route/",
        views.ScenarioRouteView.as_view(),
        name="scenario-route",
    ),
    path(
        "scenarios/<uuid:scenario_id>/visible-resource-intervention-types/",
        views.VisibleResourceInterventionTypeView.as_view(),
        name="visible-resource-intervention-types",
    ),
    path(
        "scenarios/<uuid:scenario_id>/resource-interventions/",
        views.ScenarioResourceInterventionsView.as_view(),
        name="scenario-resource-interventions",
    ),
    path(
        "scenarios/<uuid:scenario_id>/resource-interventions/locations/<uuid:location_id>/",
        views.ScenarioResourceInterventionLocationView.as_view(),
        name="scenario-resource-intervention-location-detail",
    ),
    path(
        "scenarios/<uuid:scenario_id>/resource-interventions/locations/<uuid:location_id>/<str:action_type>/",
        views.ScenarioResourceInterventionLocationView.as_view(),
        name="resource-intervention-location-action",
    ),
    path(
        "scenarios/<uuid:scenario_id>/resource-interventions/actions/",
        views.ScenarioResourceInterventionActionsView.as_view(),
        name="scenario-resource-intervention-actions",
    ),
    path(
        "scenarios/<uuid:scenario_id>/resource-interventions/actions/export/",
        views.ScenarioResourceInterventionActionsExportView.as_view(),
        name="scenario-resource-intervention-actions-export",
    ),
    path("", include(router.urls)),
]
