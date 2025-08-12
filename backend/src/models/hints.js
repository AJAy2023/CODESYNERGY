const  mongoose = require("mongoose");
const hintUsageSchema = new mongoose.Schema({

    userId :{
        type:mongoose.Schema.Types.ObjectId , 
        ref:"User",
        required:true
    },
    date:{
        type:String,
        required:true,
    },
    count:{
        type:Number,
        default:0
    }
});

module.exports = mongoose.model("Hint", hintUsageSchema);