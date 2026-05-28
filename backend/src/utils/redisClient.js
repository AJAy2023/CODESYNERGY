const { Redis } = require("@upstash/redis");
const  path =  require("path")

require("dotenv").config({
  path: path.join(__dirname, "../../.env")
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = redis;