
const { ethers } = require("ethers");
const fs = require("fs");
const ORACLE_ADDRESS = process.env.ORACLE_ADDRESS;
const axios = require("axios");
const TWITTER_API_KEY =  process.env.TWITTER_API_KEY;
const fake = process.env.FAKE == "T" || false;

if ( ORACLE_ADDRESS) {
    console.error("ORACLE_ADDRESS is required as env var!");
    return;
}
const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/");

const signer = provider.getSigner();
const ABI = JSON.parse(fs.readFileSync("../artifacts/contracts/FollowCountOracle.sol/FollowCountOracle.json")).abi;


provider.on({}, (ev) => {
    let decoded;
    try {
        decoded = ethers.utils.defaultAbiCoder.decode(["uint256", "string"], ev.data);
    } catch (er) {
        return;
    }


    if (!decoded[1]) {
        return;
    }

    
    axios.get(`https://api.twitter.com/2/users/by/username/${decoded[1]}?user.fields=public_metrics`, {
        headers: {
            "Authorization": `Bearer ${TWITTER_API_KEY}`
        }
    }).then((res) => {

        let count = res.data.data.public_metrics.followers_count;
        if (fake) {
            count = 0;
        }
        console.log(count);


        const oracle = new ethers.Contract(ev.address, ABI, provider);
        oracle.connect(signer).UpdateRequest(decoded[0], BigInt(count)).then((r) => {

            console.log("Sent resp to ", decoded[0]);
        })
    }).catch(er => {
        console.error(er);
    });

});
