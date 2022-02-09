const { expect } = require("chai");
const { ethers } = require("hardhat")


describe("Follow Count Oracle", () => {


    let oracle; // contract instance
    const MUSK_HANDLE = "humayun219";


    before(async () => {
        const fact = await ethers.getContractFactory("FollowCountOracle");

        oracle = await fact.deploy();
        // ethers.provider.on({}, (log, event) => {
        //     console.log("LOG:", log);
        //     console.log("EV:", event);
        // });


        await oracle.deployed();
    });





    it("Creates a request for musk handle", async () => {

        filter = {
            topics: [
                ethers.utils.id("RequestCreated(uint256 reqId, string handle)")
            ]
        }
        console.log("Waiting...");
        let t = 0;

        await expect(oracle.CreateRequest(MUSK_HANDLE)).to.emit(oracle, "RequestCreated").then()
        await new Promise((res) => {
            oracle.once(oracle.filters.RequestUpdated(), (reqId, followCount) => {
                console.log(reqId, ":", followCount);
                res(true);
            });
        });


    });
})