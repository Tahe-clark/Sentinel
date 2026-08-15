export function createSignalingSocket() {
  // Utilise l'IP réelle de la machine qui héberge le site
  const host = window.location.hostname; 
  const wsUrl = `ws://${host}:8000/ws/signaling/`;

  return new WebSocket(wsUrl);
}