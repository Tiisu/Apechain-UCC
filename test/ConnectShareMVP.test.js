const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ConnectShare MVP", function () {
  let ConnectShareMVP, connectShareMVP;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy ConnectShare MVP
    ConnectShareMVP = await ethers.getContractFactory("ConnectShareMVP");
    connectShareMVP = await ConnectShareMVP.deploy();
    await connectShareMVP.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right token name and symbol", async function () {
      expect(await connectShareMVP.name()).to.equal("Bandwidth Token");
      expect(await connectShareMVP.symbol()).to.equal("BWD");
    });

    it("Should mint initial supply to contract", async function () {
      const contractBalance = await connectShareMVP.balanceOf(await connectShareMVP.getAddress());
      expect(contractBalance).to.equal(ethers.parseEther("1000000")); // 1M BWD
    });

    it("Should initialize data bundles", async function () {
      const bundleCount = await connectShareMVP.bundleCount();
      expect(bundleCount).to.equal(7); // 7 initial bundles
    });

    it("Should set Ghana regional bonuses", async function () {
      expect(await connectShareMVP.regionBonuses("Northern")).to.equal(25);
      expect(await connectShareMVP.regionBonuses("Greater Accra")).to.equal(5);
    });
  });

  describe("User Registration", function () {
    it("Should allow user registration", async function () {
      await connectShareMVP.connect(user1).registerUser(
        "+233241234567",
        "MTN Mobile Money"
      );

      const userInfo = await connectShareMVP.getUserInfo(user1.address);
      expect(userInfo.registered).to.be.true;
      expect(userInfo.phoneNumber).to.equal("+233241234567");
      expect(userInfo.mobileMoneyProvider).to.equal("MTN Mobile Money");
      expect(userInfo.reputationScore).to.equal(100);
    });

    it("Should give welcome bonus on registration", async function () {
      await connectShareMVP.connect(user1).registerUser(
        "+233241234567",
        "MTN Mobile Money"
      );

      const balance = await connectShareMVP.balanceOf(user1.address);
      expect(balance).to.equal(ethers.parseEther("10")); // 10 BWD welcome bonus
    });

    it("Should not allow duplicate registration", async function () {
      await connectShareMVP.connect(user1).registerUser(
        "+233241234567",
        "MTN Mobile Money"
      );

      await expect(
        connectShareMVP.connect(user1).registerUser(
          "+233241234568",
          "Vodafone Cash"
        )
      ).to.be.revertedWith("User already registered");
    });

    it("Should reject invalid mobile money provider", async function () {
      await expect(
        connectShareMVP.connect(user1).registerUser(
          "+233241234567",
          "Invalid Provider"
        )
      ).to.be.revertedWith("Invalid mobile money provider");
    });
  });

  describe("Bandwidth Submission", function () {
    beforeEach(async function () {
      // Register user first
      await connectShareMVP.connect(user1).registerUser(
        "+233241234567",
        "MTN Mobile Money"
      );
    });

    it("Should allow bandwidth submission and reward user", async function () {
      const initialBalance = await connectShareMVP.balanceOf(user1.address);
      
      await connectShareMVP.connect(user1).submitBandwidth(1024, "Northern"); // 1GB from Northern region
      
      const finalBalance = await connectShareMVP.balanceOf(user1.address);
      const userInfo = await connectShareMVP.getUserInfo(user1.address);
      
      // Should receive base reward (10 BWD) + 25% Northern bonus = 12.5 BWD
      expect(finalBalance).to.be.gt(initialBalance);
      expect(userInfo.totalBandwidthShared).to.equal(1024);
      expect(userInfo.reputationScore).to.equal(101); // Increased by 1
    });

    it("Should apply correct regional bonuses", async function () {
      const initialBalance = await connectShareMVP.balanceOf(user1.address);
      
      // Submit from Greater Accra (5% bonus)
      await connectShareMVP.connect(user1).submitBandwidth(1024, "Greater Accra");
      
      const balanceAfterAccra = await connectShareMVP.balanceOf(user1.address);
      const rewardAccra = balanceAfterAccra - initialBalance;
      
      // Reset for comparison
      await connectShareMVP.connect(user2).registerUser("+233241234568", "MTN Mobile Money");
      const initialBalance2 = await connectShareMVP.balanceOf(user2.address);
      
      // Submit from Northern (25% bonus)
      await connectShareMVP.connect(user2).submitBandwidth(1024, "Northern");
      
      const balanceAfterNorthern = await connectShareMVP.balanceOf(user2.address);
      const rewardNorthern = balanceAfterNorthern - initialBalance2;
      
      // Northern should have higher reward due to higher bonus
      expect(rewardNorthern).to.be.gt(rewardAccra);
    });

    it("Should track user submissions", async function () {
      await connectShareMVP.connect(user1).submitBandwidth(512, "Volta");
      await connectShareMVP.connect(user1).submitBandwidth(1024, "Northern");
      
      const submissions = await connectShareMVP.getUserSubmissions(user1.address);
      expect(submissions.length).to.equal(2);
      expect(submissions[0].amount).to.equal(512);
      expect(submissions[0].location).to.equal("Volta");
      expect(submissions[1].amount).to.equal(1024);
      expect(submissions[1].location).to.equal("Northern");
    });

    it("Should not allow unregistered users to submit", async function () {
      await expect(
        connectShareMVP.connect(user2).submitBandwidth(1024, "Northern")
      ).to.be.revertedWith("User not registered");
    });
  });

  describe("Data Bundle Purchase", function () {
    beforeEach(async function () {
      // Register user and give them some BWD
      await connectShareMVP.connect(user1).registerUser(
        "+233241234567",
        "MTN Mobile Money"
      );
      
      // Submit bandwidth to earn more BWD
      await connectShareMVP.connect(user1).submitBandwidth(2048, "Northern"); // 2GB from Northern
    });

    it("Should allow data bundle purchase", async function () {
      const initialBalance = await connectShareMVP.balanceOf(user1.address);
      
      // Purchase MTN 1GB Daily bundle (bundle ID 1, costs 25 BWD)
      await connectShareMVP.connect(user1).purchaseDataBundle(1);
      
      const finalBalance = await connectShareMVP.balanceOf(user1.address);
      expect(finalBalance).to.equal(initialBalance - ethers.parseEther("25"));
    });

    it("Should not allow purchase with insufficient balance", async function () {
      // Try to purchase expensive bundle without enough BWD
      await expect(
        connectShareMVP.connect(user1).purchaseDataBundle(7) // AirtelTigo 10GB Monthly (120 BWD)
      ).to.be.revertedWith("Insufficient BWD balance");
    });

    it("Should not allow unregistered users to purchase", async function () {
      await expect(
        connectShareMVP.connect(user2).purchaseDataBundle(1)
      ).to.be.revertedWith("User not registered");
    });

    it("Should not allow purchase of invalid bundle", async function () {
      await expect(
        connectShareMVP.connect(user1).purchaseDataBundle(999)
      ).to.be.revertedWith("Invalid bundle ID");
    });
  });

  describe("Withdrawal Request", function () {
    beforeEach(async function () {
      await connectShareMVP.connect(user1).registerUser(
        "+233241234567",
        "MTN Mobile Money"
      );
    });

    it("Should allow withdrawal request", async function () {
      const withdrawalAmount = ethers.parseEther("5");
      
      await expect(
        connectShareMVP.connect(user1).requestWithdrawal(withdrawalAmount)
      ).to.emit(connectShareMVP, "WithdrawalRequested")
        .withArgs(user1.address, withdrawalAmount, "MTN Mobile Money");
    });

    it("Should not allow withdrawal with insufficient balance", async function () {
      const withdrawalAmount = ethers.parseEther("100"); // More than welcome bonus
      
      await expect(
        connectShareMVP.connect(user1).requestWithdrawal(withdrawalAmount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should not allow unregistered users to withdraw", async function () {
      await expect(
        connectShareMVP.connect(user2).requestWithdrawal(ethers.parseEther("1"))
      ).to.be.revertedWith("User not registered");
    });
  });

  describe("Data Bundles", function () {
    it("Should return all available bundles", async function () {
      const bundles = await connectShareMVP.getDataBundles();
      expect(bundles.length).to.equal(7);
      
      // Check first bundle (MTN 1GB Daily)
      expect(bundles[0].name).to.equal("MTN 1GB Daily");
      expect(bundles[0].provider).to.equal("MTN Ghana");
      expect(bundles[0].dataMB).to.equal(1024);
      expect(bundles[0].priceInBWD).to.equal(ethers.parseEther("25"));
      expect(bundles[0].active).to.be.true;
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to add new data bundle", async function () {
      await connectShareMVP.addDataBundle(
        "Test Bundle",
        512,
        ethers.parseEther("15"),
        "Test Provider"
      );
      
      const bundleCount = await connectShareMVP.bundleCount();
      expect(bundleCount).to.equal(8);
      
      const newBundle = await connectShareMVP.dataBundles(8);
      expect(newBundle.name).to.equal("Test Bundle");
    });

    it("Should allow owner to update region bonus", async function () {
      await connectShareMVP.updateRegionBonus("Test Region", 30);
      expect(await connectShareMVP.regionBonuses("Test Region")).to.equal(30);
    });

    it("Should not allow non-owner to call admin functions", async function () {
      await expect(
        connectShareMVP.connect(user1).addDataBundle(
          "Test Bundle",
          512,
          ethers.parseEther("15"),
          "Test Provider"
        )
      ).to.be.revertedWithCustomError(connectShareMVP, "OwnableUnauthorizedAccount");
    });
  });
});
