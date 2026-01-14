"""Add created_at field to FocusArea model."""

from typing import ClassVar

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):
    """Add created_at field to FocusArea for ordering by creation time."""

    dependencies: ClassVar = [
        ("api", "0041_rename_category_id_assetsubcategory_category_and_more"),
    ]

    operations: ClassVar = [
        migrations.AddField(
            model_name="focusarea",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AlterModelOptions(
            name="focusarea",
            options={"ordering": ["-is_system", "created_at"]},
        ),
    ]
