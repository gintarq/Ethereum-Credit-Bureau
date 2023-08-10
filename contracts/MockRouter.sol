// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockRouter {

    address public targetContract;

    event MessageForwarded(address sender, bytes data);

    constructor() {}

    function setTargetContract(address _targetContract) external {
        targetContract = _targetContract;
    }

    // This function simulates the forwarding of a CCIP message to the target contract
    function forwardMessage(bytes memory data) external {
        require(targetContract != address(0), "Target contract not set");
        (bool success,) = targetContract.call(data);
        require(success, "Forwarding failed");
        emit MessageForwarded(msg.sender, data);
    }
}
