import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  register,
} from "../../services/auth";

import {
  useAuth,
} from "../../contexts/AuthContext";


function RegisterPage() {
  const [username, setUsername] =
    useState("");

  const [email, setEmail] =
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
      setLoading(true);

      setError("");


      await register(
        username,
        email,
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
          : "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <main>
      <h1>
        Create Sentinel Account
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
            Email
          </label>

          <input
            type="email"

            value={
              email
            }

            onChange={(
              event
            ) => {
              setEmail(
                event.target.value
              );
            }}
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
            ? "Creating..."
            : "Create Account"}
        </button>
      </form>


      {error && (
        <p>
          {error}
        </p>
      )}


      <p>
        Already registered?
        {" "}

        <Link
          to="/login"
        >
          Login
        </Link>
      </p>
    </main>
  );
}


export default RegisterPage;