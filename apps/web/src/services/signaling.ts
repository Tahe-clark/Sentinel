import {
  WS_BASE_URL,
} from "../config/environment";


export type SignalingRole =
  "dashboard" |
  "emitter";


export function createSignalingSocket(
  role: SignalingRole = "dashboard"
) {
  const wsUrl =
    `${WS_BASE_URL}/ws/signaling/${role}/`;


  console.log(
    "Opening signaling socket:",
    wsUrl
  );


  return new WebSocket(
    wsUrl
  );
}