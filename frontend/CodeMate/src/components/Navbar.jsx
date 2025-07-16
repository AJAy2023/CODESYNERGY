import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

function Navbar() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <nav className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-gray-900 dark:to-gray-800 transition-all duration-500 text-white py-4 px-6 flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold tracking-wider hover:scale-105 transition duration-300">
        CodeMate
      </Link>
      <div className="flex items-center gap-4">
        <Link
          to="/login"
          className="px-4 py-2 rounded-md border border-white hover:bg-white hover:text-black transition duration-300"
        >
          Login
        </Link>
        <Link
          to="/register"
          className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 transition duration-300"
        >
          Sign Up
        </Link>
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="text-white hover:text-yellow-300 transition cursor-pointer p-2 rounded-full bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          aria-label="Toggle Theme"
        >
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
