import {
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useTheme,
} from "../../contexts/ThemeContext";

import {
  useAuth,
} from "../../contexts/AuthContext";

import {
  login,
} from "../../services/auth";


function LoginPage() {
  const {
    theme,
  } = useTheme();

  const {
    refreshUser,
  } = useAuth();


  const navigate =
    useNavigate();


  const [
    username,
    setUsername,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);


  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();


    try {
      setLoading(
        true
      );

      setError(
        ""
      );


      await login(
        username,
        password
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


  if (
    theme === "glass"
  ) {
    return (
      <div
        className="
          max-w-sm
          mx-auto
          py-12
        "
      >
        <form
          onSubmit={
            handleSubmit
          }

          className="
            glass-card
            rounded-3xl
            p-8
            space-y-6
          "
        >
          <div
            className="
              text-center
              space-y-1
            "
          >
            <div
              className="
                w-12
                h-12
                rounded-2xl
                btn-solid
                mx-auto
                flex
                items-center
                justify-center
                font-semibold
                text-sm
                mb-3
              "
            >
              S
            </div>

            <h1
              className="
                text-xl
                font-semibold
                tracking-tight
              "
            >
              Bienvenue
            </h1>

            <p
              className="
                text-xs
                text-muted
              "
            >
              Connectez-vous pour
              continuer
            </p>
          </div>


          <div
            className="
              space-y-3
            "
          >
            <input
              value={
                username
              }

              placeholder="clark@sentinel.app"

              onChange={(
                event
              ) =>
                setUsername(
                  event.target.value
                )
              }

              className="
                glass-input
                w-full
                py-2.5
                px-3.5
                rounded-xl
                text-xs
                font-medium
                focus:outline-none
              "
            />


            <input
              type="password"

              value={
                password
              }

              placeholder="••••••••••••"

              onChange={(
                event
              ) =>
                setPassword(
                  event.target.value
                )
              }

              className="
                glass-input
                w-full
                py-2.5
                px-3.5
                rounded-xl
                text-xs
                font-medium
                focus:outline-none
              "
            />


            <button
              disabled={
                loading
              }

              className="
                w-full
                py-2.5
                rounded-xl
                btn-solid
                text-xs
                font-medium
                mt-2
              "
            >
              {loading
                ? "Connexion..."
                : "Se connecter"}
            </button>
          </div>


          {error && (
            <p
              className="
                text-xs
                text-rose-400
                text-center
              "
            >
              {error}
            </p>
          )}


          <p
            className="
              text-xs
              text-muted
              text-center
            "
          >
            Pas encore de compte ?
            {" "}

            <Link
              to="/register"

              className="
                text-white
              "
            >
              Créer un compte
            </Link>
          </p>
        </form>
      </div>
    );
  }


  return (
    <div
      className="
        space-y-6
        max-w-md
        mx-auto
        py-10
      "
    >
      <form
        onSubmit={
          handleSubmit
        }

        className="
          panel-tactical
          p-6
          rounded
          border
          border-tactical-border
          space-y-5
          font-mono
        "
      >
        <div
          className="
            text-center
            space-y-2
            border-b
            border-tactical-border
            pb-4
          "
        >
          <div
            className="
              w-10
              h-10
              mx-auto
              bg-emerald-950
              border
              border-emerald-500/40
              rounded
              flex
              items-center
              justify-center
              text-emerald-400
              font-bold
            "
          >
            SEC
          </div>


          <h1
            className="
              text-base
              font-bold
              text-white
              uppercase
              tracking-wider
            "
          >
            Accès Restreint //
            Sentinel
          </h1>


          <p
            className="
              text-[11px]
              text-slate-400
            "
          >
            Authentification requise
            pour l'accès aux flux
          </p>
        </div>


        <div
          className="
            space-y-4
            text-xs
          "
        >
          <div
            className="
              space-y-1
            "
          >
            <label
              className="
                text-slate-400
              "
            >
              IDENTIFIANT
            </label>

            <input
              value={
                username
              }

              onChange={(
                event
              ) =>
                setUsername(
                  event.target.value
                )
              }

              className="
                w-full
                px-3
                py-2
                bg-black
                border
                border-tactical-border
                text-slate-200
                focus:outline-none
                focus:border-emerald-500
                rounded
              "
            />
          </div>


          <div
            className="
              space-y-1
            "
          >
            <label
              className="
                text-slate-400
              "
            >
              MOT DE PASSE
            </label>

            <input
              type="password"

              value={
                password
              }

              onChange={(
                event
              ) =>
                setPassword(
                  event.target.value
                )
              }

              className="
                w-full
                px-3
                py-2
                bg-black
                border
                border-tactical-border
                text-slate-200
                focus:outline-none
                focus:border-emerald-500
                rounded
              "
            />
          </div>


          <button
            disabled={
              loading
            }

            className="
              w-full
              py-2.5
              bg-emerald-600
              hover:bg-emerald-500
              text-black
              font-bold
              uppercase
              tracking-wider
              rounded
              transition-colors
              mt-2
            "
          >
            {loading
              ? "CONNEXION..."
              : "Connexion au Terminal"}
          </button>
        </div>


        {error && (
          <p
            className="
              text-xs
              text-red-400
              text-center
            "
          >
            {error}
          </p>
        )}


        <p
          className="
            text-[11px]
            text-slate-500
            text-center
          "
        >
          Aucun accès ?
          {" "}

          <Link
            to="/register"

            className="
              text-emerald-400
            "
          >
            CRÉER COMPTE
          </Link>
        </p>
      </form>
    </div>
  );
}


export default LoginPage;