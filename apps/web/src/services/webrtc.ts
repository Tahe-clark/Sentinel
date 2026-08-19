import {
  API_BASE_URL,
} from "../config/environment";

import {
  getAuthHeaders,
} from "./auth";


const GOOGLE_STUN:
  RTCIceServer[] = [
    {
      urls:
        "stun:stun.l.google.com:19302",
    },
  ];


/* =========================================================
   TYPES
========================================================= */

export interface PeerConnectionHandlers {
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

  onIceCandidateError?:
    (
      event:
        RTCPeerConnectionIceErrorEvent
    ) => void;
}


/* =========================================================
   CLOUDFLARE TURN
========================================================= */

async function getCloudflareIceServers():
  Promise<RTCIceServer[] | null> {

  const authHeaders =
    getAuthHeaders();


  if (
    !authHeaders.Authorization
  ) {
    return null;
  }


  try {
    const response =
      await fetch(
        `${API_BASE_URL}/rtc/ice-servers/`,
        {
          method:
            "GET",

          headers: {
            ...authHeaders,
          },

          cache:
            "no-store",
        }
      );


    if (!response.ok) {
      console.warn(
        "Cloudflare TURN unavailable:",
        response.status
      );

      return null;
    }


    const data =
      await response.json();


    if (
      !Array.isArray(
        data.iceServers
      ) ||
      data.iceServers.length === 0
    ) {
      console.warn(
        "Cloudflare returned no ICE servers."
      );

      return null;
    }


    console.log(
      "ICE provider: Cloudflare"
    );


    return data.iceServers;

  } catch (error) {
    console.warn(
      "Unable to load Cloudflare TURN:",
      error
    );


    return null;
  }
}


/* =========================================================
   METERED FALLBACK
========================================================= */

async function getMeteredIceServers():
  Promise<RTCIceServer[] | null> {

  const domain =
    import.meta.env
      .VITE_TURN_DOMAIN;

  const apiKey =
    import.meta.env
      .VITE_TURN_API_KEY;


  if (
    !domain ||
    !apiKey
  ) {
    return null;
  }


  const normalizedDomain =
    String(
      domain
    )
      .replace(
        /^https?:\/\//,
        ""
      )
      .replace(
        /\/+$/,
        ""
      );


  const url =
    `https://${normalizedDomain}` +
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
      console.warn(
        "Metered TURN unavailable:",
        response.status
      );

      return null;
    }


    const data =
      await response.json();


    if (
      !Array.isArray(
        data
      ) ||
      data.length === 0
    ) {
      return null;
    }


    console.log(
      "ICE provider: Metered fallback"
    );


    return data;

  } catch (error) {
    console.warn(
      "Unable to load Metered TURN:",
      error
    );


    return null;
  }
}


/* =========================================================
   ICE CONFIGURATION
========================================================= */

export async function getIceServers():
  Promise<RTCIceServer[]> {

  const cloudflare =
    await getCloudflareIceServers();


  if (
    cloudflare &&
    cloudflare.length > 0
  ) {
    return [
      ...GOOGLE_STUN,
      ...cloudflare,
    ];
  }


  const metered =
    await getMeteredIceServers();


  if (
    metered &&
    metered.length > 0
  ) {
    return [
      ...GOOGLE_STUN,
      ...metered,
    ];
  }


  console.warn(
    "No TURN provider available. " +
    "Using STUN only."
  );


  return GOOGLE_STUN;
}


/* =========================================================
   PEER CONNECTION
========================================================= */

export async function createConfiguredPeerConnection(
  handlers:
    PeerConnectionHandlers = {},
):
  Promise<RTCPeerConnection> {

  const iceServers =
    await getIceServers();


  const peerConnection =
    new RTCPeerConnection({
      iceServers,

      iceCandidatePoolSize:
        10,
    });


  peerConnection.onicecandidate =
    (event:
      RTCPeerConnectionIceEvent
    ) => {

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

      const state:
        RTCPeerConnectionState =
          peerConnection
            .connectionState;


      console.log(
        "WebRTC connection state:",
        state
      );


      handlers
        .onConnectionStateChange
        ?.(
          state
        );
    };


  peerConnection
    .oniceconnectionstatechange =
    () => {

      const state:
        RTCIceConnectionState =
          peerConnection
            .iceConnectionState;


      console.log(
        "ICE connection state:",
        state
      );


      handlers
        .onIceConnectionStateChange
        ?.(
          state
        );
    };


  peerConnection
    .onicecandidateerror =
    (
      event:
        RTCPeerConnectionIceErrorEvent
    ) => {

      console.warn(
        "ICE candidate error:",
        event.errorCode,
        event.errorText
      );


      handlers
        .onIceCandidateError
        ?.(
          event
        );
    };


  return peerConnection;
}


/* =========================================================
   OPTIONAL SIMPLE API
========================================================= */

export async function createPeerConnection():
  Promise<RTCPeerConnection> {

  return (
    createConfiguredPeerConnection()
  );
}