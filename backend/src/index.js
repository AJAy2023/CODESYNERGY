const express  =  require("express");
const app = express();
const path  = require('path');
const connectDB = require('./config/db');
require('dotenv').config({path:path.join(__dirname , '../.env')});
const PORT = process.env.PORT||8000;

// conect db 
connectDB();
app.get('/', (req, res)=>{
    res.send("welcome to home page...!!");
})

app.listen(PORT, () => {
    console.log(` Server is running on port ${PORT}`);
});