export function createSignalingSocket() {
  const host = window.location.hostname;

  return new WebSocket(
    `ws://${host}:8000/ws/signaling/`
  );
}