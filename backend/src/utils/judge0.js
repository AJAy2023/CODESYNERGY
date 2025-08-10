const axios = require("axios");
require("dotenv").config({path:(__dirname , "../../.env")});

const judge0_URL = "https://ce.judge0.com";
const judge_api=process.env.judge_api;

async function exicutecode(source_code , language_id){

    try{

        // 1  submit code  
        const submission = await axios.post(
            `${judge0_URL}//submissions?base64_encoded=false&wait=true`,
            {
                source_code,
                language_id,
                stdn:"",
            },{
                headers:judge_api?{"X-Auth-Token":judge_api}:{}
            }
        );

        return submission.data;
    }catch(err)
    {
         console.error("Judge0 execution error:", err.response?.data || err.message);
        throw new Error("Code execution failed");
    }
}

module.exports = {exicutecode};