const { ethers } = require("hardhat");

async function main() {
  console.log("Starting ConnectShare DApp deployment...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Configuration
  const APE_TOKEN_ADDRESS = process.env.APE_TOKEN_ADDRESS || "0x4d224452801ACEd8B2F0aebE155379bb5D594381"; // ApeCoin mainnet
  const ADMIN_ADDRESS = deployer.address;

  console.log("\n=== Deploying BWD Token Contract ===");
  const BWDToken = await ethers.getContractFactory("BWDToken");
  const bwdToken = await BWDToken.deploy(APE_TOKEN_ADDRESS, ADMIN_ADDRESS);
  await bwdToken.deployed();
  console.log("BWD Token deployed to:", bwdToken.address);

  console.log("\n=== Deploying Bandwidth Rewards Contract ===");
  const BandwidthRewards = await ethers.getContractFactory("BandwidthRewards");
  const bandwidthRewards = await BandwidthRewards.deploy(bwdToken.address, ADMIN_ADDRESS);
  await bandwidthRewards.deployed();
  console.log("Bandwidth Rewards deployed to:", bandwidthRewards.address);

  console.log("\n=== Deploying ConnectShare DAO Contract ===");
  const ConnectShareDAO = await ethers.getContractFactory("ConnectShareDAO");
  const connectShareDAO = await ConnectShareDAO.deploy(bwdToken.address, ADMIN_ADDRESS);
  await connectShareDAO.deployed();
  console.log("ConnectShare DAO deployed to:", connectShareDAO.address);

  console.log("\n=== Deploying Data Bundle Purchase Contract ===");
  const DataBundlePurchase = await ethers.getContractFactory("DataBundlePurchase");
  const dataBundlePurchase = await DataBundlePurchase.deploy(bwdToken.address, ADMIN_ADDRESS);
  await dataBundlePurchase.deployed();
  console.log("Data Bundle Purchase deployed to:", dataBundlePurchase.address);

  console.log("\n=== Deploying User Management Contract ===");
  const UserManagement = await ethers.getContractFactory("UserManagement");
  const userManagement = await UserManagement.deploy(bwdToken.address, ADMIN_ADDRESS);
  await userManagement.deployed();
  console.log("User Management deployed to:", userManagement.address);

  console.log("\n=== Setting up contract permissions ===");
  
  // Grant MINTER_ROLE to BandwidthRewards contract for reward distribution
  console.log("Granting MINTER_ROLE to BandwidthRewards contract...");
  await bwdToken.grantRole(await bwdToken.MINTER_ROLE(), bandwidthRewards.address);
  
  // Grant MINTER_ROLE to UserManagement contract for referral bonuses
  console.log("Granting MINTER_ROLE to UserManagement contract...");
  await bwdToken.grantRole(await bwdToken.MINTER_ROLE(), userManagement.address);
  
  // Grant BURNER_ROLE to DataBundlePurchase contract for token burning
  console.log("Granting BURNER_ROLE to DataBundlePurchase contract...");
  await bwdToken.grantRole(await bwdToken.BURNER_ROLE(), dataBundlePurchase.address);

  // Grant REPUTATION_MANAGER_ROLE to BandwidthRewards contract
  console.log("Granting REPUTATION_MANAGER_ROLE to BandwidthRewards contract...");
  await userManagement.grantRole(await userManagement.REPUTATION_MANAGER_ROLE(), bandwidthRewards.address);

  console.log("\n=== Adding initial data bundles ===");
  
  // Add sample data bundles for different providers
  const bundles = [
    {
      provider: 0, // SAFARICOM
      name: "Safaricom 1GB Daily",
      dataAmount: 1024, // 1GB in MB
      bwdPrice: ethers.utils.parseEther("50"), // 50 BWD
      validityDays: 1,
      countries: ["KE"]
    },
    {
      provider: 1, // MTN
      name: "MTN 2GB Weekly",
      dataAmount: 2048, // 2GB in MB
      bwdPrice: ethers.utils.parseEther("80"), // 80 BWD
      validityDays: 7,
      countries: ["NG", "GH", "UG"]
    },
    {
      provider: 2, // AIRTEL
      name: "Airtel 5GB Monthly",
      dataAmount: 5120, // 5GB in MB
      bwdPrice: ethers.utils.parseEther("150"), // 150 BWD
      validityDays: 30,
      countries: ["KE", "NG", "TZ"]
    }
  ];

  for (const bundle of bundles) {
    console.log(`Adding ${bundle.name}...`);
    await dataBundlePurchase.addDataBundle(
      bundle.provider,
      bundle.name,
      bundle.dataAmount,
      bundle.bwdPrice,
      bundle.validityDays,
      bundle.countries
    );
  }

  console.log("\n=== Setting up geographic bonuses ===");
  
  // Add geographic bonuses for underserved areas
  const geographicBonuses = [
    { geohash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("rural_kenya")), bonus: 2000 }, // 20% bonus
    { geohash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("rural_nigeria")), bonus: 1500 }, // 15% bonus
    { geohash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("rural_ghana")), bonus: 1500 }, // 15% bonus
  ];

  for (const geoBonus of geographicBonuses) {
    console.log(`Setting geographic bonus: ${geoBonus.bonus / 100}%`);
    await bandwidthRewards.setGeographicBonus(geoBonus.geohash, geoBonus.bonus);
  }

  console.log("\n=== Adding staking rewards pool ===");
  
  // Add initial staking rewards (10% of initial supply)
  const stakingRewards = ethers.utils.parseEther("100000000"); // 100M BWD
  console.log("Adding staking rewards pool...");
  await bwdToken.addStakingRewards(stakingRewards);

  console.log("\n=== Deployment Summary ===");
  console.log("BWD Token:", bwdToken.address);
  console.log("Bandwidth Rewards:", bandwidthRewards.address);
  console.log("ConnectShare DAO:", connectShareDAO.address);
  console.log("Data Bundle Purchase:", dataBundlePurchase.address);
  console.log("User Management:", userManagement.address);
  
  console.log("\n=== Contract Verification Commands ===");
  console.log(`npx hardhat verify --network ${network.name} ${bwdToken.address} "${APE_TOKEN_ADDRESS}" "${ADMIN_ADDRESS}"`);
  console.log(`npx hardhat verify --network ${network.name} ${bandwidthRewards.address} "${bwdToken.address}" "${ADMIN_ADDRESS}"`);
  console.log(`npx hardhat verify --network ${network.name} ${connectShareDAO.address} "${bwdToken.address}" "${ADMIN_ADDRESS}"`);
  console.log(`npx hardhat verify --network ${network.name} ${dataBundlePurchase.address} "${bwdToken.address}" "${ADMIN_ADDRESS}"`);
  console.log(`npx hardhat verify --network ${network.name} ${userManagement.address} "${bwdToken.address}" "${ADMIN_ADDRESS}"`);

  // Save deployment addresses to file
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      BWDToken: bwdToken.address,
      BandwidthRewards: bandwidthRewards.address,
      ConnectShareDAO: connectShareDAO.address,
      DataBundlePurchase: dataBundlePurchase.address,
      UserManagement: userManagement.address
    },
    configuration: {
      apeTokenAddress: APE_TOKEN_ADDRESS,
      adminAddress: ADMIN_ADDRESS
    }
  };

  const fs = require('fs');
  const deploymentFile = `deployments/${network.name}-deployment.json`;
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync('deployments')) {
    fs.mkdirSync('deployments');
  }
  
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to: ${deploymentFile}`);

  console.log("\n✅ ConnectShare DApp deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
