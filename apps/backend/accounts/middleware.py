from urllib.parse import parse_qs

from channels.db import (
    database_sync_to_async,
)

from django.contrib.auth import (
    HASH_SESSION_KEY,
    SESSION_KEY,
)
from django.contrib.auth.models import (
    AnonymousUser,
    User,
)
from django.contrib.sessions.models import (
    Session,
)
from django.utils import timezone
from django.utils.crypto import (
    constant_time_compare,
)


@database_sync_to_async
def get_user_from_session_token(
    session_key: str,
):
    if not session_key:
        return AnonymousUser()


    try:
        session = (
            Session.objects
            .get(
                session_key=session_key,
                expire_date__gt=
                    timezone.now(),
            )
        )

    except Session.DoesNotExist:
        return AnonymousUser()


    session_data = (
        session.get_decoded()
    )


    user_id = session_data.get(
        SESSION_KEY
    )


    if not user_id:
        return AnonymousUser()


    try:
        user = User.objects.get(
            pk=user_id
        )

    except User.DoesNotExist:
        return AnonymousUser()


    if not user.is_active:
        return AnonymousUser()


    stored_hash = (
        session_data.get(
            HASH_SESSION_KEY,
            "",
        )
    )


    expected_hash = (
        user.get_session_auth_hash()
    )


    if (
        not stored_hash
        or not constant_time_compare(
            stored_hash,
            expected_hash,
        )
    ):
        session.delete()

        return AnonymousUser()


    return user


class SessionTokenWebSocketMiddleware:
    def __init__(
        self,
        app,
    ):
        self.app = app


    async def __call__(
        self,
        scope,
        receive,
        send,
    ):
        query_string = (
            scope
            .get(
                "query_string",
                b"",
            )
            .decode()
        )


        params = parse_qs(
            query_string
        )


        token = (
            params
            .get(
                "token",
                [""],
            )[0]
        )


        scope["user"] = (
            await get_user_from_session_token(
                token
            )
        )


        return await self.app(
            scope,
            receive,
            send,
        )