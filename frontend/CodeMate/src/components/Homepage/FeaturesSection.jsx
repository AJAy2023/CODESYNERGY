// src/components/Homepage/FeaturesSection.jsx
import React, { Suspense, lazy, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Button } from "../ui/button";
import { Play } from "lucide-react";  
import { Card, CardContent } from "../ui/card";

// Lazy-load Lottie library (bundle split)
const Lottie = lazy(() => import("lottie-react"));

/**
 * LottieWrapper:
 * - Fetches the JSON animation from the public folder (e.g. "/media/live-discussion.json")
 * - Shows a small loading placeholder until JSON is fetched
 * - Renders the lazy-loaded <Lottie /> when both code and data are ready
 */
function LottieWrapper({ src, className, loop = true, autoplay = true, ariaLabel }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(src);
        if (!res.ok) {
          console.error("Lottie JSON not found:", src);
          return;
        }
        const json = await res.json();
        if (mounted) setData(json);
      } catch (err) {
        console.error("Failed to load Lottie JSON:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [src]);

  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        Loading animation...
      </div>
    );
  }

  return (
    <Lottie
      animationData={data}
      loop={loop}
      autoplay={autoplay}
      className={className}
      aria-label={ariaLabel}
    />
  );
}

const features = [
  {
    title: "Real-Time Coding Battles",
    description:
      "Challenge friends or random opponents in live, time-bound coding battles. Compete, learn, and grow your skills in an interactive environment.",
    mediaType: "video",
    src: "/media/coding-battle.mp4",
  },
  {
    title: "Live Discussion Rooms",
    description:
      "Collaborate in real-time with voice chat, shared editors, and instant code previews. Perfect for brainstorming and debugging together.",
    mediaType: "video",
    src: "/media/live-discussion.mp4",
  },
  {
    title: "AI-Powered Hints & Feedback",
    description:
      "Get instant AI assistance, tips, and code reviews to improve your solutions and boost your learning curve.",
    mediaType: "image",
    src: "/media/ai-feedback.jpg",
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="w-full bg-gradient-to-b from-[#0f172a] to-[#1e293b] py-20 px-6 sm:px-10"
    >
      <div className="max-w-7xl mx-auto">
        <motion.h2
          className="text-4xl md:text-5xl font-bold text-white text-center font-satoshi"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          Everything You Need for Competitive Coding
        </motion.h2>

        <motion.p
          className="text-lg text-gray-300 text-center mt-4 max-w-2xl mx-auto font-inter"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          From real-time battles to AI-assisted learning, our platform gives you
          the tools to master coding while having fun.
        </motion.p>

        <div className="mt-16 grid gap-12 md:grid-cols-3">
          {features.map((feature, idx) => (
            <FeatureCard key={idx} {...feature} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ title, description, mediaType, src, index }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <motion.div
      ref={ref}
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.6,
        delay: index * 0.15,
        ease: "easeOut",
      }}
    >
      <Card className="bg-[#1e293b] border-none shadow-lg rounded-2xl overflow-hidden w-full h-full hover:scale-[1.02] transition-transform duration-300">
        <CardContent className="p-6 flex flex-col items-center text-center">
          <div className="w-full h-56 mb-6 flex items-center justify-center">
            {mediaType === "video" && (
              <video
                src={src}
                className="w-full h-full object-cover rounded-lg"
                autoPlay
                muted
                loop
                playsInline
                loading="lazy"
                aria-label={`${title} demo video`}
              />
            )}

            {mediaType === "lottie" && (
              <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-gray-400">Loading animation...</div>}>
                <LottieWrapper src={src} className="w-full h-full" ariaLabel={`${title} animation`} />
              </Suspense>
            )}

            {mediaType === "image" && (
              <img
                src={src}
                alt={title}
                loading="lazy"
                className="w-full h-full object-cover rounded-lg"
              />
            )}
          </div>

          <h3 className="text-xl font-semibold text-white font-satoshi">
            {title}
          </h3>
          <p className="text-gray-400 mt-3 font-inter">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
