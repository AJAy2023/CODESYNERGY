// // src/pages/Dashboard.jsx



// src/pages/Dashboard.jsx

import { useState, Suspense, lazy, useEffect } from "react";
import { useUser } from "@clerk/react";

import DashboardNavbar from "../components/layout/DashboardNavbar";
import StatsCards from "../components/dashboard/StatsCards";
import QuickActions from "../components/dashboard/QuickActions";
import LiveFeed from "../components/dashboard/LiveFeed";
import FriendActivity from "../components/dashboard/FriendActivity";
import RewardPanel from "../components/dashboard/RewardPanel";
import AIBuddyWidget from "../components/dashboard/AIBuddyWidget";
import axios from "axios";
import { BASE_URL } from "../api/config";

const ProgressChart = lazy(() => import("../components/dashboard/ProgressChart"));

export default function Dashboard() {
  const { user, isLoaded } = useUser(); 

  //  wait for Clerk
  if (!isLoaded) {
    return <div className="text-white p-6">Loading...</div>;
  }


  //  add the  useeffect 

  useEffect(()=>{
    if(!user) return;
    axios.post(`${BASE_URL}/sync-user`, {},{
      headers:{
       "x-clerk-id" : user.id
      },
    });
  },[user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-zinc-900 text-white pt-6 pb-12">
      <DashboardNavbar user={user} />

      <main className="max-w-7xl mx-auto px-6 pt-28 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            {/* ✅ use Clerk user */}
            <h1 className="text-3xl font-extrabold">
              Welcome, {user?.firstName || "Coder"}!
            </h1>

            <p className="text-slate-400 mt-1">
              Ready to practice? Invite friends or jump into a match.
            </p>
          </div>
        </div>

        {/* ⚠️ temporarily passing Clerk user */}
        <StatsCards user={user} />

        <QuickActions />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense fallback={<div className="p-4 bg-white/5 rounded">Loading chart…</div>}>
            <ProgressChart />
          </Suspense>
          <LiveFeed />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FriendActivity />
          <RewardPanel onClaim={() => alert("🎉 Claimed daily reward!")} />
        </div>
      </main>

      <AIBuddyWidget />
    </div>
  );
}









// import { useEffect, useState, Suspense, lazy } from "react";
// import axios from "axios";
// import DashboardNavbar from "../components/layout/DashboardNavbar";
// import StatsCards from "../components/dashboard/StatsCards";
// import QuickActions from "../components/dashboard/QuickActions";
// import LiveFeed from "../components/dashboard/LiveFeed";
// import FriendActivity from "../components/dashboard/FriendActivity";
// import RewardPanel from "../components/dashboard/RewardPanel";
// import AIBuddyWidget from "../components/dashboard/AIBuddyWidget";
// import { BASE_URL } from "../api/config";
// import {useCurrentUser} from "../../src/hooks/useCurrentUser"
// const ProgressChart = lazy(() => import("../components/dashboard/ProgressChart"));

// export default function Dashboard() {
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         // const token = localStorage.getItem("token");
//         // data  get info
//         const { userId } = useCurrentUser();
//         const res = await axios.get(`${BASE_URL}/user-profile`, {
//           headers: { Authorization: `Bearer ${userId}` },
//         });
//         setUser(res.data);
//       } catch (err) {
//         console.error("Failed to load user", err);
//       }
//     };
//     fetchUser();
//   }, []);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-zinc-900 text-white pt-6 pb-12">
//       <DashboardNavbar user={user} />
//       <main className="max-w-7xl mx-auto px-6 pt-28 space-y-8">
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-3xl font-extrabold">Welcome, {user?.username ?? "Coder"}!</h1>
//             <p className="text-slate-400 mt-1">Ready to practice? Invite friends or jump into a match.</p>
//           </div>
//         </div>

//         <StatsCards user={user} />

//         <QuickActions />

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <Suspense fallback={<div className="p-4 bg-white/5 rounded">Loading chart…</div>}>
//             <ProgressChart />
//           </Suspense>
//           <LiveFeed />
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <FriendActivity />
//           <RewardPanel onClaim={() => alert("🎉 Claimed daily reward!")} />
//         </div>
//       </main>

//       <AIBuddyWidget />
//     </div>
//   );
// }
