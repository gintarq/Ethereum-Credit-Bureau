const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Credit Bureau Tests", function () {
  let CreditBureau, SatelliteCreditBureau, creditBureau, satelliteCreditBureau;
  const routerAddress = "0xYourRouterAddressHere";  // Mock address for local tests; replace with actual address for testnet/mainnet deployment
  const linkAddress = "0xYourLinkAddressHere";      // Mock address for local tests; replace with actual address for testnet/mainnet deployment

  before(async function () {
    CreditBureau = await ethers.getContractFactory("CreditBureau");
    creditBureau = await CreditBureau.deploy(routerAddress);
    
    SatelliteCreditBureau = await ethers.getContractFactory("SatelliteCreditBureau");
    satelliteCreditBureau = await SatelliteCreditBureau.deploy(routerAddress, linkAddress);

    const MockRouter = await ethers.getContractFactory("MockRouter");
    mockRouter = await MockRouter.deploy();
    await mockRouter.deployed();
  });

  it("Submit local credit report", async function () {
    const [reporter, user] = await ethers.getSigners();
    
    const reportData = createReport();
    await creditBureau.connect(reporter).submitCreditReport(reportData, user.address);

    const report = await creditBureau.creditHistory(user.address, 0);
    runAsserts(report, reportData);
  });

  it("Submit remote credit report", async function () {
    const [reporter, user] = await ethers.getSigners();
    
    await mockRouter.setTargetContract(creditBureau.address);
    await satelliteCreditBureau.setRouter(mockRouter.address);

    const reportData = createReport();
    await satelliteCreditBureau.connect(reporter).submitCreditReportWithLINK("MockChain", creditBureau.address, reportData, user.address);

    const report = await creditBureau.creditHistory(user.address, 0);
    runAsserts(report, reportData);
  });

  function runAsserts(report, reportData) {
    assert.equal(report.creditProvider, reportData.creditProvider, "Mismatch in creditProvider");
    assert.equal(report.reporter, reportData.reporter, "Mismatch in reporter");
    assert.equal(report.review, reportData.review, "Mismatch in review");
    assert.equal(report.status, reportData.status, "Mismatch in status");
    assert.equal(report.credit.collateral, reportData.credit.collateral, "Mismatch in collateral");
    assert.equal(report.credit.creditType, reportData.credit.creditType, "Mismatch in creditType");
    assert.equal(report.credit.fromDate, reportData.credit.fromDate, "Mismatch in fromDate");
    assert.equal(report.credit.toDate, reportData.credit.toDate, "Mismatch in toDate");
    assert.equal(report.credit.amount, reportData.credit.amount, "Mismatch in amount");
    assert.equal(report.credit.token, reportData.credit.token, "Mismatch in token");
    assert.equal(ethers.utils.toUtf8String(report.data), ethers.utils.toUtf8String(reportData.data), "Mismatch in data");
  }

  function createReport() {
    const randomAddress = ethers.Wallet.createRandom().address;
    const randomReview = randomNumber(0, 2); // Assuming 0, 1, 2 are the valid enum values
    const randomStatus = randomNumber(0, 3); // Assuming 0, 1, 2, 3 are the valid enum values
    const randomCollateral = randomNumber(0, 2); // Assuming 0, 1, 2 are the valid enum values
    const randomCreditType = randomNumber(0, 1); // Assuming 0, 1 are the valid enum values

    // Construct the Report data with random parameters
    const reportData = {
      creditProvider: "Credit Protocol",
      reporter: reporter.address,
      review: randomReview,
      status: randomStatus,
      credit: {
        collateral: randomCollateral,
        creditType: randomCreditType,
        fromDate: Date.now() - randomNumber(1, 60) * 24 * 60 * 60 * 1000, // Up to 60 days ago
        toDate: Date.now(),
        amount: randomNumber(1, 1000000000) * 1000000,
        token: randomAddress,
        chain: 0, // Filled by the smart contract
      },
      timestamp: 0, // Filled by the smart contract
      data: ethers.utils.toUtf8Bytes("Randomized report data"),
    };

    return reportData;
  }

  function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
});
