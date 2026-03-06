# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Register your models here."""

from django.contrib import admin

from api.models.asset import Asset

# Register your models here.
admin.site.register(Asset)
