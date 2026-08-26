import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../contexts/AuthContext";

import {
  useTheme,
} from "../../contexts/ThemeContext";

import {
  logout,
} from "../../services/auth";


type NavbarProps = {
  onDemoClick:
    () => void;
};


function Navbar({
  onDemoClick,
}: NavbarProps) {
  const {
    theme,
  } = useTheme();


  const {
    user,
    clearUser,
  } = useAuth();


  const navigate =
    useNavigate();


  async function handleLogout() {
    try {
      await logout();


      clearUser();


      navigate(
        "/login"
      );

    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );


      window.alert(
        error instanceof Error
          ? error.message
          : "Logout failed."
      );
    }
  }


  if (
    theme === "glass"
  ) {
    return (
      <header
        className="
          sticky
          top-3
          sm:top-5
          z-40
          max-w-5xl
          w-[95%]
          sm:w-[94%]
          mx-auto
          my-2
          sm:my-3
        "
      >
        <div
          className="
            glass-nav
            rounded-2xl
            sm:rounded-full
            px-3
            sm:px-5
            py-2.5
            sm:py-3
            flex
            flex-col
            lg:flex-row
            items-center
            justify-between
            gap-2.5
            sm:gap-3
            shadow-sm
          "
        >
          {/* =================================================
              LOGO + DEMO MOBILE
          ================================================= */}

          <div
            className="
              flex
              items-center
              justify-between
              w-full
              lg:w-auto
              gap-3
            "
          >
            <div
              className="
                flex
                items-center
                gap-2.5
                flex-shrink-0
              "
            >
              <div
                className="
                  w-7
                  h-7
                  rounded-full
                  btn-solid
                  flex
                  items-center
                  justify-center
                  text-xs
                  font-semibold
                "
              >
                S
              </div>


              <span
                className="
                  text-sm
                  font-semibold
                  tracking-tight
                "
              >
                Sentinel
              </span>
            </div>


            <button
              type="button"

              onClick={
                onDemoClick
              }

              className="
                lg:hidden
                flex
                items-center
                gap-1.5
                px-3
                py-1.5
                rounded-full
                bg-blue-600
                hover:bg-blue-500
                text-white
                text-[11px]
                font-semibold
                shadow-md
                transition-all
                active:scale-95
              "
            >
              <span
                className="
                  relative
                  flex
                  h-1.5
                  w-1.5
                "
              >
                <span
                  className="
                    absolute
                    inline-flex
                    h-full
                    w-full
                    rounded-full
                    bg-white
                    opacity-50
                    animate-ping
                  "
                />

                <span
                  className="
                    relative
                    inline-flex
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-white
                  "
                />
              </span>


              <PlayIcon />


              Démo
            </button>
          </div>


          {/* =================================================
              NAVIGATION
          ================================================= */}

          <nav
            className="
              flex
              items-center
              gap-1
              bg-white/5
              p-1
              rounded-full
              text-xs
              font-medium
              w-full
              lg:w-auto
              overflow-x-auto
              no-scrollbar
            "
          >
            {user && (
              <>
                <GlassNav
                  to="/dashboard"
                  label="Dashboard"
                />

                <GlassNav
                  to="/emitter"
                  label="Émetteur"
                />

                <GlassNav
                  to="/pair-device"
                  label="Appairer"
                />
              </>
            )}


            {!user && (
              <GlassNav
                to="/login"
                label="Connexion"
              />
            )}
          </nav>


          {/* =================================================
              RIGHT SIDE
          ================================================= */}

          <div
            className="
              flex
              items-center
              justify-between
              lg:justify-end
              gap-2
              w-full
              lg:w-auto
              flex-wrap
            "
          >
            {/* DEMO DESKTOP */}

            <button
              type="button"

              onClick={
                onDemoClick
              }

              className="
                hidden
                lg:flex
                group
                items-center
                gap-2
                px-3.5
                py-1.5
                rounded-full
                bg-blue-600
                hover:bg-blue-500
                text-white
                text-[11px]
                font-semibold
                shadow-md
                transition-all
                duration-200
                hover:scale-[1.04]
                active:scale-95
              "
            >
              <span
                className="
                  relative
                  flex
                  h-2
                  w-2
                "
              >
                <span
                  className="
                    absolute
                    inline-flex
                    h-full
                    w-full
                    rounded-full
                    bg-white
                    opacity-50
                    animate-ping
                  "
                />

                <span
                  className="
                    relative
                    inline-flex
                    h-2
                    w-2
                    rounded-full
                    bg-white
                  "
                />
              </span>


              <span
                className="
                  transition-transform
                  group-hover:scale-110
                "
              >
                <PlayIcon />
              </span>


              Voir la démo
            </button>


            {/* UTILISATEUR CONNECTÉ */}

            {user && (
              <>
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    px-3
                    py-1.5
                    rounded-full
                    bg-white/5
                    border
                    border-white/10
                    text-xs
                  "
                >
                  <span
                    className="
                      relative
                      flex
                      h-2
                      w-2
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
                        h-2
                        w-2
                        rounded-full
                        bg-emerald-400
                      "
                    />
                  </span>


                  <span
                    className="
                      text-muted
                    "
                  >
                    Connecté :
                  </span>


                  <span
                    className="
                      text-white
                      font-medium
                    "
                  >
                    {user.username}
                  </span>
                </div>


                <button
                  type="button"

                  onClick={
                    handleLogout
                  }

                  className="
                    px-3
                    py-1.5
                    rounded-full
                    bg-red-500/10
                    hover:bg-red-500/20
                    border
                    border-red-500/20
                    text-xs
                    text-red-400
                    hover:text-red-300
                    transition-all
                  "
                >
                  Déconnexion
                </button>
              </>
            )}


            {/* UTILISATEUR NON CONNECTÉ */}

            {!user && (
              <button
                type="button"

                onClick={() =>
                  navigate(
                    "/login"
                  )
                }

                className="
                  px-4
                  py-1.5
                  rounded-full
                  btn-solid
                  text-xs
                  font-medium
                  transition-all
                  hover:scale-[1.02]
                  active:scale-95
                "
              >
                Connexion
              </button>
            )}
          </div>
        </div>
      </header>
    );
  }


  /*
   * =====================================================
   * TACTICAL THEME
   * =====================================================
   */

  return (
    <header
      className="
        sticky
        top-0
        z-40
        w-full
        px-4
        sm:px-6
        py-3
        panel-tactical
        border-b
        border-tactical-border
      "
    >
      <div
        className="
          max-w-7xl
          mx-auto
          flex
          flex-col
          lg:flex-row
          items-center
          justify-between
          gap-3
        "
      >
        {/* =================================================
            LOGO + DEMO MOBILE
        ================================================= */}

        <div
          className="
            flex
            items-center
            justify-between
            w-full
            lg:w-auto
            gap-3
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
              flex-shrink-0
            "
          >
            <div
              className="
                w-8
                h-8
                rounded
                bg-emerald-950/80
                border
                border-emerald-500/50
                flex
                items-center
                justify-center
                text-emerald-400
                font-mono
                text-xs
                font-bold
                hud-line
              "
            >
              SYS
            </div>


            <div>
              <span
                className="
                  text-sm
                  sm:text-base
                  font-bold
                  tracking-widest
                  text-white
                  font-mono
                  uppercase
                "
              >
                SENTINEL // OPS
              </span>


              <span
                className="
                  hidden
                  xl:inline-block
                  text-[10px]
                  font-mono
                  text-emerald-500/80
                  ml-2
                "
              >
                v2.4.0_SECURE
              </span>
            </div>
          </div>


          <button
            type="button"

            onClick={
              onDemoClick
            }

            className="
              lg:hidden
              flex
              items-center
              gap-1.5
              px-3
              py-1.5
              rounded
              border
              border-emerald-400/50
              bg-emerald-500
              text-black
              font-mono
              text-[10px]
              font-bold
              shadow-lg
              transition-all
              active:scale-95
            "
          >
            <span
              className="
                relative
                flex
                h-1.5
                w-1.5
              "
            >
              <span
                className="
                  absolute
                  inline-flex
                  h-full
                  w-full
                  rounded-full
                  bg-black
                  opacity-50
                  animate-ping
                "
              />

              <span
                className="
                  relative
                  inline-flex
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-black
                "
              />
            </span>


            <PlayIcon />


            DÉMO
          </button>
        </div>


        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav
          className="
            flex
            items-center
            gap-1
            bg-tactical-800
            p-1
            rounded
            border
            border-tactical-border
            font-mono
            text-xs
            overflow-x-auto
            no-scrollbar
            w-full
            lg:w-auto
          "
        >
          {user && (
            <>
              <TacticalNav
                to="/dashboard"
                label="01. DASHBOARD"
              />

              <TacticalNav
                to="/emitter"
                label="02. ÉMETTEUR"
              />

              <TacticalNav
                to="/pair-device"
                label="03. APPAIRAGE"
              />
            </>
          )}


          {!user && (
            <TacticalNav
              to="/login"
              label="04. LOGIN"
            />
          )}
        </nav>


        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <div
          className="
            flex
            items-center
            justify-between
            lg:justify-end
            gap-2
            w-full
            lg:w-auto
            flex-wrap
          "
        >
          {/* DEMO DESKTOP */}

          <button
            type="button"

            onClick={
              onDemoClick
            }

            className="
              hidden
              lg:flex
              group
              items-center
              gap-2
              px-3.5
              py-1.5
              rounded
              bg-emerald-500
              hover:bg-emerald-400
              border
              border-emerald-300/40
              text-black
              font-mono
              text-[10px]
              font-black
              shadow-lg
              shadow-emerald-500/10
              transition-all
              duration-200
              hover:scale-[1.04]
              active:scale-95
            "
          >
            <span
              className="
                relative
                flex
                h-2
                w-2
              "
            >
              <span
                className="
                  absolute
                  inline-flex
                  h-full
                  w-full
                  rounded-full
                  bg-black
                  opacity-40
                  animate-ping
                "
              />

              <span
                className="
                  relative
                  inline-flex
                  h-2
                  w-2
                  rounded-full
                  bg-black
                "
              />
            </span>


            <span
              className="
                transition-transform
                group-hover:scale-110
              "
            >
              <PlayIcon />
            </span>


            VOIR LA DÉMO
          </button>


          {/* CONNECTÉ */}

          {user && (
            <>
              <div
                className="
                  flex
                  items-center
                  gap-2
                  px-2.5
                  py-1.5
                  rounded
                  bg-emerald-950/40
                  border
                  border-emerald-500/30
                  text-xs
                  font-mono
                "
              >
                <span
                  className="
                    w-2
                    h-2
                    rounded-full
                    bg-emerald-400
                    animate-pulse
                  "
                />


                <span
                  className="
                    text-slate-500
                  "
                >
                  USER:
                </span>


                <span
                  className="
                    text-emerald-400
                    font-bold
                  "
                >
                  {user.username}
                </span>
              </div>


              <button
                type="button"

                onClick={
                  handleLogout
                }

                className="
                  px-3
                  py-1.5
                  rounded
                  border
                  border-red-500/30
                  bg-red-950/20
                  text-red-400
                  font-mono
                  text-[10px]
                  font-bold
                  hover:bg-red-950/40
                  transition-colors
                "
              >
                LOGOUT
              </button>
            </>
          )}


          {/* NON CONNECTÉ */}

          {!user && (
            <button
              type="button"

              onClick={() =>
                navigate(
                  "/login"
                )
              }

              className="
                px-4
                py-1.5
                rounded
                bg-emerald-600
                hover:bg-emerald-500
                text-black
                font-mono
                text-[10px]
                font-bold
                uppercase
                transition-all
                active:scale-95
              "
            >
              LOGIN
            </button>
          )}
        </div>
      </div>
    </header>
  );
}


function TacticalNav({
  to,
  label,
}: {
  to: string;
  label: string;
}) {
  return (
    <NavLink
      to={
        to
      }

      className={({
        isActive,
      }) =>
        isActive
          ? `
            px-3
            py-1.5
            rounded
            transition-all
            text-emerald-400
            bg-emerald-950/60
            border
            border-emerald-500/40
            whitespace-nowrap
          `
          : `
            px-3
            py-1.5
            rounded
            transition-all
            text-slate-400
            hover:text-white
            whitespace-nowrap
          `
      }
    >
      {label}
    </NavLink>
  );
}


function GlassNav({
  to,
  label,
}: {
  to: string;
  label: string;
}) {
  return (
    <NavLink
      to={
        to
      }

      className={({
        isActive,
      }) =>
        isActive
          ? `
            px-3.5
            py-1.5
            rounded-full
            transition-all
            btn-solid
            shadow-sm
            whitespace-nowrap
          `
          : `
            px-3.5
            py-1.5
            rounded-full
            transition-all
            text-muted
            hover:text-current
            whitespace-nowrap
          `
      }
    >
      {label}
    </NavLink>
  );
}


function PlayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"

      aria-hidden="true"

      className="
        w-3.5
        h-3.5
        fill-current
        flex-shrink-0
      "
    >
      <path
        d="
          M8 5
          v14
          l11-7
          z
        "
      />
    </svg>
  );
}


export default Navbar;