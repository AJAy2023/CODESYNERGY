import { useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import VanillaTilt from "vanilla-tilt";
import { Sparkles } from "lucide-react";

const features = [
  {
    title: "Real-Time Coding Battles",
    description: "Challenge your friends in live coding duels with instant feedback.",
    mediaType: "video",
    src: "/media/Real_Time_Coding.mp4",
  },
  {
    title: "Live Discussion Rooms",
    description: "Collaborate, brainstorm, and solve problems together in real time.",
    mediaType: "video",
    src: "/media/live-discussion.mp4",
  },
  {
    title: "AI-Powered Hints & Feedback",
    description: "Get intelligent hints and feedback to boost your problem-solving skills.",
    mediaType: "image",
    src: "/media/ai-feedback.jpg",
  },
  {
    title: "Gamification System",
    description: "Earn coins, unlock achievements, and climb the global leaderboard.",
    mediaType: "image",
    src: "/media/gamification.png",
  },
  {
    title: "Friend System",
    description: "Connect with friends, challenge them, and grow together as coders.",
    mediaType: "image",
    src: "/media/friend-system.gif",
  },
];

const Features = () => {
  useEffect(() => {
    const cards = document.querySelectorAll(".tilt-card");
    VanillaTilt.init(cards, {
      max: 15,
      speed: 400,
      glare: true,
      "max-glare": 0.2,
    });
  }, []);

  return (
    
    <div id="features" className="relative bg-black py-24 overflow-hidden">
  
      <div className="absolute inset-0 -z-10">
        <div className="w-full h-full bg-gradient-to-br from-cyan-900/20 via-black to-purple-900/20 animate-pulse" />
        {[...Array(40)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-70"
            animate={{
              y: [0, -50, 0],
              x: [0, 30, 0],
              opacity: [0.2, 1, 0.2],
            }}
            transition={{
              duration: 8 + i * 0.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Heading */}
      <motion.h2
        initial={{ opacity: 0, y: -50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
        className="text-center text-5xl font-extrabold text-cyan-400 drop-shadow-[0_0_25px_rgba(0,255,255,0.8)]"
      >
        <Sparkles className="inline-block mr-3 text-cyan-300 animate-pulse" />
        Premium Features for Coders
      </motion.h2>

      {/* Subheading */}
      <motion.p
        initial={{ opacity: 0, y: -60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.3 }}
        viewport={{ once: true }}
        className="text-center text-gray-300 mt-4 text-lg max-w-2xl mx-auto"
      >
        Unlock the ultimate coding experience with interactive battles, real-time discussions, and AI-driven feedback that feels like the future of learning.
      </motion.p>

      {/* Features Grid */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-6 md:px-16">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: index * 0.2 }}
            viewport={{ once: true }}
          >
            <Card className="tilt-card bg-gradient-to-br from-gray-900 to-black border border-cyan-600/30 shadow-xl rounded-2xl overflow-hidden hover:shadow-cyan-500/40">
              <CardContent className="p-6 flex flex-col items-center">
                <div className="w-full h-40 mb-4 overflow-hidden rounded-xl">
                  {feature.mediaType === "video" ? (
                    <video
                      src={feature.src}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <img
                      src={feature.src}
                      alt={feature.title}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-cyan-300 drop-shadow-[0_0_12px_rgba(0,255,255,0.6)]">
                  {feature.title}
                </h3>
                <p className="text-gray-400 mt-3 text-center text-base">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Features;
