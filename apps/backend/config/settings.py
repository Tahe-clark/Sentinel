import os
from pathlib import Path

import dj_database_url


# =========================================================
# BASE
# =========================================================

BASE_DIR = Path(__file__).resolve().parent.parent


# =========================================================
# ENVIRONMENT
# =========================================================

IS_RENDER = "RENDER" in os.environ


def env_bool(
    name: str,
    default: bool = False,
) -> bool:
    value = os.getenv(
        name,
        str(default),
    )

    return value.lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


def env_list(
    name: str,
) -> list[str]:
    value = os.getenv(
        name,
        "",
    )

    return [
        item.strip()
        for item in value.split(",")
        if item.strip()
    ]


DEBUG = env_bool(
    "DEBUG",
    default=not IS_RENDER,
)


# =========================================================
# SECURITY
# =========================================================

SECRET_KEY = os.getenv(
    "SECRET_KEY"
)


if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = (
            "django-insecure-"
            "sentinel-local-development-only"
        )

    else:
        raise RuntimeError(
            "SECRET_KEY environment variable "
            "is required in production."
        )


# =========================================================
# ALLOWED HOSTS
# =========================================================

if DEBUG:
    ALLOWED_HOSTS = [
        "localhost",
        "127.0.0.1",
        "0.0.0.0",

        # Tes IP locales actuelles
        "192.168.1.39",
        "192.168.137.1",
        "10.0.0.245",
    ]

else:
    ALLOWED_HOSTS = []


render_hostname = os.getenv(
    "RENDER_EXTERNAL_HOSTNAME"
)


if render_hostname:
    ALLOWED_HOSTS.append(
        render_hostname
    )


ALLOWED_HOSTS.extend(
    env_list(
        "ALLOWED_HOSTS"
    )
)


# Enlève les doublons
ALLOWED_HOSTS = list(
    dict.fromkeys(
        ALLOWED_HOSTS
    )
)

# =========================================================
# APPLICATIONS
# =========================================================

INSTALLED_APPS = [
    "daphne",

    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "rest_framework",
    "corsheaders",
    "channels",

    "devices",
    "signaling",
    "accounts",
]


# =========================================================
# MIDDLEWARE
# =========================================================

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",

    "corsheaders.middleware.CorsMiddleware",

    "whitenoise.middleware.WhiteNoiseMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",

    "django.middleware.common.CommonMiddleware",

    "django.middleware.csrf.CsrfViewMiddleware",

    "django.contrib.auth.middleware.AuthenticationMiddleware",

    "django.contrib.messages.middleware.MessageMiddleware",

    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# =========================================================
# URL / ASGI / WSGI
# =========================================================

ROOT_URLCONF = "config.urls"


WSGI_APPLICATION = (
    "config.wsgi.application"
)


ASGI_APPLICATION = (
    "config.asgi.application"
)


# =========================================================
# TEMPLATES
# =========================================================

TEMPLATES = [
    {
        "BACKEND":
            "django.template.backends.django.DjangoTemplates",

        "DIRS": [],

        "APP_DIRS": True,

        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",

                "django.contrib.auth.context_processors.auth",

                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# =========================================================
# DATABASE
# =========================================================

DATABASE_URL = os.getenv(
    "DATABASE_URL"
)


if DATABASE_URL:
    DATABASES = {
        "default":
            dj_database_url.config(
                default=
                    DATABASE_URL,

                conn_max_age=
                    600,

                conn_health_checks=
                    True,

                ssl_require=
                    not DEBUG,
            )
    }

else:
    DATABASES = {
        "default": {
            "ENGINE":
                "django.db.backends.sqlite3",

            "NAME":
                BASE_DIR /
                "db.sqlite3",
        }
    }

# =========================================================
# PASSWORD VALIDATION
# =========================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME":
            "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },

    {
        "NAME":
            "django.contrib.auth.password_validation.MinimumLengthValidator",
    },

    {
        "NAME":
            "django.contrib.auth.password_validation.CommonPasswordValidator",
    },

    {
        "NAME":
            "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# =========================================================
# INTERNATIONALIZATION
# =========================================================

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True

# =========================================================
# STATIC FILES
# =========================================================

STATIC_URL = "/static/"

STATIC_ROOT = (
    BASE_DIR /
    "staticfiles"
)


STORAGES = {
    "default": {
        "BACKEND":
            "django.core.files.storage.FileSystemStorage",
    },

    "staticfiles": {
        "BACKEND":
            "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# =========================================================
# FRONTEND ORIGINS
# =========================================================

LOCAL_FRONTEND_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",

    "http://192.168.1.39:5173",
    "http://192.168.137.1:5173",
    "http://10.0.0.245:5173",
]


CORS_ALLOWED_ORIGINS = []

CSRF_TRUSTED_ORIGINS = []


if DEBUG:
    CORS_ALLOWED_ORIGINS.extend(
        LOCAL_FRONTEND_ORIGINS
    )

    CSRF_TRUSTED_ORIGINS.extend(
        LOCAL_FRONTEND_ORIGINS
    )


FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "",
).strip()


if FRONTEND_URL:
    FRONTEND_URL = (
        FRONTEND_URL.rstrip(
            "/"
        )
    )

    CORS_ALLOWED_ORIGINS.append(
        FRONTEND_URL
    )

    CSRF_TRUSTED_ORIGINS.append(
        FRONTEND_URL
    )


CORS_ALLOWED_ORIGINS.extend(
    env_list(
        "CORS_ALLOWED_ORIGINS"
    )
)


CSRF_TRUSTED_ORIGINS.extend(
    env_list(
        "CSRF_TRUSTED_ORIGINS"
    )
)


CORS_ALLOWED_ORIGINS = list(
    dict.fromkeys(
        CORS_ALLOWED_ORIGINS
    )
)


CSRF_TRUSTED_ORIGINS = list(
    dict.fromkeys(
        CSRF_TRUSTED_ORIGINS
    )
)


CORS_ALLOW_CREDENTIALS = True


CORS_ALLOW_ALL_ORIGINS = False

# =========================================================
# COOKIES / CROSS-SITE AUTHENTICATION
# =========================================================

if DEBUG:
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False

    SESSION_COOKIE_SAMESITE = "Lax"
    CSRF_COOKIE_SAMESITE = "Lax"

else:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

    # Vercel et Render auront des domaines différents.
    SESSION_COOKIE_SAMESITE = "None"
    CSRF_COOKIE_SAMESITE = "None"


SESSION_COOKIE_HTTPONLY = True

# =========================================================
# HTTPS / REVERSE PROXY
# =========================================================

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = (
        "HTTP_X_FORWARDED_PROTO",
        "https",
    )

    SECURE_SSL_REDIRECT = True

# =========================================================
# DJANGO CHANNELS
# =========================================================

REDIS_URL = os.getenv(
    "REDIS_URL"
)


if REDIS_URL:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND":
                "channels_redis.core.RedisChannelLayer",

            "CONFIG": {
                "hosts": [
                    REDIS_URL
                ],
            },
        },
    }

else:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND":
                "channels.layers.InMemoryChannelLayer",
        },
    }

# =========================================================
# EMAIL
# =========================================================

EMAIL_BACKEND = (
    "django.core.mail.backends.console.EmailBackend"
)


# =========================================================
# DEFAULT MODEL ID
# =========================================================

DEFAULT_AUTO_FIELD = (
    "django.db.models.BigAutoField"
)