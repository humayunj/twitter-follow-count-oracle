pragma solidity ^0.8.0;
import "hardhat/console.sol";

contract FollowCountOracle {
    struct Request {
        uint256 id;
        string handle;
        address client;
        uint256[] submissions;
        mapping(address => bool) submitters;
    }

    uint256 minQuorum = 3;
    uint256 totalRequests = 0;

    Request[] requests;

    event RequestCreated(uint256 reqId, string handle);
    event RequestUpdated(uint256 reqId, uint256 followCount);

    function CreateRequest(string memory _handle) public returns (uint256) {
        require(bytes(_handle).length > 0, "handle cannot empty");
        requests.push();
        Request storage req = requests[totalRequests];
        req.id = totalRequests;
        req.handle = _handle;
        req.client = msg.sender;

        emit RequestCreated(totalRequests, _handle);
        return totalRequests++;
    }

    function UpdateRequest(uint256 reqId, uint256 val) public {
        require(val >= 0, "followers can't be negative");
        require(requests[reqId].id == reqId, "invalid req id");

        Request storage req = requests[reqId];
        require(req.submitters[msg.sender] == false, "already updated");
        // console.log("Got ",val);
        req.submissions.push(val);

        uint256 newLength = req.submissions.length;

        if (newLength >= minQuorum) {
            uint256 acc = 0;
            /**
             *  Compute average for now, later outliers can be removed and using central quadrants for computing average
             */
            for (uint256 i = 0; i < newLength; ++i) {
                acc += req.submissions[i];
            }
            acc /= newLength;

            emit RequestUpdated(reqId, acc);
            delete requests[reqId];
        }
    }
}
