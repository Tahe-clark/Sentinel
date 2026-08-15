import json

from django.contrib.auth import (
    authenticate,
    login,
    logout,
)
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import (
    require_GET,
    require_POST,
)


@require_GET
@ensure_csrf_cookie
def csrf_view(request):
    return JsonResponse({
        "csrfToken": get_token(request),
    })


@require_POST
def register_view(request):
    try:
        data = json.loads(
            request.body
        )
    except json.JSONDecodeError:
        return JsonResponse(
            {
                "error": "Invalid JSON."
            },
            status=400,
        )

    username = (
        data
        .get("username", "")
        .strip()
    )

    email = (
        data
        .get("email", "")
        .strip()
    )

    password = data.get(
        "password",
        "",
    )


    if not username:
        return JsonResponse(
            {
                "error":
                "Username is required."
            },
            status=400,
        )


    if len(password) < 8:
        return JsonResponse(
            {
                "error":
                "Password must contain at least 8 characters."
            },
            status=400,
        )


    if User.objects.filter(
        username=username
    ).exists():
        return JsonResponse(
            {
                "error":
                "Username already exists."
            },
            status=400,
        )


    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
    )


    login(
        request,
        user,
    )


    return JsonResponse(
        {
            "message":
                "Account created successfully.",

            "user": {
                "id": user.id,
                "username":
                    user.username,
                "email":
                    user.email,
            },
        },
        status=201,
    )


@require_POST
def login_view(request):
    try:
        data = json.loads(
            request.body
        )
    except json.JSONDecodeError:
        return JsonResponse(
            {
                "error":
                    "Invalid JSON."
            },
            status=400,
        )


    username = data.get(
        "username",
        "",
    )

    password = data.get(
        "password",
        "",
    )


    user = authenticate(
        request,
        username=username,
        password=password,
    )


    if user is None:
        return JsonResponse(
            {
                "error":
                    "Invalid username or password."
            },
            status=401,
        )


    login(
        request,
        user,
    )


    return JsonResponse({
        "message":
            "Logged in successfully.",

        "user": {
            "id":
                user.id,

            "username":
                user.username,

            "email":
                user.email,
        },
    })


@require_POST
def logout_view(request):
    logout(request)

    return JsonResponse({
        "message":
            "Logged out successfully."
    })


@require_GET
def me_view(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {
                "authenticated":
                    False,
            },
            status=401,
        )


    return JsonResponse({
        "authenticated":
            True,

        "user": {
            "id":
                request.user.id,

            "username":
                request.user.username,

            "email":
                request.user.email,
        },
    })