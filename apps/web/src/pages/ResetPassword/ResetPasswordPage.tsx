import {
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  resetPassword,
} from "../../services/auth";


function ResetPasswordPage() {
  const {
    uid,
    token,
  } = useParams();


  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);


  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();


    if (
      !uid ||
      !token
    ) {
      setMessage(
        "Lien de récupération invalide."
      );

      return;
    }


    if (
      password !==
      confirmPassword
    ) {
      setMessage(
        "Les mots de passe ne correspondent pas."
      );

      return;
    }


    try {
      setLoading(
        true
      );

      setMessage(
        ""
      );


      const result =
        await resetPassword(
          uid,
          token,
          password,
        );


      setSuccess(
        true
      );

      setMessage(
        result.message ??
        "Password updated successfully."
      );

    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to reset password."
      );

    } finally {
      setLoading(
        false
      );
    }
  }


  return (
    <div
      className="
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
        <h1
          className="
            text-base
            font-bold
            text-white
            uppercase
          "
        >
          Nouveau mot de passe
        </h1>


        {!success && (
          <>
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

              placeholder="Nouveau mot de passe"

              required

              className="
                w-full
                px-3
                py-2
                bg-black
                border
                border-tactical-border
                text-slate-200
                rounded
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

              required

              className="
                w-full
                px-3
                py-2
                bg-black
                border
                border-tactical-border
                text-slate-200
                rounded
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
                bg-emerald-600
                text-black
                font-bold
                rounded
              "
            >
              {loading
                ? "MISE À JOUR..."
                : "Changer le mot de passe"}
            </button>
          </>
        )}


        {message && (
          <p
            className={
              success
                ? "text-xs text-emerald-400"
                : "text-xs text-red-400"
            }
          >
            {message}
          </p>
        )}


        {success && (
          <Link
            to="/login"

            className="
              text-xs
              text-emerald-400
            "
          >
            Se connecter
          </Link>
        )}
      </form>
    </div>
  );
}


export default ResetPasswordPage;