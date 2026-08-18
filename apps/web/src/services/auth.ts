import {
  API_BASE_URL,
} from "../config/environment";


export interface User {
  id: number;
  username: string;
  email: string;
}


const SESSION_TOKEN_KEY =
  "sentinel_session_token";


export function getSessionToken():
  string | null {

  return localStorage.getItem(
    SESSION_TOKEN_KEY
  );
}


function saveSessionToken(
  token: string
) {
  localStorage.setItem(
    SESSION_TOKEN_KEY,
    token
  );
}


export function clearSessionToken() {
  localStorage.removeItem(
    SESSION_TOKEN_KEY
  );
}


async function readResponse(
  response: Response
) {
  const contentType =
    response.headers.get(
      "content-type"
    );


  if (
    contentType?.includes(
      "application/json"
    )
  ) {
    return response.json();
  }


  const text =
    await response.text();


  throw new Error(
    `Server returned ${response.status}: ${text.slice(0, 250)}`
  );
}


async function apiPost(
  path: string,
  body?: object,
  authenticated = false,
) {
  const headers:
    Record<string, string> = {
      "Content-Type":
        "application/json",
    };


  if (authenticated) {
    const token =
      getSessionToken();


    if (!token) {
      throw new Error(
        "Authentication required."
      );
    }


    headers.Authorization =
      `Session ${token}`;
  }


  const response =
    await fetch(
      `${API_BASE_URL}${path}`,
      {
        method:
          "POST",

        headers,

        body:
          JSON.stringify(
            body ?? {}
          ),
      }
    );


  const data =
    await readResponse(
      response
    );


  if (!response.ok) {
    throw new Error(
      data.error ??
      "Request failed."
    );
  }


  return data;
}


export async function register(
  username: string,
  email: string,
  password: string,
) {
  const data =
    await apiPost(
      "/auth/register/",
      {
        username,
        email,
        password,
      }
    );


  if (data.token) {
    saveSessionToken(
      data.token
    );
  }


  return data;
}


export async function login(
  identifier: string,
  password: string,
) {
  const data =
    await apiPost(
      "/auth/login/",
      {
        identifier,
        password,
      }
    );


  if (data.token) {
    saveSessionToken(
      data.token
    );
  }


  return data;
}


export async function logout() {
  try {
    await apiPost(
      "/auth/logout/",
      {},
      true,
    );

  } finally {
    clearSessionToken();
  }
}


export async function getCurrentUser():
  Promise<User | null> {

  const token =
    getSessionToken();


  if (!token) {
    return null;
  }


  const response =
    await fetch(
      `${API_BASE_URL}/auth/me/`,
      {
        method:
          "GET",

        headers: {
          Authorization:
            `Session ${token}`,
        },

        cache:
          "no-store",
      }
    );


  if (
    response.status === 401
  ) {
    clearSessionToken();

    return null;
  }


  const data =
    await readResponse(
      response
    );


  if (!response.ok) {
    throw new Error(
      data.error ??
      "Unable to load current user."
    );
  }


  return data.user;
}


export async function forgotPassword(
  email: string,
) {
  return apiPost(
    "/auth/forgot-password/",
    {
      email,
    }
  );
}


export async function resetPassword(
  uid: string,
  token: string,
  password: string,
) {
  return apiPost(
    `/auth/reset-password/${encodeURIComponent(uid)}/${encodeURIComponent(token)}/`,
    {
      password,
    }
  );
}


export function getAuthHeaders():
  Record<string, string> {

  const token =
    getSessionToken();


  if (!token) {
    return {};
  }


  return {
    Authorization:
      `Session ${token}`,
  };
}