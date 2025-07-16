import { useEffect, useState } from "react";

const BattleInfo = ({ timeLeft, problem, isBattleStarted }) => {
  const [displayTime, setDisplayTime] = useState(0);

  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    setDisplayTime(`${minutes}:${seconds.toString().padStart(2, "0")}`);
  }, [timeLeft]);

  return (
    <div className="bg-zinc-800 rounded p-4 mb-4 flex justify-between items-center border border-zinc-600">
      <div>
        <h3 className="text-xl font-bold text-cyan-400">
          {problem?.title || "Loading Problem..."}
        </h3>
        <p className="text-sm text-gray-400">{problem?.description || ""}</p>
      </div>
      <div className="text-2xl font-bold text-yellow-300">
        {isBattleStarted ? `⏱ ${displayTime}` : "Waiting..."}
      </div>
    </div>
  );
};

export default BattleInfo;