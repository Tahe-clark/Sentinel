const API_BASE =
  `http://${window.location.hostname}:8000/api`;


export interface User {
  id: number;
  username: string;
  email: string;
}


let csrfToken:
  string | null = null;


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
    `Server returned ${response.status}: ${text.slice(0, 200)}`
  );
}


export async function getCsrfToken():
  Promise<string> {

  if (csrfToken) {
    return csrfToken;
  }


  const response =
    await fetch(
      `${API_BASE}/auth/csrf/`,
      {
        credentials: "include",
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


  csrfToken =
    data.csrfToken;


  return csrfToken;
}


async function authPost(
  path: string,
  body?: object,
) {
  const csrf =
    await getCsrfToken();


  const response =
    await fetch(
      `${API_BASE}${path}`,
      {
        method: "POST",

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


export async function logout() {
  return authPost(
    "/auth/logout/"
  );
}


export async function getCurrentUser():
  Promise<User | null> {

  const response =
    await fetch(
      `${API_BASE}/auth/me/`,
      {
        credentials:
          "include",
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