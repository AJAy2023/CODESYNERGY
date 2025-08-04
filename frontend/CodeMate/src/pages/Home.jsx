import HeroSection from "@/components/homepage/HeroSection";
import FeaturesSection from "@/components/homepage/FeaturesSection";
import LiveCodingShowcase from "@/components/homepage/LiveCodingShowcase";
import AIChatAssistant from "@/components/homepage/AIChatAssistant";
import AnimatedBackground from "@/components/homepage/AnimatedBackground";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="relative bg-[#050505] text-white min-h-screen overflow-x-hidden">
      <AnimatedBackground />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <LiveCodingShowcase />
      <AIChatAssistant />
    </div>
  );
}