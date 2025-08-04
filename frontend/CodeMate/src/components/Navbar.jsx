import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="bg-[#0F0F0F] text-white px-6 py-4 shadow-md fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-[#66E2DC]">
          CodeMate
        </Link>

        <div className="hidden md:flex items-center space-x-6">
          <Link to="/" className="hover:text-[#66E2DC] transition">
            Home  
          </Link>
          <Link to="/battle" className="hover:text-[#66E2DC] transition">
            Battle
          </Link>
          <Link to="/problems" className="hover:text-[#66E2DC] transition">
            Problems
          </Link>
          <Link to="/collab" className="hover:text-[#66E2DC] transition">
            Collab
          </Link>
          <Link
            to="/login"
            className="bg-[#66E2DC] text-black px-4 py-2 rounded-xl hover:bg-white transition"
          >
            Login / Signup
          </Link>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden">
          <button onClick={toggleMenu}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden mt-2 px-4 space-y-3">
          <Link to="/" className="block">
            Home
          </Link>
          <Link to="/battle" className="block">
            Battle
          </Link>
          <Link to="/problems" className="block">
            Problems
          </Link>
          <Link to="/collab" className="block">
            Collab
          </Link>
          <Link
            to="/login"
            className="inline-block bg-[#66E2DC] text-black px-4 py-2 rounded-xl"
          >
            Login / Signup
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
