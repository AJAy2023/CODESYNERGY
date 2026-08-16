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

require('dotenv').config({path:path.join(__dirname , '../.env')});
const PORT = process.env.PORT||8000;




//cors setup

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-refresh-token"]
};

app.use(cors(corsOptions));

// socket.io setup for cors 
const io = new Server(server, {
  cors: {
    origin: true,
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