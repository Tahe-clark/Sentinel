from django.urls import path

from .views import (
    ice_servers_view,
)


urlpatterns = [
    path(
        "ice-servers/",
        ice_servers_view,
        name="ice-servers",
    ),
]