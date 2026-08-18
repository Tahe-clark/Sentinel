from django.urls import path

from .views import (
    csrf_view,
    forgot_password_view,
    login_view,
    logout_view,
    me_view,
    register_view,
    reset_password_view,
)


urlpatterns = [
    path(
        "csrf/",
        csrf_view,
        name="csrf",
    ),

    path(
        "register/",
        register_view,
        name="register",
    ),

    path(
        "login/",
        login_view,
        name="login",
    ),

    path(
        "logout/",
        logout_view,
        name="logout",
    ),

    path(
        "me/",
        me_view,
        name="me",
    ),

    path(
        "forgot-password/",
        forgot_password_view,
        name="forgot-password",
    ),

    path(
        "reset-password/<str:uid>/<str:token>/",
        reset_password_view,
        name="reset-password",
    ),
]