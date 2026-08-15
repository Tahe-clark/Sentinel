export type SignalingRole =
  "dashboard" |
  "emitter";


export function createSignalingSocket(
  role: SignalingRole = "dashboard"
) {
  const host =
    window.location.hostname;


  const protocol =
    window.location.protocol ===
    "https:"
      ? "wss"
      : "ws";


  const wsUrl =
    `${protocol}://${host}:8000/ws/signaling/${role}/`;


  console.log(
    "Opening signaling socket:",
    wsUrl
  );


  return new WebSocket(
    wsUrl
  );
}