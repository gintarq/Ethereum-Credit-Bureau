// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { CCIPReceiver } from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import { Client } from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import { ICreditBureau } from "./interfaces/ICreditBureau.sol";

contract CreditBureau is ICreditBureau, CCIPReceiver {
    using Strings for string;

    mapping(address => bool) public whitelist;
    mapping(address => Report[]) public creditHistory;

    event WhitelistToggled(address indexed operator, bool status);
    event CreditReportAdded(address indexed reporter, address indexed user);

    modifier onlyWhitelisted() {
        require(whitelist[msg.sender], "Sender is not whitelisted");
        _;
    }

    constructor(address router_) CCIPReceiver(router_) {}

    function toggleWhitelist(address _address) public {
        whitelist[_address] = !whitelist[_address];
        emit WhitelistToggled(_address, whitelist[_address]);
    }

    function viewCreditSummary(address _wallet)
        public
        view
        returns (
            uint256 lengthOfCreditHistory,
            uint256 earliestReport,
            uint256 latestReport,
            uint256 totalOpenCreditLines,
            uint256 mostRecentCreditLineOpenDate,
            uint256 totalNumberOfRecords,
            uint256 totalNegativeReviews
        )
    {
        Report[] memory reports = creditHistory[_wallet];
        totalNumberOfRecords = reports.length;

        if (totalNumberOfRecords == 0) return (0, 0, 0, 0, 0, 0, 0);

        earliestReport = reports[0].timestamp;
        latestReport = reports[0].timestamp;

        for (uint256 i = 0; i < totalNumberOfRecords; i++) {
            if (reports[i].review == Review.NEGATIVE) totalNegativeReviews++;
            if (reports[i].status == Status.OPENED) totalOpenCreditLines++;
            if (reports[i].credit.fromDate > mostRecentCreditLineOpenDate) {
                mostRecentCreditLineOpenDate = reports[i].credit.fromDate;
            }
            if (reports[i].timestamp < earliestReport) earliestReport = reports[i].timestamp;
            if (reports[i].timestamp > latestReport) latestReport = reports[i].timestamp;
        }

        lengthOfCreditHistory = (latestReport - earliestReport) / 30 days;
    }

    function submitCreditReport(Report memory report, address user) external override onlyWhitelisted {
        _addReport(report, msg.sender, user, block.chainid);
    }

    function _addReport(Report memory report, address reporter, address user, uint256 chainId) internal {
        report.credit.chain = chainId;
        report.timestamp = block.timestamp;
        report.reporter = reporter;

        creditHistory[user].push(report);

        emit CreditReportAdded(reporter, user);
    }

    function _ccipReceive(
        Client.Any2EVMMessage memory any2EvmMessage
    )
        internal
        override
    {
        (Report memory report, address user) = abi.decode(any2EvmMessage.data, (Report, address));
        _addReport(report, abi.decode(any2EvmMessage.sender, (address)), user, uint256(any2EvmMessage.sourceChainSelector));
    }
}