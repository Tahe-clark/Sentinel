"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views.
"""

from django.contrib import admin
from django.http import HttpResponse
from django.urls import include, path


def google_verification(request):
    return HttpResponse(
        "google-site-verification: google0c8646533cabef8c.html"
    )


urlpatterns = [
    path(
        "google0c8646533cabef8c.html",
        google_verification,
    ),

    path(
        "admin/",
        admin.site.urls,
    ),

    path(
        "api/auth/",
        include("accounts.urls"),
    ),

    path(
        "api/devices/",
        include("devices.urls"),
    ),
    path(
    "api/rtc/",
    include("rtc.urls"),
),
]