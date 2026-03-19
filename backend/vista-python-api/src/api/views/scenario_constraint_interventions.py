# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Views for scenario-scoped constraint intervention operations."""

import json

from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import Scenario
from api.models.constraint_intervention import ConstraintIntervention, ConstraintInterventionType
from api.serializers import (
    ConstraintInterventionCreateSerializer,
    ConstraintInterventionUpdateSerializer,
)
from api.utils.auth import get_user_id_from_request


class ScenarioConstraintInterventionsView(APIView):
    """View for listing and managing constraint interventions for a scenario."""

    def get(self, request, scenario_id):
        """List all constraint intervention types with nested interventions."""
        get_object_or_404(Scenario, id=scenario_id)
        user_id = get_user_id_from_request(request)

        interventions_qs = ConstraintIntervention.objects.filter(
            user_id=user_id, scenario_id=scenario_id
        ).order_by("created_at")

        intervention_types = ConstraintInterventionType.objects.prefetch_related(
            Prefetch("constraint_interventions", queryset=interventions_qs)
        )

        result = []
        for intervention_type in intervention_types:
            interventions_data = [
                {
                    "id": str(intervention.id),
                    "name": intervention.name,
                    "geometry": json.loads(intervention.geometry.json),
                    "isActive": intervention.is_active,
                    "createdAt": intervention.created_at.isoformat(),
                    "updatedAt": intervention.updated_at.isoformat(),
                }
                for intervention in intervention_type.constraint_interventions.all()
            ]

            result.append(
                {
                    "id": str(intervention_type.id),
                    "name": intervention_type.name,
                    "constraintInterventions": interventions_data,
                }
            )

        return Response(result)

    def post(self, request, scenario_id):
        """Create a new constraint intervention.

        Request body:
            type_id: UUID of the constraint intervention type (required)
            geometry: GeoJSON geometry (required)
            name: Optional name (auto-generated if not provided)
        """
        scenario = get_object_or_404(Scenario, id=scenario_id)
        user_id = get_user_id_from_request(request)

        serializer = ConstraintInterventionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        type_id = serializer.validated_data["type_id"]
        intervention_type = ConstraintInterventionType.objects.filter(id=type_id).first()
        if not intervention_type:
            return Response(
                {"error": "Constraint intervention type not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        geom = serializer.validated_data["geometry"]
        name = serializer.validated_data.get("name")
        if not name:
            existing_count = ConstraintIntervention.objects.filter(
                user_id=user_id, scenario_id=scenario_id, type=intervention_type
            ).count()
            name = f"{intervention_type.name.rstrip('s')} {existing_count + 1}"

        intervention = ConstraintIntervention.objects.create(
            name=name,
            geometry=geom,
            type=intervention_type,
            user_id=user_id,
            scenario=scenario,
        )

        return Response(
            {
                "id": str(intervention.id),
                "name": intervention.name,
                "geometry": json.loads(intervention.geometry.json),
                "isActive": intervention.is_active,
                "createdAt": intervention.created_at.isoformat(),
                "updatedAt": intervention.updated_at.isoformat(),
            },
            status=status.HTTP_201_CREATED,
        )

    def patch(self, request, scenario_id, intervention_id):
        """Update a constraint intervention.

        Request body:
            name: Optional new name
            geometry: Optional new GeoJSON geometry
            is_active: Optional boolean to toggle active state
        """
        scenario = get_object_or_404(Scenario, id=scenario_id)
        user_id = get_user_id_from_request(request)

        intervention = get_object_or_404(
            ConstraintIntervention,
            id=intervention_id,
            user_id=user_id,
            scenario=scenario,
        )

        serializer = ConstraintInterventionUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if "name" in serializer.validated_data:
            intervention.name = serializer.validated_data["name"]

        if "geometry" in serializer.validated_data:
            intervention.geometry = serializer.validated_data["geometry"]

        if "is_active" in serializer.validated_data:
            intervention.is_active = serializer.validated_data["is_active"]

        intervention.save()

        return Response(
            {
                "id": str(intervention.id),
                "name": intervention.name,
                "geometry": json.loads(intervention.geometry.json),
                "isActive": intervention.is_active,
                "createdAt": intervention.created_at.isoformat(),
                "updatedAt": intervention.updated_at.isoformat(),
            }
        )

    def delete(self, request, scenario_id, intervention_id):
        """Delete a constraint intervention."""
        scenario = get_object_or_404(Scenario, id=scenario_id)
        user_id = get_user_id_from_request(request)

        intervention = get_object_or_404(
            ConstraintIntervention,
            id=intervention_id,
            user_id=user_id,
            scenario=scenario,
        )

        intervention.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
