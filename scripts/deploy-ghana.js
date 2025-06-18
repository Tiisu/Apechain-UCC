const { ethers } = require("hardhat");
const ghanaConfig = require("../config/ghana-config.json");

async function main() {
  console.log("🇬🇭 Starting ConnectShare Ghana deployment...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Configuration for Ghana
  const APE_TOKEN_ADDRESS = process.env.APE_TOKEN_ADDRESS || "0x4d224452801ACEd8B2F0aebE155379bb5D594381";
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
  
  // Grant roles for Ghana-specific operations
  await bwdToken.grantRole(await bwdToken.MINTER_ROLE(), bandwidthRewards.address);
  await bwdToken.grantRole(await bwdToken.MINTER_ROLE(), userManagement.address);
  await bwdToken.grantRole(await bwdToken.BURNER_ROLE(), dataBundlePurchase.address);
  await userManagement.grantRole(await userManagement.REPUTATION_MANAGER_ROLE(), bandwidthRewards.address);

  console.log("\n=== Adding Ghana-specific data bundles ===");
  
  // Ghana-focused data bundles with local pricing
  const ghanaBundles = [
    {
      provider: 1, // MTN
      name: "MTN Ghana 500MB Daily",
      dataAmount: 512, // 500MB
      bwdPrice: ethers.utils.parseEther("15"), // 15 BWD (~GHS 3)
      validityDays: 1,
      countries: ["GH"]
    },
    {
      provider: 1, // MTN
      name: "MTN Ghana 1GB Daily",
      dataAmount: 1024, // 1GB
      bwdPrice: ethers.utils.parseEther("25"), // 25 BWD (~GHS 5)
      validityDays: 1,
      countries: ["GH"]
    },
    {
      provider: 4, // VODACOM (Vodafone Ghana)
      name: "Vodafone Ghana 2GB Weekly",
      dataAmount: 2048, // 2GB
      bwdPrice: ethers.utils.parseEther("45"), // 45 BWD (~GHS 9)
      validityDays: 7,
      countries: ["GH"]
    },
    {
      provider: 2, // AIRTEL (AirtelTigo)
      name: "AirtelTigo Ghana 3GB Weekly",
      dataAmount: 3072, // 3GB
      bwdPrice: ethers.utils.parseEther("55"), // 55 BWD (~GHS 11)
      validityDays: 7,
      countries: ["GH"]
    },
    {
      provider: 1, // MTN
      name: "MTN Ghana 5GB Monthly",
      dataAmount: 5120, // 5GB
      bwdPrice: ethers.utils.parseEther("80"), // 80 BWD (~GHS 16)
      validityDays: 30,
      countries: ["GH"]
    },
    {
      provider: 4, // VODACOM
      name: "Vodafone Ghana Night Bundle 10GB",
      dataAmount: 10240, // 10GB
      bwdPrice: ethers.utils.parseEther("60"), // 60 BWD (~GHS 12) - night bundle discount
      validityDays: 1,
      countries: ["GH"]
    },
    {
      provider: 1, // MTN
      name: "MTN Ghana Student Bundle 3GB",
      dataAmount: 3072, // 3GB
      bwdPrice: ethers.utils.parseEther("35"), // 35 BWD (~GHS 7) - student discount
      validityDays: 7,
      countries: ["GH"]
    }
  ];

  for (const bundle of ghanaBundles) {
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

  console.log("\n=== Setting up Ghana-specific geographic bonuses ===");
  
  // Ghana regional bonuses based on development needs
  const ghanaGeographicBonuses = [
    { region: "Northern Region", geohash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ghana_northern")), bonus: 2500 }, // 25%
    { region: "Upper East", geohash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ghana_upper_east")), bonus: 2500 }, // 25%
    { region: "Upper West", geohash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ghana_upper_west")), bonus: 2500 }, // 25%
    { region: "Volta Region", geohash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ghana_volta")), bonus: 2000 }, // 20%
    { region: "Central Region", geohash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ghana_central")), bonus: 1500 }, // 15%
    { region: "Western Region", geohash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ghana_western")), bonus: 1500 }, // 15%
    { region: "Eastern Region", geohash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ghana_eastern")), bonus: 1000 }, // 10%
    { region: "Ashanti Rural", geohash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ghana_ashanti_rural")), bonus: 1000 }, // 10%
    { region: "Greater Accra Suburbs", geohash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ghana_accra_suburbs")), bonus: 500 }, // 5%
  ];

  for (const geoBonus of ghanaGeographicBonuses) {
    console.log(`Setting ${geoBonus.region} bonus: ${geoBonus.bonus / 100}%`);
    await bandwidthRewards.setGeographicBonus(geoBonus.geohash, geoBonus.bonus);
  }

  console.log("\n=== Configuring Ghana-specific reward parameters ===");
  
  // Update reward parameters for Ghana market
  await bandwidthRewards.updateRewardParams(
    ethers.utils.parseEther("15"), // 15 BWD per GB per hour (higher than default for Ghana)
    5000, // 50% quality multiplier
    3000, // 30% uptime multiplier
    2500, // 25% max geographic bonus
    1000, // 10% APE holder bonus
    256 * 1024 * 1024 // 256 MB minimum threshold (lower for Ghana)
  );

  console.log("\n=== Adding staking rewards pool ===");
  
  // Add initial staking rewards (5% of initial supply for Ghana launch)
  const stakingRewards = ethers.utils.parseEther("50000000"); // 50M BWD
  console.log("Adding Ghana staking rewards pool...");
  await bwdToken.addStakingRewards(stakingRewards);

  console.log("\n=== Ghana Deployment Summary ===");
  console.log("🇬🇭 Target Market: Ghana");
  console.log("💰 Primary Currency: GHS (Ghana Cedis)");
  console.log("📱 Mobile Money: MTN MoMo, Vodafone Cash, AirtelTigo Money");
  console.log("🌍 Geographic Focus: Northern, Upper East, Upper West regions");
  console.log("");
  console.log("Contract Addresses:");
  console.log("BWD Token:", bwdToken.address);
  console.log("Bandwidth Rewards:", bandwidthRewards.address);
  console.log("ConnectShare DAO:", connectShareDAO.address);
  console.log("Data Bundle Purchase:", dataBundlePurchase.address);
  console.log("User Management:", userManagement.address);

  // Save Ghana-specific deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    targetMarket: "Ghana",
    configuration: ghanaConfig,
    contracts: {
      BWDToken: bwdToken.address,
      BandwidthRewards: bandwidthRewards.address,
      ConnectShareDAO: connectShareDAO.address,
      DataBundlePurchase: dataBundlePurchase.address,
      UserManagement: userManagement.address
    },
    bundles: ghanaBundles.length,
    geographicBonuses: ghanaGeographicBonuses.length
  };

  const fs = require('fs');
  const deploymentFile = `deployments/ghana-${network.name}-deployment.json`;
  
  if (!fs.existsSync('deployments')) {
    fs.mkdirSync('deployments');
  }
  
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n📄 Ghana deployment info saved to: ${deploymentFile}`);

  console.log("\n✅ ConnectShare Ghana deployment completed successfully!");
  console.log("🚀 Ready to serve the Ghanaian market with affordable internet access!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Ghana deployment failed:", error);
    process.exit(1);
  });
