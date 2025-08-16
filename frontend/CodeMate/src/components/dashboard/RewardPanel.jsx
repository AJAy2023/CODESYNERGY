// src/components/dashboard/RewardPanel.jsx
import React from "react";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import rewardAnimation from "../../assets/reward.json"; // same as used earlier

export default function RewardPanel({ onClaim }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/4 backdrop-blur-lg p-4 rounded-xl border border-white/6 flex items-center gap-4 justify-between"
    >
      <div className="flex items-center gap-4">
        <div className="w-20 h-20">
          <Lottie animationData={rewardAnimation} loop={true} />
        </div>
        <div>
          <div className="text-lg font-semibold">Daily Reward</div>
          <div className="text-sm text-slate-300">Claim your daily coins and keep your streak.</div>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => onClaim ? onClaim() : alert("🎉 Claimed!")}
        className="px-4 py-2 rounded-md font-semibold"
        style={{
          background: "linear-gradient(90deg,#f6c85f,#ffd54a)",
          color: "#0b0b0b",
          boxShadow: "0 10px 30px rgba(255,210,80,0.16)",
        }}
      >
        Claim
      </motion.button>
    </motion.div>
  );
}
