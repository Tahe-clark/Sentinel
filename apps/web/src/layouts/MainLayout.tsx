import {
  useEffect,
  useState,
} from "react";

import {
  Outlet,
} from "react-router-dom";

import Navbar
  from "../components/layout/Navbar";

import SpyThemeToggle
  from "../components/common/SpyThemeToggle";

import {
  useTheme,
} from "../contexts/ThemeContext";


const DEMO_VIDEO_URL =
  "https://pub-71b7f70a7f1d4955b7ef70babbf58240.r2.dev/demo.mp4";


function MainLayout() {
  const {
    theme,
  } = useTheme();


  const [
    demoOpen,
    setDemoOpen,
  ] = useState(false);


  useEffect(() => {
    if (!demoOpen) {
      return;
    }


    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setDemoOpen(
          false
        );
      }
    }


    const previousOverflow =
      document.body.style
        .overflow;


    document.body.style
      .overflow =
        "hidden";


    window.addEventListener(
      "keydown",
      handleKeyDown
    );


    return () => {
      document.body.style
        .overflow =
          previousOverflow;


      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    demoOpen,
  ]);


  function openDemo() {
    setDemoOpen(
      true
    );
  }


  function closeDemo() {
    setDemoOpen(
      false
    );
  }


  return (
    <div
      className="
        min-h-screen
        flex
        flex-col
      "
    >
      {theme === "glass" && (
        <div
          className="
            fixed
            inset-0
            pointer-events-none
            overflow-hidden
            -z-10
          "
        >
          <div
            className="
              absolute
              -top-40
              -left-40
              w-96
              h-96
              rounded-full
              blur-3xl
              transition-all
              duration-700
            "

            style={{
              background:
                "var(--halo-1)",
            }}
          />


          <div
            className="
              absolute
              top-1/3
              -right-40
              w-96
              h-96
              rounded-full
              blur-3xl
              transition-all
              duration-700
            "

            style={{
              background:
                "var(--halo-2)",
            }}
          />
        </div>
      )}


      <Navbar
        onDemoClick={
          openDemo
        }
      />


      <main
        className={
          theme === "tactical"
            ? `
              flex-1
              max-w-7xl
              w-full
              mx-auto
              px-6
              py-6
            `
            : `
              flex-1
              max-w-4xl
              w-[92%]
              mx-auto
              py-8
            `
        }
      >
        <Outlet />
      </main>


      <footer
        className={
          theme === "glass"
            ? `
              w-full
              mt-auto
              py-5
              px-6
              border-t
              border-white/5
            `
            : `
              w-full
              mt-auto
              py-4
              px-6
              border-t
              border-tactical-border
              bg-black/20
            `
        }
      >
        <div
          className={
            theme === "glass"
              ? `
                max-w-4xl
                mx-auto
                flex
                flex-col
                sm:flex-row
                items-center
                justify-between
                gap-2
                text-[11px]
                text-muted
              `
              : `
                max-w-7xl
                mx-auto
                flex
                flex-col
                sm:flex-row
                items-center
                justify-between
                gap-2
                font-mono
                text-[10px]
                text-slate-500
              `
          }
        >
          <span>
            Sentinel © 2026
          </span>


          <span>
            Built by{" "}

            <span
              className={
                theme === "glass"
                  ? `
                    text-white/80
                    font-medium
                  `
                  : `
                    text-emerald-400/80
                    font-bold
                  `
              }
            >
              Clark Tahe
            </span>
          </span>
        </div>
      </footer>


      <SpyThemeToggle />


      {demoOpen && (
        <div
          role="dialog"

          aria-modal="true"

          aria-label=
            "Démonstration Sentinel"

          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDemo();
            }
          }}

          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            p-3
            sm:p-6
            bg-black/85
            backdrop-blur-md
          "
        >
          <div
            className={
              theme === "glass"
                ? `
                  w-full
                  max-w-4xl
                  max-h-[92vh]
                  overflow-hidden
                  rounded-3xl
                  glass-card
                  text-white
                  shadow-2xl
                  border
                  border-white/10
                `
                : `
                  w-full
                  max-w-4xl
                  max-h-[92vh]
                  overflow-hidden
                  rounded
                  panel-tactical
                  text-white
                  border
                  border-tactical-border
                  shadow-2xl
                  font-mono
                `
            }
          >
            <div
              className={
                theme === "glass"
                  ? `
                    px-5
                    sm:px-6
                    py-4
                    flex
                    items-center
                    justify-between
                    gap-4
                    border-b
                    border-white/10
                  `
                  : `
                    px-5
                    py-4
                    flex
                    items-center
                    justify-between
                    gap-4
                    border-b
                    border-tactical-border
                    bg-black/40
                  `
              }
            >
              <div
                className="
                  flex
                  items-center
                  gap-3
                  min-w-0
                "
              >
                <span
                  className="
                    relative
                    flex
                    h-2.5
                    w-2.5
                    flex-shrink-0
                  "
                >
                  <span
                    className="
                      absolute
                      inline-flex
                      h-full
                      w-full
                      rounded-full
                      bg-emerald-400
                      opacity-60
                      animate-ping
                    "
                  />

                  <span
                    className="
                      relative
                      inline-flex
                      h-2.5
                      w-2.5
                      rounded-full
                      bg-emerald-500
                    "
                  />
                </span>


                <div
                  className="
                    min-w-0
                  "
                >
                  <h2
                    className={
                      theme === "glass"
                        ? `
                          text-sm
                          sm:text-base
                          font-semibold
                          tracking-tight
                        `
                        : `
                          text-xs
                          sm:text-sm
                          font-bold
                          tracking-wider
                          uppercase
                          text-emerald-400
                        `
                    }
                  >
                    Découvrir Sentinel
                  </h2>


                  <p
                    className={
                      theme === "glass"
                        ? `
                          text-[10px]
                          sm:text-xs
                          text-muted
                          mt-0.5
                        `
                        : `
                          text-[9px]
                          sm:text-[10px]
                          text-slate-500
                          mt-0.5
                        `
                    }
                  >
                    Guide rapide d'utilisation
                  </p>
                </div>
              </div>


              <button
                type="button"

                onClick={
                  closeDemo
                }

                aria-label=
                  "Fermer la démonstration"

                className={
                  theme === "glass"
                    ? `
                      w-9
                      h-9
                      rounded-full
                      flex
                      items-center
                      justify-center
                      bg-white/5
                      hover:bg-white/10
                      text-white/70
                      hover:text-white
                      transition-all
                      flex-shrink-0
                    `
                    : `
                      w-8
                      h-8
                      rounded
                      flex
                      items-center
                      justify-center
                      border
                      border-tactical-border
                      bg-black/40
                      text-slate-400
                      hover:text-emerald-400
                      hover:border-emerald-500/40
                      transition-all
                      flex-shrink-0
                    `
                }
              >
                ✕
              </button>
            </div>


            <div
              className="
                relative
                bg-black
                aspect-video
                w-full
              "
            >
              <video
                src={
                  DEMO_VIDEO_URL
                }

                controls

                playsInline

                preload="metadata"

                className="
                  w-full
                  h-full
                  object-contain
                  bg-black
                "
              >
                Votre navigateur ne
                prend pas en charge
                cette vidéo.
              </video>
            </div>


            <div
              className={
                theme === "glass"
                  ? `
                    px-5
                    sm:px-6
                    py-4
                    flex
                    flex-col
                    sm:flex-row
                    items-start
                    sm:items-center
                    justify-between
                    gap-3
                    border-t
                    border-white/10
                    bg-white/[0.02]
                  `
                  : `
                    px-5
                    py-4
                    flex
                    flex-col
                    sm:flex-row
                    items-start
                    sm:items-center
                    justify-between
                    gap-3
                    border-t
                    border-tactical-border
                    bg-black/30
                  `
              }
            >
              <div>
                <p
                  className={
                    theme === "glass"
                      ? `
                        text-xs
                        font-medium
                        text-white/80
                      `
                      : `
                        text-[10px]
                        font-bold
                        text-emerald-400/80
                        uppercase
                      `
                  }
                >
                  Sentinel Demo
                </p>


                <p
                  className={
                    theme === "glass"
                      ? `
                        text-[10px]
                        text-muted
                        mt-0.5
                      `
                      : `
                        text-[9px]
                        text-slate-600
                        mt-0.5
                      `
                  }
                >
                  Découvrez l'appairage,
                  le streaming et les
                  principales commandes.
                </p>
              </div>


              <button
                type="button"

                onClick={
                  closeDemo
                }

                className={
                  theme === "glass"
                    ? `
                      px-5
                      py-2
                      rounded-full
                      btn-solid
                      text-xs
                      font-medium
                      transition-transform
                      active:scale-95
                    `
                    : `
                      px-4
                      py-2
                      rounded
                      bg-emerald-600
                      hover:bg-emerald-500
                      text-black
                      text-[10px]
                      font-bold
                      uppercase
                      transition-all
                      active:scale-95
                    `
                }
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default MainLayout;