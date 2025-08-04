import { Lightbulb, Users, Rocket } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: <Lightbulb className="w-8 h-8 text-[#66E2DC]" />,
    title: "AI-Powered Assistance",
    description:
      "Get real-time code suggestions, hints, and smart debugging powered by AI.",
  },
  {
    icon: <Users className="w-8 h-8 text-[#66E2DC]" />,
    title: "Real-Time Collaboration",
    description:
      "Create rooms, collaborate with friends, and solve problems live together.",
  },
  {
    icon: <Rocket className="w-8 h-8 text-[#66E2DC]" />,
    title: "Competitive Battles",
    description:
      "Join live coding battles and climb the leaderboard with your coding skills.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-16 px-4 bg-[#0F0F0F] text-white">
      <div className="max-w-6xl mx-auto text-center">
        <motion.h2
          className="text-3xl md:text-4xl font-bold mb-8"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Why Choose CodeSynergy?
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-[#1F1F1F] p-6 rounded-2xl shadow-md hover:shadow-lg transition"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
