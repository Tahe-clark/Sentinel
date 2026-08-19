import json
import logging
import os
import urllib.error
import urllib.request

from django.http import JsonResponse

from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import (
    IsAuthenticated,
)

from accounts.authentication import (
    SessionTokenAuthentication,
)


logger = logging.getLogger(__name__)


# =========================================================
# CLOUDFLARE CONFIGURATION
# =========================================================

CLOUDFLARE_TURN_ENDPOINT = (
    "https://rtc.live.cloudflare.com"
    "/v1/turn/keys/{key_id}"
    "/credentials/generate-ice-servers"
)


CLOUDFLARE_USER_AGENT = (
    "Sentinel/1.0 "
    "(WebRTC TURN Credential Service)"
)


# =========================================================
# ICE SERVERS VIEW
# =========================================================

@api_view(["GET"])
@authentication_classes([
    SessionTokenAuthentication,
])
@permission_classes([
    IsAuthenticated,
])
def ice_servers_view(request):
    """
    Generate temporary Cloudflare TURN credentials.

    The permanent Cloudflare TURN API token remains
    exclusively on the Sentinel backend.
    """

    # =====================================================
    # 1. ENVIRONMENT VARIABLES
    # =====================================================

    key_id = os.getenv(
        "CLOUDFLARE_TURN_KEY_ID",
        "",
    ).strip()

    api_token = os.getenv(
        "CLOUDFLARE_TURN_API_TOKEN",
        "",
    ).strip()


    try:
        ttl = int(
            os.getenv(
                "CLOUDFLARE_TURN_TTL",
                "86400",
            )
        )

    except ValueError:
        ttl = 86400


    # Limit credentials to maximum 48 hours.
    ttl = max(
        60,
        min(
            ttl,
            172800,
        ),
    )


    # =====================================================
    # 2. CONFIGURATION VALIDATION
    # =====================================================

    if not key_id:

        logger.error(
            "CLOUDFLARE TURN CONFIG ERROR | "
            "CLOUDFLARE_TURN_KEY_ID missing"
        )

        return JsonResponse(
            {
                "error":
                    "TURN service is not configured."
            },
            status=503,
        )


    if not api_token:

        logger.error(
            "CLOUDFLARE TURN CONFIG ERROR | "
            "CLOUDFLARE_TURN_API_TOKEN missing"
        )

        return JsonResponse(
            {
                "error":
                    "TURN service is not configured."
            },
            status=503,
        )


    # =====================================================
    # 3. CLOUDFLARE URL
    # =====================================================

    cloudflare_url = (
        CLOUDFLARE_TURN_ENDPOINT.format(
            key_id=key_id,
        )
    )


    # =====================================================
    # 4. REQUEST PAYLOAD
    # =====================================================

    payload = json.dumps(
        {
            "ttl": ttl,
        }
    ).encode(
        "utf-8"
    )


    # =====================================================
    # 5. CLOUDFLARE HTTP REQUEST
    # =====================================================

    cloudflare_request = urllib.request.Request(
        cloudflare_url,

        data=payload,

        method="POST",

        headers={
            "Authorization":
                f"Bearer {api_token}",

            "Content-Type":
                "application/json",

            "Accept":
                "application/json",

            "User-Agent":
                CLOUDFLARE_USER_AGENT,
        },
    )


    # =====================================================
    # 6. SEND REQUEST
    # =====================================================

    try:

        with urllib.request.urlopen(
            cloudflare_request,
            timeout=15,
        ) as response:

            status_code = (
                response.status
            )

            response_body = (
                response
                .read()
                .decode(
                    "utf-8"
                )
            )


        logger.info(
            "CLOUDFLARE TURN RESPONSE | "
            "status=%s",
            status_code,
        )


        cloudflare_data = (
            json.loads(
                response_body
            )
        )


    # =====================================================
    # 7. HTTP ERROR
    # =====================================================

    except urllib.error.HTTPError as error:

        try:

            error_body = (
                error
                .read()
                .decode(
                    "utf-8",
                    errors="replace",
                )
            )

        except Exception:

            error_body = (
                "Unable to read "
                "Cloudflare error body."
            )


        logger.error(
            "CLOUDFLARE TURN HTTP ERROR | "
            "status=%s | "
            "reason=%s | "
            "response=%s",
            error.code,
            error.reason,
            error_body[:1500],
        )


        return JsonResponse(
            {
                "error":
                    "Unable to obtain TURN credentials."
            },
            status=502,
        )


    # =====================================================
    # 8. NETWORK ERROR
    # =====================================================

    except urllib.error.URLError as error:

        logger.error(
            "CLOUDFLARE TURN URL ERROR | "
            "reason=%s",
            error.reason,
        )


        return JsonResponse(
            {
                "error":
                    "Unable to obtain TURN credentials."
            },
            status=502,
        )


    # =====================================================
    # 9. TIMEOUT
    # =====================================================

    except TimeoutError as error:

        logger.error(
            "CLOUDFLARE TURN TIMEOUT | %s",
            error,
        )


        return JsonResponse(
            {
                "error":
                    "Unable to obtain TURN credentials."
            },
            status=502,
        )


    # =====================================================
    # 10. INVALID JSON
    # =====================================================

    except json.JSONDecodeError as error:

        logger.error(
            "CLOUDFLARE TURN JSON ERROR | %s",
            error,
        )


        return JsonResponse(
            {
                "error":
                    "TURN provider returned "
                    "an invalid response."
            },
            status=502,
        )


    # =====================================================
    # 11. UNEXPECTED ERROR
    # =====================================================

    except Exception as error:

        logger.exception(
            "CLOUDFLARE TURN UNEXPECTED ERROR | %s",
            error,
        )


        return JsonResponse(
            {
                "error":
                    "Unable to obtain TURN credentials."
            },
            status=502,
        )


    # =====================================================
    # 12. GET ICE SERVERS
    # =====================================================

    ice_servers = (
        cloudflare_data.get(
            "iceServers"
        )
    )


    if (
        not isinstance(
            ice_servers,
            list,
        )
        or not ice_servers
    ):

        logger.error(
            "CLOUDFLARE TURN INVALID RESPONSE | "
            "iceServers missing or empty"
        )


        return JsonResponse(
            {
                "error":
                    "TURN provider returned "
                    "an invalid response."
            },
            status=502,
        )


    # =====================================================
    # 13. CLEAN ICE SERVER URLS
    # =====================================================

    cleaned_servers = []


    for server in ice_servers:

        if not isinstance(
            server,
            dict,
        ):
            continue


        urls = server.get(
            "urls",
            []
        )


        if isinstance(
            urls,
            str,
        ):
            urls = [
                urls
            ]


        if not isinstance(
            urls,
            list,
        ):
            continue


        filtered_urls = [
            url
            for url in urls
            if (
                isinstance(
                    url,
                    str,
                )
                and ":53" not in url
            )
        ]


        if not filtered_urls:
            continue


        cleaned_server = {
            **server,

            "urls":
                filtered_urls,
        }


        cleaned_servers.append(
            cleaned_server
        )


    # =====================================================
    # 14. VALIDATE CLEANED SERVERS
    # =====================================================

    if not cleaned_servers:

        logger.error(
            "CLOUDFLARE TURN INVALID RESPONSE | "
            "No usable ICE servers"
        )


        return JsonResponse(
            {
                "error":
                    "TURN provider returned "
                    "no usable ICE servers."
            },
            status=502,
        )


    # =====================================================
    # 15. SUCCESS
    # =====================================================

    logger.info(
        "CLOUDFLARE TURN SUCCESS | "
        "user_id=%s | "
        "servers=%s | "
        "ttl=%s",
        request.user.id,
        len(
            cleaned_servers
        ),
        ttl,
    )


    return JsonResponse(
        {
            "iceServers":
                cleaned_servers,

            "expiresIn":
                ttl,

            "provider":
                "cloudflare",
        },

        status=200,
    )