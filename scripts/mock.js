
const hre = require("hardhat");
const axios = require("axios")
const chalk = require("chalk");
require("dotenv").config();

const mainLog = (str, ...args) => console.log(chalk.green(`[Main] ${str}`, ...args));
const nodeLog = (nodeId, str, ...args) => console.log(chalk.blue(`[Node ${nodeId}] ${str}`, ...args));

const TWITTER_API_KEY = false && process.env.TWITTER_API_KEY;

async function settleRequest(oracle, nodeId, reqId, handle, isFake = false) {
  let count = 0;
  if (isFake ) { // if fake, respond with random follow count
    count = Math.floor(Math.random() * 100);
    nodeLog(nodeId, `Using fake follow count ${count} for ${handle}`)
  }
  else if (!TWITTER_API_KEY) {
    nodeLog(nodeId, `Twitter API key is not provided using 10 as follow count for ${handle}`)
    count = 10;
  }
  else {
    nodeLog(nodeId, `Resolving follow count of ${handle} from twitter API`)
    const { data } = await axios.get(`https://api.twitter.com/2/users/by/username/${handle}?user.fields=public_metrics`, {
      headers: {
        "Authorization": `Bearer ${TWITTER_API_KEY}`
      }
    });
    count = data.data.public_metrics.followers_count;
  }
  nodeLog(nodeId, `DISPATCH::UpdateRequest  reqId ${reqId} Follow Count ${count}`);
  await oracle.UpdateRequest(reqId, BigInt(count));
}


async function createRequest(oracle, signers, handle) {

  mainLog(`DISPATCH::CreateRequest  handle ${handle}`);
  return await (oracle.connect(signers).CreateRequest(handle)).data;

}

async function attachEventListeners(oracle) {
  oracle.on(oracle.filters.RequestCreated(), (reqId, handle) => {
    mainLog(`EVENT::RequestCreated: reqId ${reqId}, handle '${handle}'`)

    // Make sure minQuorum is satisfied in contract
    let i = 1;
    for (; i <= 3; i++) {
      settleRequest(oracle, i, reqId, handle, false); // run nodes
    }

    // settleRequest(oracle, i, reqId, handle, true);// fake node

  });

  oracle.on(oracle.filters.RequestUpdated(), (reqId, followCount) => {
    mainLog( chalk.yellowBright(`EVENT::RequestUpdated: reqId ${reqId}, Follow Count '${followCount}'`))
    setTimeout(() => {
      mainLog("Gracefully exiting...");
      process.exit(0)
    }, 100);
  })
}

async function deployContract() {
  const Oracle = await hre.ethers.getContractFactory("FollowCountOracle");
  const oracle = await Oracle.deploy();

  await oracle.deployed();
  return oracle;
}

async function main() {

  const accounts = await hre.ethers.getSigners();
  mainLog(`Deploying contract`);
  const oracle = await deployContract()

  mainLog("[Main] Oracle deployed to:", oracle.address);

  mainLog("[Main] Attaching listeners");
  attachEventListeners(oracle);
  createRequest(oracle, accounts[0], "humayun219");

}
main();
// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });
