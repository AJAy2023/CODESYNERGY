// src/components/homepage/LiveCodingShowcase.jsx
import { motion } from "framer-motion";

export default function LiveCodingShowcase() {
  return (
    <section className="py-20 px-4 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto text-center">
        <motion.h2 
          className="text-4xl font-bold text-white mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Live Collaborative Coding Arena
        </motion.h2>
        <p className="text-gray-400 mb-8">
          Compete or collaborate in real-time with your friends on DSA problems
        </p>
        <div className="rounded-xl overflow-hidden border border-[#3f3f3f]">
          <img
            src="/assets/live-coding-demo.gif"
            alt="Live Coding Preview"
            className="w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}