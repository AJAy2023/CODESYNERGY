import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center text-white overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F0F0F] to-[#1F1F1F] z-0" />
      <div className="relative z-10 text-center px-4 max-w-3xl">
        <motion.h1
          className="text-4xl md:text-6xl font-extrabold leading-tight mb-4"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          Code Together. <br />
          Compete Smarter. <br />
          <span className="text-[#66E2DC]">CodeSynergy</span> Awaits!
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-gray-300 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          The real-time, AI-powered platform for coding battles, collaboration,
          and competitive growth.
        </motion.p>

        <motion.button
          className="bg-[#66E2DC] text-black font-semibold px-6 py-3 rounded-xl hover:bg-white hover:text-black transition duration-300"
          whileHover={{ scale: 1.05 }}
        >
          Get Started
        </motion.button>
      </div>
    </section>
  );
};

export default HeroSection;
