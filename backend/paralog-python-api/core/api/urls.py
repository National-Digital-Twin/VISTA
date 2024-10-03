"""Paralog Backend URLs with GraphQL View constructor."""

from django.urls import path

from api import views
from api.schema import schema

urlpatterns = [
    path("graphql/", views.NoMultipartGraphQLView.as_view(schema=schema), name="graphql"),
]
