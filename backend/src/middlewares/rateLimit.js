const   limiter  = require('express-rate-limit');

const ratelimit = limiter(
    {
        windowMs :30*60*1000,
        max:100,
        staus_code:429,
        msg:"wait few  time you made  many request"
    }
)

module.exports = ratelimit;