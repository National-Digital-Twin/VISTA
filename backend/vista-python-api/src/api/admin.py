# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the UK's Department for Business, Innovation, Science and Trade (BIST) as the governing entity.

"""Register your models here."""

from django.contrib import admin

from api.models.asset import Asset

# Register your models here.
admin.site.register(Asset)
