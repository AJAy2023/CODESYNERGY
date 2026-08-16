// src/App.jsx
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ComingSoon from "./Collab/pages/ComigSoon";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import { AnimatePresence } from "framer-motion";
import Problems from "./pages/Problems";
import SolveProblem from "./pages/SolveProblem";
import Leaderboard from "./pages/Leaderboard";
import { Toaster } from "react-hot-toast";
import CodingRooms from "./pages/CodingRooms";
import JoinRoom from "./Collab/JoinRoom";
import RoomPage from "./Collab/RoomPage";
import SearchFriend from "./components/friends/SearchFriend";
import RoomWaitingLobby from "./components/Room/RoomWaitingLobby";
import ViewProfile from "./pages/Profile/ViewProfile";
import EditProfile from "./pages/Profile/EditProfile";
import MyProfile from "./pages/Profile/MyProfile";
import FriendList from "./components/friends/FriendList";
import FriendCard from "./components/friends/FriendCard";
import FriendRequests from "./components/friends/FriendRequests";
import DiscussionRoom from "./Collab/DiscussionRoom";
import FriendsPage from "./pages/FriendsPage";

function App() {
  const location = useLocation(); 
  const showNavbar = !location.pathname.includes("/dashboard");

  return (
    <div className="bg-white text-black dark:bg-black dark:text-white transition-all duration-300 min-h-screen">
      {/* <Router> */}
        {/* {showNavbar && <Navbar />} */}
        <Toaster position="top-right" reverseOrder={false} />

        <Routes location={location} key={location.pathname}>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Application Routes */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/problems" element={<PrivateRoute><Problems /></PrivateRoute>} />
          <Route path="/:id" element={<PrivateRoute><SolveProblem /></PrivateRoute>} />
          <Route path="/rank/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
          <Route path="/rooms/createroom" element={<PrivateRoute><CodingRooms /></PrivateRoute>} />
          <Route path="/room/:roomId" element={<PrivateRoute><RoomPage /></PrivateRoute>} />
          <Route path="/search" element={<PrivateRoute><SearchFriend /></PrivateRoute>} />
          <Route path="/waitingroom/:roomId" element={<PrivateRoute><RoomWaitingLobby /></PrivateRoute>} />
          <Route path="/battle/:roomId" element={<PrivateRoute><RoomPage /></PrivateRoute>} />
          <Route path="/discussion/:roomId" element={<PrivateRoute><DiscussionRoom /></PrivateRoute>} />
          
          {/* Protected Profile & Friends Routes */}
          <Route path="/profile/:id" element={<PrivateRoute><ViewProfile /></PrivateRoute>} />
          <Route path="/profile/update" element={<PrivateRoute><EditProfile /></PrivateRoute>} />
          <Route path="/user-profile" element={<PrivateRoute><MyProfile /></PrivateRoute>} />
          <Route path="/friends/list/:id" element={<PrivateRoute><FriendList /></PrivateRoute>} />
          <Route path="/friends/card/:id" element={<PrivateRoute><FriendCard /></PrivateRoute>} />
          <Route path="/friends/requests" element={<PrivateRoute><FriendRequests /></PrivateRoute>} />
          <Route path="/friends" element={<PrivateRoute><FriendsPage /></PrivateRoute>} />
        </Routes>

        {/* Modal route for JoinRoom */}
        <AnimatePresence>
          {location.pathname === "/rooms/joinroom" && <JoinRoom key="joinroom" />}
        </AnimatePresence>
      {/* </Router> */}
    </div>
  );
}

export default App;
