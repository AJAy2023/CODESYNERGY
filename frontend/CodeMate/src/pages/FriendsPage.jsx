import { useState } from "react";
import { motion } from "framer-motion";
import DashboardNavbar from "@/components/layout/DashboardNavbar";
import FriendRequests from "@/components/friends/FriendRequests";
import FriendList from "@/components/friends/FriendList";
import SearchFriend from "@/components/friends/SearchFriend";
import { Users, UserCheck, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState("requests"); // "requests" | "list" | "search"
  const { user } = useAuth();

  const tabs = [
    { id: "requests", label: "Friend Requests", icon: UserCheck },
    { id: "list", label: "My Friends", icon: Users },
    { id: "search", label: "Find People", icon: Search },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-zinc-950 text-white">
      <DashboardNavbar user={user} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-[#06b6d4] to-[#7c3aed] text-transparent bg-clip-text">
              Friends & Connections
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage incoming/outgoing requests, view your coding buddies, or discover new friends.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-white/5 border border-white/10 w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-white shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-6"
        >
          {activeTab === "requests" && <FriendRequests />}
          {activeTab === "list" && <FriendList />}
          {activeTab === "search" && <SearchFriend />}
        </motion.div>
      </main>
    </div>
  );
}
