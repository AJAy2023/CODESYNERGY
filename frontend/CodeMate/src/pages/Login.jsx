// Updated Login.jsx with gamification logic
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../api/config";
import { motion } from "framer-motion";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const res = await axios.post(`${BASE_URL}/login`, { email, password });

    const token = res.data.token;
    const userId = res.data.user.id; // ✅ Extract correct user ID

    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId); // ✅ Fixed this line

    // (Optional) store full user data if needed later
    localStorage.setItem("userData", JSON.stringify(res.data.user));

    navigate("/dashboard");
  } catch (err) {
    setError("Invalid credentials or server error.");
  }
};


  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-indigo-900 to-black text-white">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        <h2 className="text-3xl font-bold mb-6 text-center">Welcome Back</h2>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-gray-800 text-white"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-gray-800 text-white"
          required
        />
        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-500 text-white p-3 rounded cursor-pointer"
        >
          Log In
        </button>
        <div className="mt-4 flex justify-between text-sm text-gray-400">
          <Link to="#">Forgot Password?</Link>
          <span>
            New account?{" "}
            <Link to="/register" className="text-purple-400 hover:none">
              Sign up
            </Link>
          </span>
        </div>
      </motion.form>
    </div>
  );
}

export default Login;
