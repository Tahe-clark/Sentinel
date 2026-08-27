import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";


export type SentinelTheme =
  | "tactical"
  | "glass";


interface ThemeContextValue {
  theme: SentinelTheme;

  toggleTheme:
    () => void;
}


const ThemeContext =
  createContext<
    ThemeContextValue | undefined
  >(
    undefined
  );


interface ThemeProviderProps {
  children: ReactNode;
}


export function ThemeProvider({
  children,
}: ThemeProviderProps) {

  const [theme, setTheme] =
    useState<SentinelTheme>(() => {

      const saved =
        localStorage.getItem(
          "sentinel_theme"
        );


      /*
       * Si l'utilisateur a déjà choisi
       * un thème, on conserve son choix.
       */
      if (
        saved === "glass" ||
        saved === "tactical"
      ) {
        return saved;
      }


      /*
       * Nouveau visiteur :
       * le thème Glass / Apple devient
       * le thème par défaut.
       */
      return "glass";
    });


  useEffect(() => {
    localStorage.setItem(
      "sentinel_theme",
      theme
    );


    document.documentElement
      .setAttribute(
        "data-theme",
        "dark"
      );


    if (
      theme === "tactical"
    ) {
      document.body.className =
        "theme-tactical-body font-sans antialiased min-h-screen flex flex-col relative selection:bg-emerald-500 selection:text-black";

    } else {
      document.body.className =
        "theme-glass-body font-sans antialiased min-h-screen flex flex-col relative selection:bg-blue-500 selection:text-white";
    }

  }, [
    theme,
  ]);


  function toggleTheme() {
    setTheme(
      (
        current
      ) =>
        current ===
          "tactical"
          ? "glass"
          : "tactical"
    );
  }


  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}


export function useTheme() {
  const context =
    useContext(
      ThemeContext
    );


  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider."
    );
  }


  return context;
}