// src/components/Homepage/UpcomingFeatures.jsx
import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import VanillaTilt from "vanilla-tilt";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  Bot,
  Globe2,
  ChartBar,
  MessageSquare,
  Target,
} from "lucide-react";

// Upcoming features list
const UPCOMING = [
  {
    title: "AI Buddy (Chat + Voice)",
    description:
      "Talk to an intelligent coding companion that explains, reviews, and suggests improvements in real time.",
    mediaType: "video",
    src: "/media/coding-battle.mp4",
    icon: Bot,
  },
  {
    title: "Problem Translator",
    description:
      "One-tap translation & explanation of problems in your language—learn faster without language barriers.",
    mediaType: "video",
    src: "/media/problem-translator.mp4",
    icon: Globe2,
  },
  {
    title: "Algorithm Visualization",
    description:
      "See data structures come alive. Step-through animations for stacks, queues, graphs and more.",
    mediaType: "video",
    src: "/media/algovis.mp4",
    icon: ChartBar,
  },
  {
    title: "Real-time Chat for Friends",
    description:
      "Chat while you solve, share snippets, and jump into rooms—seamless collaboration, instantly.",
    mediaType: "video",
    src: "/media/realtime-chat.mp4",
    icon: MessageSquare,
  },
  {
    title: "Personalized Plan",
    description:
      "Adaptive learning paths built from your strengths and weak spots. Level up with smart goals.",
    mediaType: "video",
    src: "/media/personalized-plan.mp4",
    icon: Target,
  },
];

const revealVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.96 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, delay: i * 0.12, ease: "easeOut" },
  }),
};

export default function UpcomingFeatures() {
  const sectionRef = useRef(null);
  const rafRef = useRef(null);

  // Initialize 3D tilt on cards
  useEffect(() => {
    const nodes = document.querySelectorAll(".up-tilt");
    if (nodes?.length) {
      VanillaTilt.init(nodes, {
        max: 16,
        speed: 500,
        glare: true,
        "max-glare": 0.25,
        scale: 1.02,
      });
    }
    return () => {
      nodes.forEach((n) => n.vanillaTilt && n.vanillaTilt.destroy());
    };
  }, []);

  // Interactive particles
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const particles = Array.from(el.querySelectorAll(".up-particle"));
    let ticking = false;
    const RADIUS = 140;
    const POWER = 42;

    const onMove = (e) => {
      if (ticking) return;
      ticking = true;
      rafRef.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;

        particles.forEach((p, idx) => {
          const pr = p.getBoundingClientRect();
          const px = pr.left - rect.left + pr.width / 2;
          const py = pr.top - rect.top + pr.height / 2;

          const dx = px - cx;
          const dy = py - cy;
          const dist = Math.hypot(dx, dy);

          if (dist < RADIUS) {
            const f = (1 - dist / RADIUS) * POWER * (0.7 + (idx % 7) * 0.05);
            const tx = (dx / (dist || 1)) * f;
            const ty = (dy / (dist || 1)) * f;
            p.style.transform = `translate(${tx}px, ${ty}px)`;
          } else {
            p.style.transform = "translate(0px, 0px)";
          }
        });
        ticking = false;
      });
    };

    const onLeave = () => {
      particles.forEach((p) => (p.style.transform = "translate(0px, 0px)"));
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section
      id="upcoming"
      ref={sectionRef}
      className="relative bg-black py-24 overflow-hidden scroll-mt-24"
    >
      {/* BACKGROUND */}
      <div className="absolute inset-0 -z-10">
        <div className="w-full h-full bg-gradient-to-br from-cyan-900/25 via-black to-purple-900/25 animate-pulse" />
        {[...Array(56)].map((_, i) => (
          <motion.span
            key={i}
            className="up-particle absolute w-1 h-1 bg-cyan-400 rounded-full opacity-60"
            initial={{
              y: 0,
              x: 0,
              opacity: 0.3 + (i % 5) * 0.12,
            }}
            animate={{
              y: [0, -40 - (i % 7) * 8, 0],
              x: [0, 26 + (i % 9) * 4, 0],
              opacity: [0.2, 0.9, 0.2],
            }}
            transition={{
              duration: 7 + (i % 10) * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: (i % 8) * 0.2,
            }}
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* HEADING */}
      <motion.h2
        initial={{ opacity: 0, y: -50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="text-center text-5xl font-extrabold text-cyan-400 drop-shadow-[0_0_28px_rgba(0,255,255,0.9)]"
      >
        <Sparkles className="inline-block mr-3 text-cyan-300 animate-pulse" />
        Upcoming Features
      </motion.h2>

      {/* SUBTEXT */}
      <motion.p
        initial={{ opacity: 0, y: -36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
        className="text-center text-gray-300 mt-4 text-lg max-w-3xl mx-auto"
      >
        We’re building the future of coding education—crafted for scale, speed and joy.
        Here’s what’s around the corner.
      </motion.p>

      {/* GRID */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-6 md:px-16">
        {UPCOMING.map((item, idx) => (
          <motion.div
            key={item.title}
            custom={idx}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            variants={revealVariants}
          >
            <FeatureCard item={item} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function FeatureCard({ item }) {
  const Icon = item.icon || Sparkles;

  return (
    <Card
      className="
        up-tilt group relative overflow-hidden
        bg-gradient-to-br from-gray-900 to-black
        border border-cyan-600/30 rounded-2xl
        shadow-xl hover:shadow-[0_25px_120px_-15px_rgba(6,182,212,0.45)]
        transition-all duration-400
      "
    >
      {/* corner ribbon */}
      <div className="absolute left-0 top-0 z-10">
        <span className="bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 px-2 py-1 text-[10px] rounded-br-md">
          COMING SOON
        </span>
      </div>

      <CardContent className="relative p-6">
        {/* floating icon aura moved OUTSIDE media */}
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-xl border border-cyan-400/30 bg-cyan-500/10 flex items-center justify-center mr-3">
            <Icon className="w-5 h-5 text-cyan-300" />
          </div>
          <h3 className="text-2xl font-bold text-cyan-300 drop-shadow-[0_0_14px_rgba(0,255,255,0.65)]">
            {item.title}
          </h3>
        </div>

        {/* media */}
        <div className="w-full h-48 mb-5 overflow-hidden rounded-xl ring-1 ring-white/10 relative">
          {item.mediaType === "video" ? (
            <video
              src={item.src}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <img
              src={item.src}
              alt={item.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* description */}
        <p className="text-gray-300 leading-relaxed">{item.description}</p>
      </CardContent>
    </Card>
  );
}
