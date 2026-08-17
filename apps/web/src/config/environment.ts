const DEFAULT_API_URL =
  `http://${window.location.hostname}:8000/api`;

const DEFAULT_WS_URL =
  `ws://${window.location.hostname}:8000`;


export const API_BASE_URL =
  (
    import.meta.env.VITE_API_URL ||
    DEFAULT_API_URL
  ).replace(
    /\/$/,
    ""
  );


export const WS_BASE_URL =
  (
    import.meta.env.VITE_WS_URL ||
    DEFAULT_WS_URL
  ).replace(
    /\/$/,
    ""
  );