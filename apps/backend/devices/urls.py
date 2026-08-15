from django.urls import path

from .views import (
    ClaimPairingRequestView,
    CreatePairingRequestView,
    DeviceListView,
)


urlpatterns = [
    path(
        "",
        DeviceListView.as_view(),
        name="device-list",
    ),

    path(
        "pairing/request/",
        CreatePairingRequestView.as_view(),
        name="pairing-request",
    ),

    path(
        "pairing/claim/",
        ClaimPairingRequestView.as_view(),
        name="pairing-claim",
    ),
]