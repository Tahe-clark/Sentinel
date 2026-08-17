let cachedIceServers:
  RTCIceServer[] | null = null;

let cachedAt = 0;

const CACHE_DURATION_MS =
  10 * 60 * 1000;


const FALLBACK_ICE_SERVERS:
  RTCIceServer[] = [
    {
      urls:
        "stun:stun.l.google.com:19302",
    },
  ];


function normalizeDomain(
  value: string
) {
  return value
    .trim()
    .replace(
      /^https?:\/\//,
      ""
    )
    .replace(
      /\/$/,
      ""
    );
}


export async function getIceServers():
  Promise<RTCIceServer[]> {

  const now =
    Date.now();


  if (
    cachedIceServers &&
    now - cachedAt <
      CACHE_DURATION_MS
  ) {
    return cachedIceServers;
  }


  const rawDomain =
    import.meta.env
      .VITE_TURN_DOMAIN;

  const apiKey =
    import.meta.env
      .VITE_TURN_API_KEY;


  if (
    !rawDomain ||
    !apiKey
  ) {
    console.warn(
      "TURN configuration missing. Using STUN only."
    );


    return FALLBACK_ICE_SERVERS;
  }


  const domain =
    normalizeDomain(
      rawDomain
    );


  const url =
    `https://${domain}` +
    `/api/v1/turn/credentials` +
    `?apiKey=${encodeURIComponent(
      apiKey
    )}`;


  try {
    const response =
      await fetch(
        url,
        {
          method:
            "GET",

          cache:
            "no-store",
        }
      );


    if (!response.ok) {
      throw new Error(
        `TURN credential request failed (${response.status}).`
      );
    }


    const data:
      unknown =
      await response.json();


    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {
      throw new Error(
        "TURN credential response did not contain ICE servers."
      );
    }


    cachedIceServers =
      data as RTCIceServer[];

    cachedAt =
      now;


    console.log(
      "TURN/STUN ICE configuration loaded."
    );


    return cachedIceServers;

  } catch (error) {
    console.error(
      "Unable to load TURN credentials:",
      error
    );


    return FALLBACK_ICE_SERVERS;
  }
}


interface PeerConnectionHandlers {
  onIceCandidate?:
    (
      candidate:
        RTCIceCandidate
    ) => void;

  onConnectionStateChange?:
    (
      state:
        RTCPeerConnectionState
    ) => void;

  onIceConnectionStateChange?:
    (
      state:
        RTCIceConnectionState
    ) => void;
}


export async function createConfiguredPeerConnection(
  handlers:
    PeerConnectionHandlers = {}
): Promise<RTCPeerConnection> {

  const iceServers =
    await getIceServers();


  const peerConnection =
    new RTCPeerConnection({
      iceServers,
      iceCandidatePoolSize:
        10,
    });


  peerConnection.onicecandidate =
    (event) => {
      if (
        !event.candidate
      ) {
        return;
      }


      handlers
        .onIceCandidate
        ?.(
          event.candidate
        );
    };


  peerConnection
    .onconnectionstatechange =
    () => {
      handlers
        .onConnectionStateChange
        ?.(
          peerConnection
            .connectionState
        );
    };


  peerConnection
    .oniceconnectionstatechange =
    () => {
      handlers
        .onIceConnectionStateChange
        ?.(
          peerConnection
            .iceConnectionState
        );
    };


  peerConnection.onicecandidateerror =
    (event) => {
      console.warn(
        "ICE candidate error:",
        event.errorCode,
        event.errorText,
        event.url
      );
    };


  return peerConnection;
}
