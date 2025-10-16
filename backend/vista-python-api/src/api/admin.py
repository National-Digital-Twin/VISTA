"""Register your models here."""

from django.contrib import admin

from api.models.asset import Asset

# Register your models here.
admin.site.register(Asset)
