// src/components/homepage/AnimatedBackground.jsx
import { useEffect } from "react";

export default function AnimatedBackground() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@dotlottie/player-component@latest/dist/dotlottie-player.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10">
      <dotlottie-player
        src="https://lottie.host/f3f2ce9d-ecc3-4d12-a3e7-7d1ad8e2de8b/2AnuRZwe1M.json"
        background="transparent"
        speed="1"
        loop
        autoplay
        style={{ width: "100%", height: "100%" }}
      ></dotlottie-player>
    </div>
  );
}