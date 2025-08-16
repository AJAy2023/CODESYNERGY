// src/Collab/socket.js
import { io } from "socket.io-client";

//  Backend Socket Server
const socket = io("http://localhost:8000",
   {
  transports: ["websocket"],
  withCredentials: true,
});

export default socket; //  Exporting default to fix import errors
