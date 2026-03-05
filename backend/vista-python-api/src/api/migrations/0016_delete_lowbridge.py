# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Deletes the defunct low bridges dataset."""

from typing import ClassVar

from django.db import migrations


class Migration(migrations.Migration):
    """Deletes the defunct low bridges dataset."""

    dependencies: ClassVar = [
        ("api", "0015_delete_sandbagplacement_delete_vulnerableperson"),
    ]

    operations: ClassVar = [
        migrations.DeleteModel(
            name="LowBridge",
        ),
    ]
