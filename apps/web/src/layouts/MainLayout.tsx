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


function MainLayout() {
  const {
    theme,
  } = useTheme();


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


      <Navbar />


      <main
        className={
          theme === "tactical"
            ? "flex-1 max-w-7xl w-full mx-auto px-6 py-6"
            : "flex-1 max-w-4xl w-[92%] mx-auto py-8"
        }
      >
        <Outlet />
      </main>


      <SpyThemeToggle />
    </div>
  );
}


export default MainLayout;