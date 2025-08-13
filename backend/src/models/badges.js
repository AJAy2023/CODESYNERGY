
const  mongoose = require("mongoose");

const  userBadges = new  mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    description:{
        type:String
    },
    icon:{
        type:String
    },
    level:{
        type:String
   }
});

const Badge = mongoose.model('Badge', userBadges);
module.exports=Badge;