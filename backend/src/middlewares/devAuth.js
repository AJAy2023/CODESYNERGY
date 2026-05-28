
const devAuth  = (req , res, next)=>{

 const  clerkId =  req.headers["x-clerk-id"];
 if(!clerkId)
 {
    return res.status(401).json({
        success:false,
        message:"unathorized access ! please  login"
    });
 }

  req.clerkId = clerkId  //  passing this  id to each  route 
  next();
}


module.exports = devAuth;