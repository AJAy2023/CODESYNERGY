const express  =  require("express");
const app = express();
const cors = require("cors");
const path  = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const problemsroutes = require("./routes/problemsroutes");
// Load environment variables
require('dotenv').config({path:path.join(__dirname , '../.env')});
const PORT = process.env.PORT||8000;

//cors setup


app.use(cors({
  origin: "http://localhost:5173",  
  credentials: true                 
}));

// conect db 
connectDB();

// Middleware to parse JSON
app.use(express.json());

// Routes
app.use('/', authRoutes);
app.use('/', problemsroutes)

// home route
app.get('/', (req, res)=>{
    res.send("welcome to home page...!!");
})

app.listen(PORT, () => {
    console.log(` Server is running on port ${PORT}`);
});