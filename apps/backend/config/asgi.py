import os

from channels.routing import (
    ProtocolTypeRouter,
    URLRouter,
)
from channels.security.websocket import (
    OriginValidator,
)

from django.core.asgi import (
    get_asgi_application,
)


os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings",
)


django_asgi_app = (
    get_asgi_application()
)


from accounts.middleware import (
    SessionTokenWebSocketMiddleware,
)

from signaling.routing import (
    websocket_urlpatterns,
)


WEBSOCKET_ALLOWED_ORIGINS = [
    "https://sentinel-web-snowy.vercel.app",

    "http://localhost:5173",
    "http://127.0.0.1:5173",

    "http://192.168.1.39:5173",
    "http://192.168.137.1:5173",
    "http://10.0.0.245:5173",
]


application = ProtocolTypeRouter({
    "http":
        django_asgi_app,

    "websocket":
        OriginValidator(
            SessionTokenWebSocketMiddleware(
                URLRouter(
                    websocket_urlpatterns
                )
            ),
            WEBSOCKET_ALLOWED_ORIGINS,
        ),
})