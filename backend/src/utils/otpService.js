const  redis  =  require("../utils/redisClient");
const  bcrypt  =  require("bcrypt");


const  getKey  = (email,  purpose)=>{
    return `otp:${purpose}:${email}`
}

// generateOtp
const  generateOtp = ()=>{
    return Math.floor(100000 + Math.random()*900000).toString()
}

// stored  in redis  
const  storedOtp  =  async(email, purpose,  userOtp, ttl=600)=>{
    const  key = getKey(email, purpose);
    const  hashedOtp =  await bcrypt.hash(userOtp, 10);
     await  redis.set(key, hashedOtp,{
        ex:ttl
     })
}



// verifyOtp  

const  verifyOtp  =  async(email,  purpose,  userOtp)=>{
 const  key = getKey(email,  purpose)
 const  storedOtp =  await  redis.get(key)
 if(!storedOtp)
 {
    return  false;
 }
   const  isMatch = await  bcrypt.compare(userOtp.toString(), storedOtp);

   if(isMatch)
   {
        await redis.del(key);
   }
   return isMatch;
}

// deleteOtp 

const  deleteOtp  = async(email,  purpose)=>{
    const  key = getKey(email,  purpose)
     await  redis.del(key)
}


module.exports={
    generateOtp,
    storedOtp,
    verifyOtp,
    deleteOtp
}