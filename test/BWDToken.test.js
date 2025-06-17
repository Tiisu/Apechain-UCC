const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BWDToken", function () {
  let BWDToken, bwdToken;
  let MockAPE, mockAPE;
  let owner, addr1, addr2, addr3;
  let MINTER_ROLE, BURNER_ROLE, PAUSER_ROLE;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Deploy mock APE token
    MockAPE = await ethers.getContractFactory("MockERC20");
    mockAPE = await MockAPE.deploy("ApeCoin", "APE", ethers.utils.parseEther("1000000"));
    await mockAPE.deployed();

    // Deploy BWD Token
    BWDToken = await ethers.getContractFactory("BWDToken");
    bwdToken = await BWDToken.deploy(mockAPE.address, owner.address);
    await bwdToken.deployed();

    // Get role constants
    MINTER_ROLE = await bwdToken.MINTER_ROLE();
    BURNER_ROLE = await bwdToken.BURNER_ROLE();
    PAUSER_ROLE = await bwdToken.PAUSER_ROLE();
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await bwdToken.name()).to.equal("Bandwidth Token");
      expect(await bwdToken.symbol()).to.equal("BWD");
      expect(await bwdToken.decimals()).to.equal(18);
    });

    it("Should mint initial supply to admin", async function () {
      const initialSupply = ethers.utils.parseEther("1000000000"); // 1 billion
      expect(await bwdToken.totalSupply()).to.equal(initialSupply);
      expect(await bwdToken.balanceOf(owner.address)).to.equal(initialSupply);
    });

    it("Should set correct APE token address", async function () {
      expect(await bwdToken.apeTokenAddress()).to.equal(mockAPE.address);
    });

    it("Should grant correct roles to admin", async function () {
      expect(await bwdToken.hasRole(await bwdToken.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
      expect(await bwdToken.hasRole(MINTER_ROLE, owner.address)).to.be.true;
      expect(await bwdToken.hasRole(BURNER_ROLE, owner.address)).to.be.true;
      expect(await bwdToken.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("Should allow minter to mint tokens", async function () {
      const mintAmount = ethers.utils.parseEther("1000");
      await bwdToken.mint(addr1.address, mintAmount);
      expect(await bwdToken.balanceOf(addr1.address)).to.equal(mintAmount);
    });

    it("Should not allow non-minter to mint tokens", async function () {
      const mintAmount = ethers.utils.parseEther("1000");
      await expect(
        bwdToken.connect(addr1).mint(addr1.address, mintAmount)
      ).to.be.revertedWith("AccessControl:");
    });

    it("Should not allow minting beyond max supply", async function () {
      const maxSupply = ethers.utils.parseEther("10000000000"); // 10 billion
      const currentSupply = await bwdToken.totalSupply();
      const excessAmount = maxSupply.sub(currentSupply).add(1);
      
      await expect(
        bwdToken.mint(addr1.address, excessAmount)
      ).to.be.revertedWith("Exceeds max supply");
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      // Transfer some tokens to addr1 for testing
      await bwdToken.transfer(addr1.address, ethers.utils.parseEther("1000"));
    });

    it("Should allow burner to burn tokens", async function () {
      const burnAmount = ethers.utils.parseEther("100");
      const initialBalance = await bwdToken.balanceOf(owner.address);
      
      await bwdToken.burnWithReason(burnAmount, "Test burn");
      
      expect(await bwdToken.balanceOf(owner.address)).to.equal(initialBalance.sub(burnAmount));
    });

    it("Should burn tokens from data purchase", async function () {
      const purchaseAmount = ethers.utils.parseEther("100");
      const burnPercentage = await bwdToken.burnPercentage(); // 200 basis points = 2%
      const expectedBurn = purchaseAmount.mul(burnPercentage).div(10000);
      
      const initialBalance = await bwdToken.balanceOf(addr1.address);
      
      await bwdToken.burnFromDataPurchase(addr1.address, purchaseAmount);
      
      expect(await bwdToken.balanceOf(addr1.address)).to.equal(initialBalance.sub(expectedBurn));
    });
  });

  describe("APE Holder Verification", function () {
    beforeEach(async function () {
      // Give addr1 some APE tokens
      await mockAPE.transfer(addr1.address, ethers.utils.parseEther("10"));
    });

    it("Should correctly identify APE holders", async function () {
      expect(await bwdToken.isApeHolder(addr1.address)).to.be.true;
      expect(await bwdToken.isApeHolder(addr2.address)).to.be.false;
    });

    it("Should calculate APE holder bonus correctly", async function () {
      const baseAmount = ethers.utils.parseEther("100");
      const expectedBonus = baseAmount.mul(1000).div(10000); // 10% bonus
      
      expect(await bwdToken.getApeHolderBonus(addr1.address, baseAmount)).to.equal(expectedBonus);
      expect(await bwdToken.getApeHolderBonus(addr2.address, baseAmount)).to.equal(0);
    });
  });

  describe("Staking", function () {
    beforeEach(async function () {
      // Transfer some tokens to addr1 for staking
      await bwdToken.transfer(addr1.address, ethers.utils.parseEther("1000"));
    });

    it("Should allow users to stake tokens", async function () {
      const stakeAmount = ethers.utils.parseEther("100");
      const lockPeriod = 30; // 30 days
      
      await bwdToken.connect(addr1).stake(stakeAmount, lockPeriod);
      
      expect(await bwdToken.getUserStakedAmount(addr1.address)).to.equal(stakeAmount);
      expect(await bwdToken.totalStaked()).to.equal(stakeAmount);
    });

    it("Should not allow staking with invalid lock period", async function () {
      const stakeAmount = ethers.utils.parseEther("100");
      const invalidLockPeriod = 45; // Not in predefined periods
      
      await expect(
        bwdToken.connect(addr1).stake(stakeAmount, invalidLockPeriod)
      ).to.be.revertedWith("Invalid lock period");
    });

    it("Should calculate stake rewards correctly", async function () {
      const stakeAmount = ethers.utils.parseEther("100");
      const lockPeriod = 30; // 30 days, 5% APY
      
      await bwdToken.connect(addr1).stake(stakeAmount, lockPeriod);
      
      // Fast forward time to after lock period
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]); // 31 days
      await ethers.provider.send("evm_mine");
      
      const rewards = await bwdToken.calculateStakeRewards(addr1.address, 0);
      expect(rewards).to.be.gt(0);
    });

    it("Should not allow withdrawal before lock period", async function () {
      const stakeAmount = ethers.utils.parseEther("100");
      const lockPeriod = 30; // 30 days
      
      await bwdToken.connect(addr1).stake(stakeAmount, lockPeriod);
      
      await expect(
        bwdToken.connect(addr1).withdrawStake(0)
      ).to.be.revertedWith("Lock period not ended");
    });
  });

  describe("Voting Power", function () {
    beforeEach(async function () {
      // Transfer some tokens to addr1
      await bwdToken.transfer(addr1.address, ethers.utils.parseEther("1000"));
      // Give addr1 some APE tokens for bonus
      await mockAPE.transfer(addr1.address, ethers.utils.parseEther("10"));
    });

    it("Should calculate voting power correctly for regular holders", async function () {
      const balance = await bwdToken.balanceOf(addr2.address);
      const votingPower = await bwdToken.votingPower(addr2.address);
      expect(votingPower).to.equal(balance); // No staking, no APE bonus
    });

    it("Should give APE holders 2x voting power", async function () {
      const balance = await bwdToken.balanceOf(addr1.address);
      const votingPower = await bwdToken.votingPower(addr1.address);
      expect(votingPower).to.equal(balance.mul(2)); // 2x for APE holders
    });

    it("Should give staked tokens 1.5x voting power", async function () {
      const stakeAmount = ethers.utils.parseEther("100");
      const remainingBalance = ethers.utils.parseEther("900");
      
      await bwdToken.connect(addr1).stake(stakeAmount, 30);
      
      const votingPower = await bwdToken.votingPower(addr1.address);
      // Remaining balance + (staked * 1.5), all multiplied by 2 for APE bonus
      const expectedPower = remainingBalance.add(stakeAmount.mul(15).div(10)).mul(2);
      expect(votingPower).to.equal(expectedPower);
    });
  });

  describe("Administrative Functions", function () {
    it("Should allow admin to update APE token address", async function () {
      const newAPEAddress = addr3.address;
      await bwdToken.updateApeTokenAddress(newAPEAddress);
      expect(await bwdToken.apeTokenAddress()).to.equal(newAPEAddress);
    });

    it("Should allow admin to update burn percentage", async function () {
      const newBurnPercentage = 300; // 3%
      await bwdToken.updateBurnPercentage(newBurnPercentage);
      expect(await bwdToken.burnPercentage()).to.equal(newBurnPercentage);
    });

    it("Should not allow setting burn percentage too high", async function () {
      const highBurnPercentage = 1500; // 15% (above 10% max)
      await expect(
        bwdToken.updateBurnPercentage(highBurnPercentage)
      ).to.be.revertedWith("Burn percentage too high");
    });

    it("Should allow admin to pause and unpause", async function () {
      await bwdToken.pause();
      expect(await bwdToken.paused()).to.be.true;
      
      await expect(
        bwdToken.connect(addr1).transfer(addr2.address, ethers.utils.parseEther("100"))
      ).to.be.revertedWith("Pausable: paused");
      
      await bwdToken.unpause();
      expect(await bwdToken.paused()).to.be.false;
    });
  });

  describe("Contract Info", function () {
    it("Should return correct contract information", async function () {
      const info = await bwdToken.getContractInfo();
      
      expect(info._totalSupply).to.equal(await bwdToken.totalSupply());
      expect(info._maxSupply).to.equal(ethers.utils.parseEther("10000000000"));
      expect(info._apeTokenAddress).to.equal(mockAPE.address);
    });
  });
});
