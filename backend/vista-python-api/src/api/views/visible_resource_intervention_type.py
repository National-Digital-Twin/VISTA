# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Views for resource intervention type visibility toggling."""

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import ResourceInterventionType, Scenario, VisibleResourceInterventionType
from api.serializers import VisibleResourceInterventionTypeToggleSerializer
from api.utils.auth import get_user_id_from_request


class VisibleResourceInterventionTypeView(APIView):
    """View for toggling resource intervention type visibility."""

    def put(self, request, scenario_id=None):
        """Enable or disable visibility for a resource intervention type.

        When is_active is true, creates a VisibleResourceInterventionType record.
        When is_active is false, deletes the VisibleResourceInterventionType record.
        """
        scenario = get_object_or_404(Scenario, id=scenario_id, is_active=True)
        user_id = get_user_id_from_request(request)

        serializer = VisibleResourceInterventionTypeToggleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        resource_intervention_type_id = serializer.validated_data["resource_intervention_type_id"]
        is_active = serializer.validated_data["is_active"]

        resource_intervention_type = get_object_or_404(
            ResourceInterventionType, id=resource_intervention_type_id
        )

        if is_active:
            VisibleResourceInterventionType.objects.get_or_create(
                user_id=user_id,
                scenario=scenario,
                resource_intervention_type=resource_intervention_type,
            )
        else:
            VisibleResourceInterventionType.objects.filter(
                user_id=user_id,
                scenario=scenario,
                resource_intervention_type=resource_intervention_type,
            ).delete()

        return Response(
            {
                "resource_intervention_type_id": resource_intervention_type_id,
                "is_active": is_active,
            },
            status=status.HTTP_200_OK,
        )
