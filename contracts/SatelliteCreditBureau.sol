// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { CCIPReceiver } from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import { IRouterClient } from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import { ICreditBureau } from "./interfaces/ICreditBureau.sol";
import { LinkTokenInterface } from "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import { Client } from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol"; 

contract SatelliteCreditBureau is CCIPReceiver {
    LinkTokenInterface public linkToken;
    address public routerAddress;
    address public admin;

    constructor(address router_, address link_) CCIPReceiver(router_) {
        linkToken = LinkTokenInterface(link_);
        routerAddress = router_;
        admin = msg.sender;
    }

    event CrossChainReportSent(string indexed destinationChain, address indexed reporter, address indexed user);
    event CrossChainReportReceived(ICreditBureau.Report report, address indexed user);

    function setRouter(address newRouter) external {
        routerAddress = newRouter;
    }

    function submitCreditReportWithLINK(
        string calldata destinationChain,
        string calldata destinationAddress,
        ICreditBureau.Report memory report,
        address user
    )
        external
    {
        bytes memory payload = abi.encode(report, user);
        uint256 fees = _calculateFees(destinationChain, destinationAddress, payload, address(linkToken));
        require(linkToken.transferFrom(msg.sender, address(this), fees), "Failed to transfer LINK for fees");
        _sendCrossChainMessage(destinationChain, destinationAddress, payload, address(linkToken));
        emit CrossChainReportSent(destinationChain, msg.sender, user);
    }

    function submitCreditReportWithNative(
        string calldata destinationChain,
        string calldata destinationAddress,
        ICreditBureau.Report memory report,
        address user
    )
        external
        payable
    {
        bytes memory payload = abi.encode(report, user);
        uint256 fees = _calculateFees(destinationChain, destinationAddress, payload, address(0));
        require(msg.value >= fees, "Insufficient native gas sent");
        _sendCrossChainMessage(destinationChain, destinationAddress, payload, address(0));
        emit CrossChainReportSent(destinationChain, msg.sender, user);
    }

    function _calculateFees(
        string memory destinationChain,
        string memory destinationAddress,
        bytes memory payload,
        address feeToken
    )
        internal
        view
        returns (uint256)
    {
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(destinationAddress),
            data: payload,
            tokenAmounts: new Client.EVMTokenAmount[](0), 
            extraArgs: _argsToBytes(Client.EVMExtraArgsV1({gasLimit: 200_000, strict: false})),
            feeToken: feeToken
        });

        uint64 destinationChainId = uint64(uint256(keccak256(bytes(destinationChain))));
        return IRouterClient(routerAddress).getFee(destinationChainId, message);
    }

    function _sendCrossChainMessage(
        string memory destinationChain, 
        string memory destinationAddress, 
        bytes memory payload, 
        address tokenAddress
    ) 
        internal 
    {
        uint64 destinationChainId = uint64(uint256(keccak256(bytes(destinationChain))));
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(destinationAddress),
            data: payload,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: _argsToBytes(Client.EVMExtraArgsV1({gasLimit: 200_000, strict: false})),
            feeToken: tokenAddress
        });
        IRouterClient(routerAddress).ccipSend(destinationChainId, message);
    }

    function _argsToBytes(Client.EVMExtraArgsV1 memory args) internal pure returns (bytes memory) {
        return abi.encode(args);
    }

    function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
        (ICreditBureau.Report memory report, address user) = abi.decode(message.data, (ICreditBureau.Report, address));
        emit CrossChainReportReceived(report, user);
    }
}