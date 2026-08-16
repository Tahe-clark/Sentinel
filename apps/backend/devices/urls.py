from django.urls import path

from .views import (
    ClaimPairingRequestView,
    CreatePairingRequestView,
    DeleteDeviceView,
    DeviceListView,
    UnpairDeviceView,
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

    path(
        "<str:device_key>/unpair/",
        UnpairDeviceView.as_view(),
        name="device-unpair",
    ),

    path(
        "<str:device_key>/",
        DeleteDeviceView.as_view(),
        name="device-delete",
    ),
]