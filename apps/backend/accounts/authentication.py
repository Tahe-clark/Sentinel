from django.contrib.auth import (
    HASH_SESSION_KEY,
    SESSION_KEY,
)
from django.contrib.auth.models import User
from django.contrib.sessions.models import Session
from django.utils import timezone
from django.utils.crypto import constant_time_compare

from rest_framework.authentication import (
    BaseAuthentication,
)
from rest_framework.exceptions import (
    AuthenticationFailed,
)


class SessionTokenAuthentication(
    BaseAuthentication
):
    keyword = "Session"


    def authenticate(
        self,
        request,
    ):
        auth_header = (
            request.headers
            .get(
                "Authorization",
                "",
            )
            .strip()
        )


        if not auth_header:
            return None


        parts = auth_header.split(
            " ",
            1,
        )


        if (
            len(parts) != 2
            or parts[0] != self.keyword
        ):
            return None


        session_key = (
            parts[1]
            .strip()
        )


        if not session_key:
            return None


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
            raise AuthenticationFailed(
                "Invalid or expired session."
            )


        session_data = (
            session.get_decoded()
        )


        user_id = session_data.get(
            SESSION_KEY
        )


        if not user_id:
            raise AuthenticationFailed(
                "Invalid session."
            )


        try:
            user = User.objects.get(
                pk=user_id
            )

        except User.DoesNotExist:
            raise AuthenticationFailed(
                "Invalid session."
            )


        if not user.is_active:
            raise AuthenticationFailed(
                "Invalid session."
            )


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

            raise AuthenticationFailed(
                "Invalid or expired session."
            )


        return (
            user,
            session_key,
        )