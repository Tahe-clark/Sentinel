import {
  WS_BASE_URL,
} from "../config/environment";

import {
  getSessionToken,
} from "./auth";


export type SignalingRole =
  "dashboard" |
  "emitter";


export function createSignalingSocket(
  role: SignalingRole = "dashboard"
) {
  let wsUrl =
    `${WS_BASE_URL}/ws/signaling/${role}/`;


  if (
    role === "dashboard"
  ) {
    const token =
      getSessionToken();


    if (token) {
      wsUrl +=
        `?token=${encodeURIComponent(
          token
        )}`;
    }
  }


  console.log(
    "Opening signaling socket:",
    `${WS_BASE_URL}/ws/signaling/${role}/`
  );


  return new WebSocket(
    wsUrl
  );
}