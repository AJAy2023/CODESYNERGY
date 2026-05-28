// src/pages/Signup.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../api/config";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!username || !email || !password) {
      return setError("Please fill in all fields.");
    }

    try {
      await axios.post(`${BASE_URL}/register`, {
        username,
        email,
        password,
      });

      alert("Registered successfully! You've earned 10 bonus coins. Please login to continue.");
      navigate("/login");
    } catch (err) {
      console.error("Signup error:", err?.response?.data);
      setError(err?.response?.data?.msg || "Signup failed. Please try again.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-[#0b1220] via-[#111827] to-black px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-md p-8 rounded-2xl shadow-2xl backdrop-blur-xl bg-white/5 border border-white/10"
        >
          <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-transparent bg-clip-text">
            Join BuddyCode
          </h2>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm mb-4 text-center"
            >
              {error}
            </motion.p>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <motion.input
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]"
              required
            />

            <motion.input
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]"
              required
            />

            <motion.input
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
              required
            />

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2 }}
              type="submit"
              className="w-full bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] hover:opacity-90 text-white p-3 rounded-lg font-medium shadow-lg cursor-pointer"
            >
              Sign Up
            </motion.button>
          </form>

          <div className="mt-6 text-sm text-gray-400 text-center">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#06b6d4] hover:text-[#7c3aed] transition-colors"
            >
              Log in
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
