import {
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  forgotPassword,
} from "../../services/auth";


function ForgotPasswordPage() {
  const [
    email,
    setEmail,
  ] = useState("");

  const [
    message,
    setMessage,
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

      setMessage(
        ""
      );


      const result =
        await forgotPassword(
          email.trim()
        );


      setMessage(
        result.message ??
        "If an account matches this email, a reset link has been sent."
      );

    } catch {
      setMessage(
        "If an account matches this email, a reset link has been sent."
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
          Réinitialiser le mot de passe
        </h1>


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
            ? "ENVOI..."
            : "Envoyer le lien"}
        </button>


        {message && (
          <p
            className="
              text-xs
              text-slate-400
            "
          >
            {message}
          </p>
        )}


        <Link
          to="/login"

          className="
            text-xs
            text-emerald-400
          "
        >
          Retour à la connexion
        </Link>
      </form>
    </div>
  );
}


export default ForgotPasswordPage;