import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useTheme,
} from "../../contexts/ThemeContext";

import {
  claimPairing,
} from "../../services/pairing";


function PairDevicePage() {
  const {
    theme,
  } = useTheme();


  const navigate =
    useNavigate();


  const [code, setCode] =
    useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);


  async function pairDevice() {
    const cleanCode =
      code.replace(
        /\D/g,
        ""
      );


    if (
      cleanCode.length !== 6
    ) {
      setMessage(
        "Le code doit contenir 6 chiffres."
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


      await claimPairing(
        cleanCode
      );


      navigate(
        "/dashboard"
      );

    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Pairing failed."
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
          max-w-md
          mx-auto
          py-8
        "
      >
        <div
          className="
            glass-card
            rounded-3xl
            p-8
            space-y-6
            text-center
          "
        >
          <div>
            <h1
              className="
                text-2xl
                font-semibold
                tracking-tight
              "
            >
              Appairer un appareil
            </h1>

            <p
              className="
                text-xs
                text-muted
                mt-1
              "
            >
              Entrez le code affiché
              sur l'écran émetteur.
            </p>
          </div>


          <input
            value={
              code
            }

            maxLength={
              7
            }

            placeholder="849-201"

            onChange={(
              event
            ) => {
              let value =
                event.target.value
                  .replace(
                    /\D/g,
                    ""
                  )
                  .slice(
                    0,
                    6
                  );


              if (
                value.length > 3
              ) {
                value =
                  `${value.slice(0, 3)}-${value.slice(3)}`;
              }


              setCode(
                value
              );
            }}

            className="
              glass-input
              w-full
              py-3.5
              px-4
              rounded-2xl
              text-center
              text-xl
              font-semibold
              tracking-widest
              focus:outline-none
            "
          />


          <button
            disabled={
              loading
            }

            onClick={
              pairDevice
            }

            className="
              w-full
              py-3
              rounded-2xl
              btn-primary
              text-xs
              font-medium
              shadow-sm
            "
          >
            {loading
              ? "Connexion..."
              : "Lier l'appareil"}
          </button>


          {message && (
            <p
              className="
                text-xs
                text-rose-400
              "
            >
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }


  return (
    <div
      className="
        space-y-6
        max-w-xl
        mx-auto
      "
    >
      <div
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
            border-b
            border-tactical-border
            pb-3
          "
        >
          <h1
            className="
              text-base
              font-bold
              text-white
              uppercase
              tracking-wider
            "
          >
            Appairer un nouvel
            appareil
          </h1>

          <p
            className="
              text-xs
              text-slate-400
              mt-1
            "
          >
            Saisissez le code fourni
            par le terminal émetteur.
          </p>
        </div>


        <div
          className="
            space-y-3
          "
        >
          <label
            className="
              text-xs
              text-slate-300
            "
          >
            CODE D'APPAIRAGE
            (6 CHIFFRES)
          </label>


          <input
            value={
              code
            }

            placeholder="EX: 849-201"

            maxLength={
              7
            }

            onChange={(
              event
            ) => {
              let value =
                event.target.value
                  .replace(
                    /\D/g,
                    ""
                  )
                  .slice(
                    0,
                    6
                  );


              if (
                value.length > 3
              ) {
                value =
                  `${value.slice(0, 3)}-${value.slice(3)}`;
              }


              setCode(
                value
              );
            }}

            className="
              w-full
              px-4
              py-2.5
              bg-black
              border
              border-tactical-border
              text-emerald-400
              font-bold
              text-center
              tracking-widest
              text-lg
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

          onClick={
            pairDevice
          }

          className="
            w-full
            py-2.5
            bg-emerald-600
            hover:bg-emerald-500
            text-black
            font-bold
            text-xs
            uppercase
            tracking-wider
            rounded
            transition-colors
          "
        >
          {loading
            ? "LIAISON..."
            : "Valider la liaison"}
        </button>


        {message && (
          <p
            className="
              text-xs
              text-red-400
            "
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}


export default PairDevicePage;