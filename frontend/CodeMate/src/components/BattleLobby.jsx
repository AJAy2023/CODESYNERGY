// src/components/BattleLobby.jsx
import { useEffect, useState } from "react";
import {BASE_URL}  from "../api/config";
import axios from "axios";

const BattleLobby = ({ onStart, opponent }) => {
  const [problems, setProblems] = useState([]);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
       const res = await axios.get(BASE_URL);
        setProblems(res.data);
      } catch (err) {
        console.error("Failed to load problems", err);
      }
    };
    fetchProblems();
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-zinc-800 p-6 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-6">⚔️ Coding Battle Lobby</h1>
      <h3 className="text-xl mb-4 text-center text-yellow-400">
        You're matched with <span className="text-white font-bold">{opponent}</span>
      </h3>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {problems.map((prob) => (
          <div
            key={prob._id}
            className="p-4 bg-zinc-700 rounded-md border border-zinc-600 hover:border-green-500 transition cursor-pointer"
            onClick={() => onStart(prob)}
          >
            <h2 className="font-semibold text-lg text-white">{prob.title}</h2>
            <p className="text-sm text-gray-300 capitalize">{prob.difficulty}</p>
            <p className="text-xs text-gray-400 mt-2">{prob.statement.slice(0, 100)}...</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BattleLobby;
