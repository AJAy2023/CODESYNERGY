// src/Collab/socket.js
import { io } from "socket.io-client";
import { BASE_URL } from "../api/config";


//  Backend Socket Server
const socket = io(BASE_URL, {
  withCredentials: true,
});
socket.on("connect", () => {
  console.log("Socket connected!");
  console.log("Socket ID:", socket.id);
});
 
export default socket; 
