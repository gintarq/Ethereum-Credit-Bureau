const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Credit Bureau Tests", function () {
  let CreditBureau, SatelliteCreditBureau, creditBureau, satelliteCreditBureau, mockRouter;

  const routerAddress = "0x1111111111111111111111111111111111111111";  // Mock address for local tests
  const linkAddress = "0x2222222222222222222222222222222222222222";   // Mock address for local tests

  before(async function () {
    CreditBureau = await ethers.getContractFactory("CreditBureau");
    creditBureau = await CreditBureau.deploy(routerAddress);
    
    SatelliteCreditBureau = await ethers.getContractFactory("SatelliteCreditBureau");
    satelliteCreditBureau = await SatelliteCreditBureau.deploy(routerAddress, linkAddress);

    const MockRouter = await ethers.getContractFactory("MockRouter");
    mockRouter = await MockRouter.deploy();
  });

  it("Submit local credit report", async function () {
    const [reporter, user] = await ethers.getSigners();
    
    const reportData = createReport(reporter);
    await creditBureau.connect(reporter).submitCreditReport(reportData, user.address);

    const report = await creditBureau.creditHistory(user.address, 0);
    runAsserts(report, reportData);
  });

  it("Submit remote credit report", async function () {
    const [reporter, user] = await ethers.getSigners();
    
    await mockRouter.setTargetContract(creditBureau.address);
    await satelliteCreditBureau.setRouter(mockRouter.address);

    const reportData = createReport(reporter);
    await satelliteCreditBureau.connect(reporter).submitCreditReportWithLINK("MockChain", creditBureau.address, reportData, user.address);

    const report = await creditBureau.creditHistory(user.address, 0);
    runAsserts(report, reportData);
  });

  function runAsserts(report, reportData) {
    expect(report.creditProvider).to.equal(reportData.creditProvider, "Mismatch in creditProvider");
    expect(report.reporter).to.equal(reportData.reporter, "Mismatch in reporter");
    expect(report.review).to.equal(reportData.review, "Mismatch in review");
    expect(report.status).to.equal(reportData.status, "Mismatch in status");
    expect(report.credit.collateral).to.equal(reportData.credit.collateral, "Mismatch in collateral");
    expect(report.credit.creditType).to.equal(reportData.credit.creditType, "Mismatch in creditType");
    expect(report.credit.fromDate).to.equal(reportData.credit.fromDate, "Mismatch in fromDate");
    expect(report.credit.toDate).to.equal(reportData.credit.toDate, "Mismatch in toDate");
    expect(report.credit.amount).to.equal(reportData.credit.amount, "Mismatch in amount");
    expect(report.credit.token).to.equal(reportData.credit.token, "Mismatch in token");
    expect(ethers.utils.toUtf8String(report.data)).to.equal(ethers.utils.toUtf8String(reportData.data), "Mismatch in data");
  }

  function createReport(reporter) {
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
