// src/components/dashboard/StatsCards.jsx
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Code2, Coins, Users, Award } from "lucide-react";
import CountUp from "react-countup";
import axios from "axios";
import { BASE_URL } from "../../api/config";

const GUARDIAN = "#0AA1C0";

function useCountUp(target = 0, duration = 900) {
  const ref = useRef(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      ref.current = Math.round(target * t);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return ref;
}

function hasEnoughData(u) {
  const hasCoins = typeof u?.coins === "number";
  const hasFriends = Array.isArray(u?.friends) || typeof u?.friendsCount === "number";
  const hasSolved = typeof u?.solvedCount === "number" || Array.isArray(u?.solvedProblems);
  return hasCoins && hasFriends && hasSolved;
}

export default function StatsCards({ user }) {
  // Accept either: user (profile), { profile: user }, or full response { profile, stats }
  const incoming = user?.profile ?? user ?? {};

  const [fetchedProfile, setFetchedProfile] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadProfileIfNeeded = async () => {
      try {
        if (hasEnoughData(incoming)) {
          setFetchedProfile(null);
          setLoaded(true);
          return;
        }

        const token = localStorage.getItem("token");
        const uid =
          incoming?._id ||
          incoming?.id ||
          user?._id ||
          user?.profile?._id ||
          localStorage.getItem("userId");

        if (!token || !uid) {
          
          console.warn("StatsCards: no token or userId available for fetching profile.");
          setFetchedProfile(null);
          setLoaded(true);
          return;
        }

        
        const tryUrls = [`${BASE_URL}/profile/${uid}`, `${BASE_URL}/profile`];
        let profileRes = null;
        for (const url of tryUrls) {
          try {
            profileRes = await axios.get(url, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (profileRes && profileRes.status === 200) break;
          } catch (err) {
            // continue to next url
            profileRes = null;
          }
        }

        if (!profileRes) {
          console.warn("StatsCards: profile fetch failed for urls:", tryUrls);
          setFetchedProfile(null);
          setLoaded(true);
          return;
        }

        const data = profileRes.data ?? {};
      
        const profileObj = data.profile ?? data;
        const statsObj = data.stats ?? null;

        const merged = {
          ...incoming,
          coins:
            typeof incoming?.coins === "number"
              ? incoming.coins
              : typeof statsObj?.coins === "number"
              ? statsObj.coins
              : typeof profileObj?.coins === "number"
              ? profileObj.coins
              : 0,
          friends:
            Array.isArray(incoming?.friends) && incoming.friends.length
              ? incoming.friends
              : Array.isArray(profileObj?.friends)
              ? profileObj.friends
              : [],
          solvedProblems:
            Array.isArray(incoming?.solvedProblems) && incoming.solvedProblems.length
              ? incoming.solvedProblems
              : Array.isArray(profileObj?.solvedProblems)
              ? profileObj.solvedProblems
              : undefined,
          solvedCount:
            typeof statsObj?.solvedCount === "number"
              ? statsObj.solvedCount
              : Array.isArray(profileObj?.solvedProblems)
              ? profileObj.solvedProblems.length
              : typeof profileObj?.solvedCount === "number"
              ? profileObj.solvedCount
              : 0,
        };

        if (!cancelled) {
          setFetchedProfile(merged);
          setLoaded(true);
        }
      } catch (err) {
        console.error("StatsCards: error fetching profile", err);
        if (!cancelled) {
          setFetchedProfile(null);
          setLoaded(true);
        }
      }
    };

    loadProfileIfNeeded();
    return () => {
      cancelled = true;
    };
   
  }, [JSON.stringify(incoming)]);

  const u = loaded && fetchedProfile ? fetchedProfile : incoming;

  const solvedCount =
    typeof u?.solvedCount === "number"
      ? u.solvedCount
      : Array.isArray(u?.solvedProblems)
      ? u.solvedProblems.length
      : 0;

  const coins = typeof u?.coins === "number" ? u.coins : 0;

  const friendsCount =
    typeof u?.friendsCount === "number"
      ? u.friendsCount
      : Array.isArray(u?.friends)
      ? u.friends.length
      : 0;

  const stats = [
    { label: "Problems Solved", value: Number(solvedCount || 0), Icon: Code2 },
    { label: "Coins", value: Number(coins || 0), Icon: Coins },
    { label: "Friends", value: Number(friendsCount || 0), Icon: Users },
    {
      label: "Leaderboard Rank",
      value: u?.rank ? u.rank : "Top 10",
      Icon: Award,
      color: GUARDIAN,
      href: "/rank/leaderboard",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((s, i) => {
        const valRef = useCountUp(typeof s.value === "number" ? s.value : 0, 900 + i * 70);

        const cardContent = (
          <motion.div
            whileHover={{
              translateY: -6,
              boxShadow: `0 12px 30px ${hexToRgba(GUARDIAN, 0.08)}`,
            }}
            className="p-4 rounded-xl bg-white/5 backdrop-blur-lg border border-white/6 transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="p-3 rounded-lg"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid rgba(255,255,255,0.03)`,
                  }}
                >
                  <s.Icon size={20} className="text-white" />
                </div>
                <div>
                  <div className="text-sm text-slate-300">{s.label}</div>
                  <div className="text-2xl font-bold mt-1 text-white">
                    {typeof s.value === "number" ? (
                      <CountUp end={s.value} duration={1.5} separator="," />
                    ) : (
                      s.value
                    )}
                  </div>
                </div>
              </div>
              <div className="text-sm text-slate-400">›</div>
            </div>
          </motion.div>
        );

        return s.href ? (
          <div key={s.label} onClick={() => (window.location.href = s.href)}>
            {cardContent}
          </div>
        ) : (
          <div key={s.label}>{cardContent}</div>
        );
      })}
    </div>
  );
}

/* helpers */
function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const h = hex.replace("#", "");
  const num = parseInt(h, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
