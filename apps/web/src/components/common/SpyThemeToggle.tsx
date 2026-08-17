import {
  useTheme,
} from "../../contexts/ThemeContext";


function SpyThemeToggle() {
  const {
    theme,
    toggleTheme,
  } = useTheme();


  const tactical =
    theme === "tactical";


  return (
    <button
      type="button"

      title="Basculer de thème Espion"

      onClick={
        toggleTheme
      }

      className={
        tactical
          ? "fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-black shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 group"
          : "fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white hover:text-black shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 group"
      }
    >
      <svg
        className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12"

        fill="currentColor"

        viewBox="0 0 24 24"
      >
        <path
          d="M12 2C11.45 2 11 2.45 11 3V4H6C5.45 4 5 4.45 5 5V6H19V5C19 4.45 18.55 4 18 4H13V3C13 2.45 12.55 2 12 2ZM2 8V9C2 9.55 2.45 10 3 10H21C21.55 10 22 9.55 22 9V8H2ZM6.5 12C4.57 12 3 13.57 3 15.5C3 17.43 4.57 19 6.5 19C8.43 19 10 17.43 10 15.5C10 13.57 8.43 12 6.5 12ZM17.5 12C15.57 12 14 13.57 14 15.5C14 17.43 15.57 19 17.5 19C19.43 19 21 17.43 21 15.5C21 13.57 19.43 12 17.5 12ZM6.5 14C7.33 14 8 14.67 8 15.5C8 16.33 7.33 17 6.5 17C5.67 17 5 16.33 5 15.5C5 14.67 5.67 14 6.5 14ZM17.5 14C18.33 14 19 14.67 19 15.5C19 16.33 18.33 17 17.5 17C16.67 17 16 16.33 16 15.5C16 14.67 16.67 14 17.5 14ZM11 15H13V16H11V15Z"
        />
      </svg>
    </button>
  );
}


export default SpyThemeToggle;