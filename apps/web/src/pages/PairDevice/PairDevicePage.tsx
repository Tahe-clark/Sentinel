import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  claimPairing,
} from "../../services/pairing";


function PairDevicePage() {
  const [code, setCode] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  const navigate =
    useNavigate();


  async function pairDevice() {
    const cleanCode =
      code.trim();


    if (!cleanCode) {
      setMessage(
        "Enter the pairing code."
      );

      return;
    }


    try {
      setLoading(true);

      setMessage(
        "Pairing device..."
      );


      const result =
        await claimPairing(
          cleanCode
        );


      setMessage(
        result.message
      );


      setTimeout(() => {
        navigate(
          "/dashboard"
        );
      }, 800);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Pairing failed."
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <main>
      <h1>
        Add Device
      </h1>


      <p>
        Enter the six-digit code
        displayed on the device
        you want to pair.
      </p>


      <input
        value={code}

        maxLength={6}

        inputMode="numeric"

        placeholder="583291"

        onChange={(event) => {
          const value =
            event.target.value.replace(
              /\D/g,
              ""
            );

          setCode(value);
        }}
      />


      <button
        onClick={pairDevice}

        disabled={
          loading ||
          code.length !== 6
        }
      >
        {loading
          ? "Pairing..."
          : "Pair Device"}
      </button>


      {message && (
        <p>
          {message}
        </p>
      )}
    </main>
  );
}


export default PairDevicePage;