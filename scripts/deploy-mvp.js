const { ethers, network } = require("hardhat");

async function main() {
  console.log("🇬🇭 Deploying ConnectShare MVP for Ghana...");
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.config.chainId})`);

  // Network-specific configurations
  const networkInfo = {
    apechain: {
      name: "APE Chain Mainnet",
      currency: "APE",
      explorer: "https://apechain.calderaexplorer.xyz/"
    },
    curtis: {
      name: "APE Chain Testnet (Curtis)",
      currency: "APE",
      explorer: "https://curtis.explorer.caldera.xyz/"
    },
    hardhat: {
      name: "Hardhat Local Network",
      currency: "ETH",
      explorer: "N/A"
    }
  };

  const currentNetwork = networkInfo[network.name] || {
    name: network.name,
    currency: "ETH",
    explorer: "Unknown"
  };

  console.log(`🌐 Deploying to: ${currentNetwork.name}`);
  console.log(`💰 Native Currency: ${currentNetwork.currency}`);
  console.log(`🔍 Explorer: ${currentNetwork.explorer}`);

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), currentNetwork.currency);

  console.log("\n=== Deploying ConnectShare MVP Contract ===");
  
  // Deploy the MVP contract
  const ConnectShareMVP = await ethers.getContractFactory("ConnectShareMVP");
  const connectShareMVP = await ConnectShareMVP.deploy();
  await connectShareMVP.waitForDeployment();
  
  const contractAddress = await connectShareMVP.getAddress();
  console.log("ConnectShare MVP deployed to:", contractAddress);

  console.log("\n=== MVP Contract Information ===");
  
  // Get contract info
  const name = await connectShareMVP.name();
  const symbol = await connectShareMVP.symbol();
  const totalSupply = await connectShareMVP.totalSupply();
  const bundleCount = await connectShareMVP.bundleCount();
  
  console.log("Token Name:", name);
  console.log("Token Symbol:", symbol);
  console.log("Total Supply:", ethers.formatEther(totalSupply), "BWD");
  console.log("Data Bundles Available:", bundleCount.toString());

  console.log("\n=== Available Data Bundles ===");
  
  // Display available bundles
  const bundles = await connectShareMVP.getDataBundles();
  bundles.forEach((bundle, index) => {
    console.log(`${index + 1}. ${bundle.name}`);
    console.log(`   Provider: ${bundle.provider}`);
    console.log(`   Data: ${bundle.dataMB} MB`);
    console.log(`   Price: ${ethers.formatEther(bundle.priceInBWD)} BWD`);
    console.log(`   Active: ${bundle.active}`);
    console.log("");
  });

  console.log("=== Ghana Regional Bonuses ===");
  const regions = [
    "Northern", "Upper East", "Upper West", "Volta", 
    "Central", "Western", "Eastern", "Ashanti", "Greater Accra"
  ];
  
  for (const region of regions) {
    const bonus = await connectShareMVP.regionBonuses(region);
    console.log(`${region}: ${bonus}% bonus`);
  }

  console.log("\n=== Supported Mobile Money Providers ===");
  const providers = await Promise.all([
    connectShareMVP.supportedProviders(0),
    connectShareMVP.supportedProviders(1),
    connectShareMVP.supportedProviders(2)
  ]);
  providers.forEach((provider, index) => {
    console.log(`${index + 1}. ${provider}`);
  });

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contract: {
      name: "ConnectShareMVP",
      address: contractAddress,
      tokenName: name,
      tokenSymbol: symbol,
      totalSupply: ethers.formatEther(totalSupply)
    },
    bundles: bundles.map(bundle => ({
      name: bundle.name,
      provider: bundle.provider,
      dataMB: bundle.dataMB.toString(),
      priceInBWD: ethers.formatEther(bundle.priceInBWD)
    })),
    regions: {},
    mobileMoneyProviders: providers
  };

  // Add region bonuses to deployment info
  for (const region of regions) {
    const bonus = await connectShareMVP.regionBonuses(region);
    deploymentInfo.regions[region] = bonus.toString() + "%";
  }

  const fs = require('fs');
  const deploymentFile = `deployments/mvp-${network.name}-deployment.json`;
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync('deployments')) {
    fs.mkdirSync('deployments');
  }
  
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n📄 MVP deployment info saved to: ${deploymentFile}`);

  console.log("\n=== Contract Verification Command ===");
  console.log(`npx hardhat verify --network ${network.name} ${contractAddress}`);

  console.log("\n=== Next Steps for MVP Testing ===");
  console.log("1. 📱 Build web frontend with wallet integration");
  console.log("2. 🤖 Integrate AI chatbot for data purchases");
  console.log("3. 💰 Set up mobile money withdrawal simulation");
  console.log("4. 🧪 Test with Ghana users in Accra/Kumasi");
  console.log("5. 📊 Monitor bandwidth submissions and rewards");

  console.log("\n=== Sample User Journey ===");
  console.log("1. User connects wallet and registers with phone number");
  console.log("2. User submits bandwidth sharing data (e.g., 500MB from 'Northern' region)");
  console.log("3. User receives BWD tokens automatically (with 25% Northern region bonus)");
  console.log("4. User purchases MTN 1GB bundle for 25 BWD");
  console.log("5. User requests withdrawal to MTN Mobile Money");

  console.log("\n✅ ConnectShare MVP deployment completed successfully!");
  console.log("🚀 Ready to democratize internet access in Ghana!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("MVP deployment failed:", error);
    process.exit(1);
  });
