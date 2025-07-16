import React, { useEffect, useState } from "react";

const Timer = ({ initialSeconds = 900 }) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="text-white text-sm font-mono px-3 py-1 bg-black rounded border border-zinc-600">
      ⏱️ Time Left: {formatTime(seconds)}
    </div>
  );
};

export default Timer;
