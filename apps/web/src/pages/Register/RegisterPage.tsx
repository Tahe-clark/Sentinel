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
  register,
} from "../../services/auth";

import {
  useAuth,
} from "../../contexts/AuthContext";

import {
  useTheme,
} from "../../contexts/ThemeContext";


function RegisterPage() {
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
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
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

    setError("");


    if (!username.trim()) {
      setError(
        "Le nom d'utilisateur est requis."
      );

      return;
    }


    if (!email.trim()) {
      setError(
        "L'adresse courriel est requise."
      );

      return;
    }


    if (
      password.length < 6
    ) {
      setError(
        "Le mot de passe doit contenir au moins 6 caractères."
      );

      return;
    }


    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Les mots de passe ne correspondent pas."
      );

      return;
    }


    try {
      setLoading(
        true
      );


      await register(
        username.trim(),
        email.trim(),
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
          : "Unable to create account."
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
          py-8
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
              +
            </div>


            <h1
              className="
                text-xl
                font-semibold
                tracking-tight
              "
            >
              Créer un compte
            </h1>


            <p
              className="
                text-xs
                text-muted
              "
            >
              Rejoignez le réseau
              Sentinel
            </p>
          </div>


          <div
            className="
              space-y-3
            "
          >
            <input
              type="text"

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

              placeholder="Nom complet"

              autoComplete="username"

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
              type="email"

              value={
                email
              }

              onChange={(
                event
              ) =>
                setEmail(
                  event.target.value
                )
              }

              placeholder="Adresse courriel"

              autoComplete="email"

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

              onChange={(
                event
              ) =>
                setPassword(
                  event.target.value
                )
              }

              placeholder="Mot de passe"

              autoComplete="new-password"

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
                confirmPassword
              }

              onChange={(
                event
              ) =>
                setConfirmPassword(
                  event.target.value
                )
              }

              placeholder="Confirmer le mot de passe"

              autoComplete="new-password"

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
              type="submit"

              disabled={
                loading
              }

              className="
                w-full
                py-2.5
                rounded-xl
                btn-primary
                text-xs
                font-medium
                shadow-sm
                mt-2
                disabled:opacity-50
              "
            >
              {loading
                ? "Création..."
                : "S'inscrire"}
            </button>


            <div
              className="
                text-center
                pt-2
              "
            >
              <Link
                to="/login"

                className="
                  text-xs
                  text-muted
                  hover:text-white
                  transition-colors
                  font-medium
                "
              >
                Déjà un compte ?
                {" "}
                Connexion
              </Link>
            </div>
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
            +REG
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
            Nouveau Compte //
            Agent
          </h1>


          <p
            className="
              text-[11px]
              text-slate-400
            "
          >
            Enregistrement d'un
            nouvel opérateur réseau
          </p>
        </div>


        <div
          className="
            space-y-3.5
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
              NOM COMPLET / AGENT
            </label>


            <input
              type="text"

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

              placeholder="ex: Clark Tahe"

              autoComplete="username"

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
              ADRESSE COURRIEL
            </label>


            <input
              type="email"

              value={
                email
              }

              onChange={(
                event
              ) =>
                setEmail(
                  event.target.value
                )
              }

              placeholder="agent@sentinel.app"

              autoComplete="email"

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

              placeholder="••••••••••••"

              autoComplete="new-password"

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
              CONFIRMER LE MOT DE
              PASSE
            </label>


            <input
              type="password"

              value={
                confirmPassword
              }

              onChange={(
                event
              ) =>
                setConfirmPassword(
                  event.target.value
                )
              }

              placeholder="••••••••••••"

              autoComplete="new-password"

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
            type="submit"

            disabled={
              loading
            }

            className="
              w-full
              py-2.5
              bg-emerald-600
              hover:bg-emerald-500
              disabled:opacity-50
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
              ? "CRÉATION..."
              : "Créer le profil et connecter"}
          </button>


          <div
            className="
              text-center
              pt-2
              border-t
              border-tactical-border/60
            "
          >
            <span
              className="
                text-[11px]
                text-slate-400
              "
            >
              Vous avez déjà un
              accès ?
              {" "}
            </span>


            <Link
              to="/login"

              className="
                text-[11px]
                text-emerald-400
                hover:underline
                font-bold
              "
            >
              Se connecter
            </Link>
          </div>
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
      </form>
    </div>
  );
}


export default RegisterPage;