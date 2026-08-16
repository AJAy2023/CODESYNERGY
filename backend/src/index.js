const express  =  require("express");
const app = express();
const cors = require("cors");
const path  = require('path');
const cookieParser = require("cookie-parser");
const http = require('http');
const {Server} = require("socket.io");
const server = http.createServer(app);
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const problemunlock = require("./routes/unlockproblems");
const leaderboardroutes = require("./routes/leaderboard");
const friendRequests = require("./routes/friendRequests");
const roomsystem = require("./routes/roomsystem");
const problemsroutes =  require("./routes/problemsroutes");
const hints = require("./routes/aihints");
const profileSystem =  require("./routes/profilesystem");
const Battle = require("./routes/battleRoutes");
const progressBar = require("./routes/progress");
const submissionRoute =  require("./routes/problemsubmission");
const syncuser =  require("./routes/userRoutes");
require('dotenv').config({path:path.join(__dirname , '../.env')});
const PORT = process.env.PORT||8000;




//cors setup

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.options("*", cors());

// socket.io setup for cors 
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"]
  }
});

app.use((req, res, next) => {
  req.io = io; 
  next();
})

// connect db 
connectDB();

// // connect redis
// connectRedis();

// socket.io
const socketHandler = require("./sockets/scoketHandler");
 socketHandler(io) 

// Middleware to parse JSON
app.use(express.json());
app.use(cookieParser());
// Routes
app.use('/', authRoutes);
app.use('/', problemsroutes)
app.use('/', submissionRoute );
app.use('/',  problemunlock);
app.use('/', leaderboardroutes);
app.use('/', friendRequests);
app.use('/', roomsystem);
app.use('/', hints);
app.use('/', profileSystem);
app.use('/', Battle);
app.use('/', progressBar);
app.use('/' , syncuser)
// home route
app.get('/health' ,(req, res)=>{
  res.send("server is running ...!!");
})
app.get('/', (req, res)=>{
    res.send("welcome to home page...!!");
})

server.listen(PORT, () => {
    console.log(` Server and socket  is running on port ${PORT}`);
});