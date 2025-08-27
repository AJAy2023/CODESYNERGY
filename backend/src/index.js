const express  =  require("express");
const app = express();
const cors = require("cors");
const path  = require('path');
const http = require('http');
const {Server} = require("socket.io");
const server = http.createServer(app);

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const problemsroutes = require("./routes/problemsroutes");
const submissionController = require("./routes/problemsubmission");
const problemunlock = require("./routes/unlockproblems");
const leaderboardroutes = require("./routes/leaderboard");
const friendRequests = require("./routes/friendRequests");
const roomsystem = require("./routes/roomsystem");
const hints = require("./routes/aihints");
const profileSystem =  require("./routes/profilesystem");
const Battle = require("./routes/battleRoutes");
const progressBar = require("./routes/progress");
require('dotenv').config({path:path.join(__dirname , '../.env')});
const PORT = process.env.PORT||8000;


// socket.io setup for cors 
const  io = new Server(server , {
  cors:{
     origin: "http://localhost:5173",  
  credentials: true  ,
  methods: ["GET", "POST"],
  }
})


//cors setup

app.use(cors({
  origin: "http://localhost:5173",  
  credentials: true                 
}));

app.use((req, res, next) => {
  req.io = io; 
  next();
})

// conect db 
connectDB();

// socket.io
const socketHandler = require("./sockets/scoketHandler");
socketHandler(io) 

// Middleware to parse JSON
app.use(express.json());

// Routes
app.use('/', authRoutes);
app.use('/', problemsroutes)
app.use('/',submissionController);
app.use('/',problemunlock);
app.use('/', leaderboardroutes);
app.use('/', friendRequests);
app.use('/', roomsystem);
app.use('/', hints);
app.use('/', profileSystem);
app.use('/', Battle);
app.use('/', progressBar);
// home route
app.get('/', (req, res)=>{
    res.send("welcome to home page...!!");
})

server.listen(PORT, () => {
    console.log(` Server and socket  is running on port ${PORT}`);
});