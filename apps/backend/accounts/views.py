import json

from django.contrib.auth import (
    authenticate,
    login,
    logout,
)
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import (
    validate_password,
)
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils.encoding import (
    force_bytes,
    force_str,
)
from django.utils.http import (
    urlsafe_base64_decode,
    urlsafe_base64_encode,
)
from django.contrib.auth.tokens import (
    default_token_generator,
)
from django.views.decorators.csrf import (
    csrf_exempt,
)
from django.views.decorators.http import (
    require_GET,
    require_POST,
)

from .authentication import (
    SessionTokenAuthentication,
)


LOGIN_LIMIT = 8
LOGIN_WINDOW_SECONDS = 15 * 60


def read_json(request):
    try:
        return json.loads(
            request.body
        )

    except json.JSONDecodeError:
        return None


def get_client_ip(request):
    forwarded_for = request.META.get(
        "HTTP_X_FORWARDED_FOR"
    )

    if forwarded_for:
        return (
            forwarded_for
            .split(",")[0]
            .strip()
        )

    return request.META.get(
        "REMOTE_ADDR",
        "unknown",
    )


def rate_limit_login(request):
    ip = get_client_ip(
        request
    )

    key = (
        f"sentinel-login:"
        f"{ip}"
    )

    attempts = cache.get(
        key,
        0,
    )

    if attempts >= LOGIN_LIMIT:
        return False

    cache.set(
        key,
        attempts + 1,
        LOGIN_WINDOW_SECONDS,
    )

    return True


def reset_login_rate_limit(
    request
):
    ip = get_client_ip(
        request
    )

    cache.delete(
        f"sentinel-login:{ip}"
    )


def serialize_user(user):
    return {
        "id":
            user.id,

        "username":
            user.username,

        "email":
            user.email,
    }


def authenticate_from_token(
    request
):
    authenticator = (
        SessionTokenAuthentication()
    )

    result = authenticator.authenticate(
        request
    )

    if result is None:
        return None

    user, session_key = result

    return (
        user,
        session_key,
    )


@require_GET
def csrf_view(request):
    return JsonResponse({
        "csrfToken":
            get_token(
                request
            ),
    })


@csrf_exempt
@require_POST
def register_view(request):
    data = read_json(
        request
    )

    if data is None:
        return JsonResponse(
            {
                "error":
                    "Invalid request."
            },
            status=400,
        )


    username = str(
        data.get(
            "username",
            ""
        )
    ).strip()


    email = str(
        data.get(
            "email",
            ""
        )
    ).strip().lower()


    password = str(
        data.get(
            "password",
            ""
        )
    )


    if (
        not username
        or not email
        or not password
    ):
        return JsonResponse(
            {
                "error":
                    "Unable to create account."
            },
            status=400,
        )


    if User.objects.filter(
        username__iexact=username
    ).exists():
        return JsonResponse(
            {
                "error":
                    "Unable to create account."
            },
            status=400,
        )


    if User.objects.filter(
        email__iexact=email
    ).exists():
        return JsonResponse(
            {
                "error":
                    "Unable to create account."
            },
            status=400,
        )


    try:
        validate_password(
            password
        )

    except ValidationError:
        return JsonResponse(
            {
                "error":
                    "Password does not meet security requirements."
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


    if (
        not request.session.session_key
    ):
        request.session.save()


    return JsonResponse(
        {
            "message":
                "Account created successfully.",

            "token":
                request.session.session_key,

            "user":
                serialize_user(
                    user
                ),
        },
        status=201,
    )


@csrf_exempt
@require_POST
def login_view(request):
    if not rate_limit_login(
        request
    ):
        return JsonResponse(
            {
                "error":
                    "Unable to sign in."
            },
            status=429,
        )


    data = read_json(
        request
    )

    if data is None:
        return JsonResponse(
            {
                "error":
                    "Unable to sign in."
            },
            status=400,
        )


    identifier = str(
        data.get(
            "identifier",
            data.get(
                "username",
                ""
            )
        )
    ).strip()


    password = str(
        data.get(
            "password",
            ""
        )
    )


    if (
        not identifier
        or not password
    ):
        return JsonResponse(
            {
                "error":
                    "Unable to sign in."
            },
            status=401,
        )


    username = identifier


    if "@" in identifier:
        matched_user = (
            User.objects
            .filter(
                email__iexact=
                    identifier
            )
            .first()
        )

        if matched_user:
            username = (
                matched_user.username
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
                    "Unable to sign in."
            },
            status=401,
        )


    login(
        request,
        user,
    )


    if (
        not request.session.session_key
    ):
        request.session.save()


    reset_login_rate_limit(
        request
    )


    return JsonResponse({
        "message":
            "Logged in successfully.",

        "token":
            request.session.session_key,

        "user":
            serialize_user(
                user
            ),
    })


@csrf_exempt
@require_POST
def logout_view(request):
    auth = authenticate_from_token(
        request
    )


    if auth is None:
        return JsonResponse(
            {
                "error":
                    "Authentication required."
            },
            status=401,
        )


    user, session_key = auth


    from django.contrib.sessions.models import (
        Session,
    )


    Session.objects.filter(
        session_key=session_key
    ).delete()


    return JsonResponse({
        "message":
            "Logged out successfully."
    })


@require_GET
def me_view(request):
    auth = authenticate_from_token(
        request
    )


    if auth is None:
        return JsonResponse(
            {
                "authenticated":
                    False,
            },
            status=401,
        )


    user, _ = auth


    return JsonResponse({
        "authenticated":
            True,

        "user":
            serialize_user(
                user
            ),
    })


@csrf_exempt
@require_POST
def forgot_password_view(
    request
):
    data = read_json(
        request
    )

    if data is None:
        return JsonResponse({
            "message":
                "If an account matches this email, a reset link has been sent."
        })


    email = str(
        data.get(
            "email",
            ""
        )
    ).strip().lower()


    user = (
        User.objects
        .filter(
            email__iexact=email
        )
        .first()
    )


    if user:
        uid = (
            urlsafe_base64_encode(
                force_bytes(
                    user.pk
                )
            )
        )

        token = (
            default_token_generator
            .make_token(
                user
            )
        )


        frontend_url = (
            request
            .META
            .get(
                "HTTP_ORIGIN",
                ""
            )
            .rstrip("/")
        )


        if not frontend_url:
            from django.conf import (
                settings,
            )

            frontend_url = (
                settings.FRONTEND_URL
            )


        reset_url = (
            f"{frontend_url}"
            f"/reset-password/"
            f"{uid}/"
            f"{token}"
        )


        send_mail(
            subject=
                "Sentinel password reset",

            message=(
                "Use this link to reset "
                "your Sentinel password:\n\n"
                f"{reset_url}"
            ),

            from_email=None,

            recipient_list=[
                user.email
            ],

            fail_silently=True,
        )


    return JsonResponse({
        "message":
            "If an account matches this email, a reset link has been sent."
    })


@csrf_exempt
@require_POST
def reset_password_view(
    request,
    uid,
    token,
):
    try:
        user_id = (
            force_str(
                urlsafe_base64_decode(
                    uid
                )
            )
        )

        user = User.objects.get(
            pk=user_id
        )

    except (
        ValueError,
        TypeError,
        OverflowError,
        User.DoesNotExist,
    ):
        return JsonResponse(
            {
                "error":
                    "Invalid or expired reset link."
            },
            status=400,
        )


    if not (
        default_token_generator
        .check_token(
            user,
            token,
        )
    ):
        return JsonResponse(
            {
                "error":
                    "Invalid or expired reset link."
            },
            status=400,
        )


    data = read_json(
        request
    )


    if data is None:
        return JsonResponse(
            {
                "error":
                    "Invalid request."
            },
            status=400,
        )


    password = str(
        data.get(
            "password",
            ""
        )
    )


    try:
        validate_password(
            password,
            user=user,
        )

    except ValidationError:
        return JsonResponse(
            {
                "error":
                    "Password does not meet security requirements."
            },
            status=400,
        )


    user.set_password(
        password
    )

    user.save(
        update_fields=[
            "password",
        ]
    )


    return JsonResponse({
        "message":
            "Password updated successfully."
    })