const mongoose = require('mongoose');
const path   =  require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL); 
        console.log("MongoDB connected successfully..");
    } catch (error) {
        console.error("MongoDB connection failed...", error.message);
        process.exit(1);
    }
};


module.exports = connectDB;