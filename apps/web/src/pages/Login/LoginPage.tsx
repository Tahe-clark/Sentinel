import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  login,
} from "../../services/auth";

import {
  useAuth,
} from "../../contexts/AuthContext";


function LoginPage() {
  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  const navigate =
    useNavigate();

  const {
    refreshUser,
  } = useAuth();


  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();


    try {
      setLoading(
        true
      );

      setError("");


      await login(
        username,
        password,
      );


      await refreshUser();


      navigate(
        "/dashboard"
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Login failed."
      );
    } finally {
      setLoading(
        false
      );
    }
  }


  return (
    <main>
      <h1>
        Login to Sentinel
      </h1>


      <form
        onSubmit={
          handleSubmit
        }
      >
        <div>
          <label>
            Username
          </label>

          <input
            value={
              username
            }

            onChange={(
              event
            ) => {
              setUsername(
                event.target.value
              );
            }}

            required
          />
        </div>


        <div>
          <label>
            Password
          </label>

          <input
            type="password"

            value={
              password
            }

            onChange={(
              event
            ) => {
              setPassword(
                event.target.value
              );
            }}

            required
          />
        </div>


        <button
          type="submit"

          disabled={
            loading
          }
        >
          {loading
            ? "Logging in..."
            : "Login"}
        </button>
      </form>


      {error && (
        <p>
          {error}
        </p>
      )}


      <p>
        No account?
        {" "}

        <Link
          to="/register"
        >
          Register
        </Link>
      </p>
    </main>
  );
}


export default LoginPage;