// src/Collab/socket.js
import { io } from "socket.io-client";
import { BASE_URL } from "../api/config";

//  Backend Socket Server
const socket = io( BASE_URL, {
  transports: ["websocket"],
  withCredentials: true,
});

export default socket; //  Exporting default to fix import errors
