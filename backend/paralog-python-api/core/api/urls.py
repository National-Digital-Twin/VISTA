"""Paralog Backend URLs with GraphQL View constructor."""

from django.urls import path

from api import rest_views, views
from api.schema import schema

urlpatterns = [
    path("graphql/", views.NoMultipartGraphQLView.as_view(schema=schema), name="graphql"),
    path("user/", rest_views.user_details_view, name="api-user"),
    path("auth/signout/", rest_views.signout_view, name="signout"),
]
