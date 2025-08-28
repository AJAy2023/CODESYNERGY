import React from "react";
import HeroSection from "../components/Homepage/HeroSection";
import FeaturesSection from "../components/Homepage/FeaturesSection";
import LiveCodingShowcase from "../components/Homepage/LiveCodingShowcase";
import AIChatAssistant from "../components/Homepage/AIChatAssistant";
import AnimatedBackground from "../components/Homepage/AnimatedBackground";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import UpcomingFeatures from "@/components/Homepage/UpcomingFeatures";

const Home = () => {
  return (
    <div className="relative min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Navbar */}
      <Navbar />
      {/* Animated background */}
    <div className="relative min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Navbar */}
      <Navbar />
      {/* Animated background */}
      <AnimatedBackground />

      {/* Main content */}
      <main className="flex flex-col items-center gap-20 px-6 sm:px-10 md:px-16 lg:px-24 py-20">
        {/* Hero Section */}
        <section className="w-full">
          <HeroSection />
        </section>

        {/* Features Section */}
        <section className="w-full">
          <FeaturesSection />
        </section>

        {/* Live Coding Showcase */}
        <section className="w-full">
          <LiveCodingShowcase />
        </section>

        {/* Upcoming Features */}
        <section className="w-full">
          <UpcomingFeatures />
        </section>

        {/* AI Chat Assistant */}
        <section className="w-full">
          {/* <AIChatAssistant /> */}

          {/* Footer */}
          <Footer />
        </section>
      </main>
    </div>
    </div>
  );
};

export default Home;


