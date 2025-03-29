const express  =  require("express");
const app = express();
const path  = require('path');
require('dotenv').config({path:path.join(__dirname , '../.env')});
const PORT = process.env.PORT||8000;
app.get('/', (req, res)=>{
    res.send("welcome to home page...!!");
})

app.listen(PORT, () => {
    console.log(` Server is running on port ${PORT}`);
});