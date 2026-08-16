// src/Collab/socket.js
import { io } from "socket.io-client";
import { BASE_URL } from "../api/config";


//  Backend Socket Server
const socket = io(BASE_URL, {
  withCredentials: true,
});

 



/*
const  socket = io(BASE_URL,{
  transports: ["websocket"], -----------------------> this code  is good  for production but for development we can use the above code .
  withCredentials: true,
}

*/
export default socket; 
