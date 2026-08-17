import {
  API_BASE_URL,
} from "../config/environment";


export interface User {
  id: number;
  username: string;
  email: string;
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


/* =========================================================
   CSRF
   ========================================================= */

export async function getCsrfToken():
  Promise<string> {

  const response =
    await fetch(
      `${API_BASE_URL}/auth/csrf/`,
      {
        method:
          "GET",

        credentials:
          "include",

        cache:
          "no-store",
      }
    );


  const data =
    await readResponse(
      response
    );


  if (!response.ok) {
    throw new Error(
      data.error ??
      "Unable to obtain CSRF token."
    );
  }


  if (!data.csrfToken) {
    throw new Error(
      "CSRF token was not returned by the server."
    );
  }


  return data.csrfToken;
}


/* =========================================================
   GENERIC AUTH POST
   ========================================================= */

async function authPost(
  path: string,
  body?: object,
) {
  /*
   * IMPORTANT:
   *
   * On récupère volontairement
   * un NOUVEAU token CSRF avant
   * chaque POST.
   *
   * Django peut renouveler le
   * token CSRF après login.
   *
   * On évite donc de conserver
   * l'ancien token en mémoire.
   */
  const csrf =
    await getCsrfToken();


  const response =
    await fetch(
      `${API_BASE_URL}${path}`,
      {
        method:
          "POST",

        credentials:
          "include",

        headers: {
          "Content-Type":
            "application/json",

          "X-CSRFToken":
            csrf,
        },

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


/* =========================================================
   REGISTER
   ========================================================= */

export async function register(
  username: string,
  email: string,
  password: string,
) {
  return authPost(
    "/auth/register/",
    {
      username,
      email,
      password,
    }
  );
}


/* =========================================================
   LOGIN
   ========================================================= */

export async function login(
  username: string,
  password: string,
) {
  return authPost(
    "/auth/login/",
    {
      username,
      password,
    }
  );
}


/* =========================================================
   LOGOUT
   ========================================================= */

export async function logout() {
  return authPost(
    "/auth/logout/"
  );
}


/* =========================================================
   CURRENT USER
   ========================================================= */

export async function getCurrentUser():
  Promise<User | null> {

  const response =
    await fetch(
      `${API_BASE_URL}/auth/me/`,
      {
        method:
          "GET",

        credentials:
          "include",

        cache:
          "no-store",
      }
    );


  if (
    response.status === 401
  ) {
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