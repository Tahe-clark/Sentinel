export function createSignalingSocket() {
  const socket = new WebSocket(
    "ws://localhost:8000/ws/signaling/"
  );

  return socket;
}