// src/pages/ForgotPassword.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../api/config";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import { Eye, EyeOff, KeyRound, Mail, ShieldCheck, ArrowLeft, RefreshCw } from "lucide-react";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify OTP, 3: Reset Password
  const [email, setEmail] = useState("");
  const [userOtp, setUserOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();

  // Timer countdown handler
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!email) {
      return setError("Please enter your registered email.");
    }

    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/forget-password`, { email });
      if (res.data.success) {
        setSuccessMsg(res.data.message || "OTP sent successfully to your email!");
        setStep(2);
        setResendTimer(60);
      } else {
        setError(res.data.message || "Failed to send OTP.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "User not found or server error.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!userOtp || userOtp.length < 4) {
      return setError("Please enter a valid OTP.");
    }

    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/verifyOtp`, { email, userOtp });
      if (res.data.success && res.data.resetToken) {
        setResetToken(res.data.resetToken);
        setSuccessMsg("OTP verified! Now create your new password.");
        setStep(3);
      } else {
        setError(res.data.message || "Invalid or expired OTP.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError("");
    setSuccessMsg("");

    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/forget-password`, { email });
      if (res.data.success) {
        setSuccessMsg("A new OTP has been sent to your email.");
        setResendTimer(60);
      } else {
        setError(res.data.message || "Failed to resend OTP.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Server error while resending OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!newPassword || !confirmPassword) {
      return setError("Please enter and confirm your new password.");
    }

    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/reset-password`, {
        email,
        newPassword,
        confirmPassword,
        resetToken,
      });

      if (res.data.success) {
        setSuccessMsg("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 1800);
      } else {
        setError(res.data.message || "Failed to reset password.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid token or reset request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-[#0b1220] via-[#111827] to-black px-4 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md p-8 rounded-2xl shadow-2xl backdrop-blur-xl bg-white/5 border border-white/10"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[#06b6d4] mb-3">
              {step === 1 && <Mail size={28} />}
              {step === 2 && <ShieldCheck size={28} />}
              {step === 3 && <KeyRound size={28} />}
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-transparent bg-clip-text">
              {step === 1 && "Forgot Password?"}
              {step === 2 && "Enter OTP Code"}
              {step === 3 && "Reset Password"}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {step === 1 && "Enter your email address to receive an OTP."}
              {step === 2 && `We sent a verification code to ${email}`}
              {step === 3 && "Create a new strong password for your account."}
            </p>
          </div>

          {/* Feedback Alerts */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center font-medium"
              >
                {error}
              </motion.div>
            )}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center font-medium"
              >
                {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 pl-10 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]"
                    required
                  />
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] hover:opacity-90 text-white p-3 rounded-lg font-medium shadow-lg cursor-pointer disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </motion.button>
            </form>
          )}

          {/* STEP 2: Verify OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">6-Digit OTP</label>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  maxLength={6}
                  value={userOtp}
                  onChange={(e) => setUserOtp(e.target.value)}
                  className="w-full p-3 text-center tracking-widest text-xl font-mono rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]"
                  required
                />
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Change Email
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || loading}
                  className="text-cyan-400 hover:text-cyan-300 disabled:text-gray-500 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                </button>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] hover:opacity-90 text-white p-3 rounded-lg font-medium shadow-lg cursor-pointer disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </motion.button>
            </form>
          )}

          {/* STEP 3: Reset Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 pr-12 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 pr-12 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] hover:opacity-90 text-white p-3 rounded-lg font-medium shadow-lg cursor-pointer disabled:opacity-50"
              >
                {loading ? "Resetting Password..." : "Set New Password"}
              </motion.button>
            </form>
          )}

          {/* Footer Back link */}
          <div className="mt-6 text-center text-sm text-gray-400">
            Remembered your password?{" "}
            <Link to="/login" className="text-[#06b6d4] hover:text-[#7c3aed] transition-colors font-medium">
              Log In
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
