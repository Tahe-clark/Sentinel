import json
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


CLOUDFLARE_TURN_ENDPOINT = (
    "https://rtc.live.cloudflare.com"
    "/v1/turn/keys/{key_id}"
    "/credentials/generate-ice-servers"
)


@api_view([
    "GET",
])
@authentication_classes([
    SessionTokenAuthentication,
])
@permission_classes([
    IsAuthenticated,
])
def ice_servers_view(request):
    """
    Generate short-lived Cloudflare TURN credentials.

    The permanent Cloudflare TURN key stays only
    on the backend. The browser receives only the
    temporary ICE server configuration.
    """

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


    #
    # Cloudflare currently allows TURN credentials
    # for up to 48 hours.
    #
    ttl = max(
        60,
        min(
            ttl,
            172800,
        ),
    )


    if not key_id:
        print(
            "CLOUDFLARE TURN CONFIG ERROR: "
            "CLOUDFLARE_TURN_KEY_ID is missing."
        )

        return JsonResponse(
            {
                "error":
                    "TURN service is not configured."
            },
            status=503,
        )


    if not api_token:
        print(
            "CLOUDFLARE TURN CONFIG ERROR: "
            "CLOUDFLARE_TURN_API_TOKEN is missing."
        )

        return JsonResponse(
            {
                "error":
                    "TURN service is not configured."
            },
            status=503,
        )


    url = (
        CLOUDFLARE_TURN_ENDPOINT
        .format(
            key_id=key_id
        )
    )


    payload = json.dumps(
        {
            "ttl":
                ttl,

            "customIdentifier":
                f"sentinel-user-{request.user.id}",
        }
    ).encode(
        "utf-8"
    )


    cloudflare_request = (
        urllib.request.Request(
            url,
            data=payload,
            method="POST",
            headers={
                "Authorization":
                    f"Bearer {api_token}",

                "Content-Type":
                    "application/json",

                "Accept":
                    "application/json",
            },
        )
    )


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


        if status_code not in (
            200,
            201,
        ):
            print(
                "CLOUDFLARE TURN UNEXPECTED STATUS:",
                status_code,
            )

            return JsonResponse(
                {
                    "error":
                        "Unable to obtain TURN credentials."
                },
                status=502,
            )


        cloudflare_data = (
            json.loads(
                response_body
            )
        )


    except urllib.error.HTTPError as error:
        try:
            error_body = (
                error.read()
                .decode(
                    "utf-8",
                    errors="replace",
                )
            )

        except Exception:
            error_body = (
                "Unable to read Cloudflare "
                "error response."
            )


        #
        # IMPORTANT:
        # We log Cloudflare's response, but we
        # NEVER print api_token or Authorization.
        #
        print(
            "CLOUDFLARE TURN HTTP ERROR:",
            {
                "status":
                    error.code,

                "reason":
                    str(
                        error.reason
                    ),

                "response":
                    error_body[:1500],
            }
        )


        return JsonResponse(
            {
                "error":
                    "Unable to obtain TURN credentials."
            },
            status=502,
        )


    except urllib.error.URLError as error:
        print(
            "CLOUDFLARE TURN URL ERROR:",
            {
                "reason":
                    str(
                        error.reason
                    ),
            }
        )


        return JsonResponse(
            {
                "error":
                    "Unable to obtain TURN credentials."
            },
            status=502,
        )


    except TimeoutError as error:
        print(
            "CLOUDFLARE TURN TIMEOUT:",
            str(
                error
            ),
        )


        return JsonResponse(
            {
                "error":
                    "Unable to obtain TURN credentials."
            },
            status=502,
        )


    except json.JSONDecodeError as error:
        print(
            "CLOUDFLARE TURN JSON ERROR:",
            {
                "message":
                    str(
                        error
                    ),
            }
        )


        return JsonResponse(
            {
                "error":
                    "TURN provider returned "
                    "an invalid response."
            },
            status=502,
        )


    except Exception as error:
        #
        # Last-resort logging.
        #
        # Do NOT return Python internals to the
        # frontend in production.
        #
        print(
            "CLOUDFLARE TURN UNEXPECTED ERROR:",
            {
                "type":
                    type(error).__name__,

                "message":
                    str(
                        error
                    ),
            }
        )


        return JsonResponse(
            {
                "error":
                    "Unable to obtain TURN credentials."
            },
            status=502,
        )


    ice_servers = (
        cloudflare_data
        .get(
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
        print(
            "CLOUDFLARE TURN INVALID RESPONSE: "
            "iceServers missing or empty."
        )


        return JsonResponse(
            {
                "error":
                    "TURN provider returned "
                    "an invalid response."
            },
            status=502,
        )


    #
    # Cloudflare includes alternate port 53
    # in the response.
    #
    # Their docs note that browsers may block
    # it, so we remove :53 while keeping:
    #
    # STUN 3478
    # TURN UDP 3478
    # TURN TCP 3478 / 80
    # TURN TLS 5349 / 443
    #
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
            item
            for item in urls
            if (
                isinstance(
                    item,
                    str,
                )
                and ":53" not in item
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


    if not cleaned_servers:
        print(
            "CLOUDFLARE TURN INVALID RESPONSE: "
            "No usable ICE URLs after filtering."
        )


        return JsonResponse(
            {
                "error":
                    "TURN provider returned "
                    "no usable ICE servers."
            },
            status=502,
        )


    print(
        "CLOUDFLARE TURN SUCCESS:",
        {
            "user_id":
                request.user.id,

            "server_count":
                len(
                    cleaned_servers
                ),

            "ttl":
                ttl,
        }
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