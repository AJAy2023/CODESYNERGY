// src/components/homepage/AIChatAssistant.jsx
import { motion } from "framer-motion";
import { Bot } from "lucide-react";

export default function AIChatAssistant() {
  return (
    <section className="py-24 px-4 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Your 24x7 AI Coding Assistant
          </h3>
          <p className="text-gray-400">
            Get real-time hints, feedback, and debugging help from our AI bot during battles.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-[#111111] border border-[#333] p-6 rounded-xl shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <Bot className="text-purple-400 w-6 h-6" />
            <p className="text-white font-semibold">AI Bot:</p>
          </div>
          <div className="bg-[#1a1a1a] text-sm text-white p-4 rounded-lg border border-[#2e2e2e]">
            "You forgot to close your loop — check line 14. Need help fixing it?"
          </div>
        </motion.div>
      </div>
    </section>
  );
}