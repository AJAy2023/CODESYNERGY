// src/App.jsx
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
// import Navbar from "./components/Navbar";
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


function App() {
  const location = window.location.pathname;
  const showNavbar = !location.includes("/dashboard");

  return (
    <div className="bg-white text-black dark:bg-black dark:text-white transition-all duration-300 min-h-screen">
      {/* <Router> */}
        {/* {showNavbar && <Navbar />} */}
        <Toaster position="top-right" reverseOrder={false} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Signup />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/:id" element={<SolveProblem />} />
          <Route path="/rank/leaderboard" element={<Leaderboard />} />
          <Route path="/rooms/createroom" element={<CodingRooms />} />
          <Route path="/rooms/joinroom" element={<JoinRoom />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
          <Route path="/search" element={<SearchFriend />} />
          <Route path="/waitingroom/:roomId" element={<RoomWaitingLobby />} />
          <Route path="/battle/:roomId" element={<RoomPage />} />
          <Route path="/profile/:id" element={<ViewProfile />} />
          <Route path="/profile/update" element={<EditProfile />} />
          <Route path="/user-profile" element={<MyProfile />} />
          <Route path="/friends/list/:id" element={<FriendList />} />
          <Route path="/friends/card/:id" element={<FriendCard />} />
          <Route path="/friends/requests" element={<FriendRequests />} />


          {/* Private Routes */}

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      {/* </Router> */}
    </div>
  );
}

export default App;