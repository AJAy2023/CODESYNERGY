// src/components/homepage/AnimatedBackground.jsx
import React, { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

export default function AnimatedBackground() {
  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);

  // single unified page gradient is handled via wrapper CSS in Home.jsx, this draws subtle particles on top
  return (
    <>
      {/* page-level gradient overlay (kept subtle so text readable) */}
      <div
        aria-hidden
        className="fixed inset-0 -z-20"
        style={{
          background:
            "linear-gradient(180deg, #0b1220 0%, #14213d 45%, #1f2a44 100%)",
        }}
      />

      {/* particles */}
      <div className="fixed inset-0 -z-10 opacity-30">
        <Particles
          id="homepage-particles"
          init={particlesInit}
          options={{
            fullScreen: { enable: false },
            particles: {
              number: { value: 45, density: { enable: true, area: 900 } },
              color: { value: ["#06b6d4", "#7c3aed", "#60a5fa"] },
              shape: { type: "circle" },
              opacity: { value: 0.18 },
              size: { value: { min: 1, max: 4 } },
              move: { enable: true, speed: 0.6, outModes: "out" },
              links: {
                enable: true,
                distance: 120,
                color: "#0ea5a1",
                opacity: 0.06,
                width: 1,
              },
            },
            interactivity: {
              events: { onHover: { enable: true, mode: "repulse" } },
              modes: { repulse: { distance: 80, duration: 0.4 } },
            },
            detectRetina: true,
          }}
        />
      </div>
    </>
  );
}
