const express  =  require("express");
const app = express();
const path  = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
// Load environment variables
require('dotenv').config({path:path.join(__dirname , '../.env')});
const PORT = process.env.PORT||8000;


// conect db 
connectDB();

// Middleware to parse JSON
app.use(express.json());

// Routes
app.use('/auth', authRoutes);

// home route
app.get('/', (req, res)=>{
    res.send("welcome to home page...!!");
})

app.listen(PORT, () => {
    console.log(` Server is running on port ${PORT}`);
});