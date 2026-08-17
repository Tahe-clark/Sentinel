import {
  NavLink,
} from "react-router-dom";

import {
  useTheme,
} from "../../contexts/ThemeContext";


function Navbar() {
  const {
    theme,
  } = useTheme();


  if (
    theme === "glass"
  ) {
    return (
      <header
        className="
          sticky
          top-5
          z-40
          max-w-4xl
          w-[92%]
          mx-auto
          my-3
        "
      >
        <div
          className="
            glass-nav
            rounded-full
            px-5
            py-3
            flex
            items-center
            justify-between
            gap-3
            shadow-sm
          "
        >
          <div
            className="
              flex
              items-center
              gap-2.5
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
            "
          >
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

            <GlassNav
              to="/login"
              label="Connexion"
            />
          </nav>
        </div>
      </header>
    );
  }


  return (
    <header
      className="
        sticky
        top-0
        z-40
        w-full
        px-6
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
          items-center
          justify-between
          gap-4
        "
      >
        <div
          className="
            flex
            items-center
            gap-3
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
                text-base
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
                sm:inline-block
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
          "
        >
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

          <TacticalNav
            to="/login"
            label="04. LOGIN"
          />
        </nav>


        <div
          className="
            hidden
            md:flex
            items-center
            gap-2
            px-2.5
            py-1
            rounded
            bg-emerald-950/40
            border
            border-emerald-500/30
            text-emerald-400
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

          FLUX EN DIRECT
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
      to={to}

      className={({ isActive }) =>
        isActive
          ? "px-3 py-1.5 rounded transition-all text-emerald-400 bg-emerald-950/60 border border-emerald-500/40"
          : "px-3 py-1.5 rounded transition-all text-slate-400 hover:text-white"
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
      to={to}

      className={({ isActive }) =>
        isActive
          ? "px-3.5 py-1.5 rounded-full transition-all btn-solid shadow-sm"
          : "px-3.5 py-1.5 rounded-full transition-all text-muted hover:text-current"
      }
    >
      {label}
    </NavLink>
  );
}


export default Navbar;