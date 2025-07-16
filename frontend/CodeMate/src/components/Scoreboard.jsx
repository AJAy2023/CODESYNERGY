// src/components/Scoreboard.jsx
import React from "react";

const Scoreboard = ({ players = [] }) => {
  return (
    <div className="bg-zinc-800 p-4 rounded-md shadow-md">
      <h3 className="text-xl font-bold text-yellow-400 mb-2">Live Scoreboard</h3>
      {players.length === 0 ? (
        <p className="text-sm text-gray-400">No players joined yet.</p>
      ) : (
        <ul className="space-y-2">
          {players.map((player, idx) => (
            <li
              key={idx}
              className="bg-zinc-700 px-3 py-2 rounded flex justify-between items-center text-sm"
            >
              <span className="font-semibold text-cyan-400">{player.name}</span>
              <span className="text-green-400 font-mono">{player.score ?? 0} pts</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Scoreboard;
