from django.urls import path
from . import views

urlpatterns = [
    # This maps to /api/exposurelayers/
    path('exposurelayers/', views.get_exposure_layers, name='get_exposure_layers'),
]