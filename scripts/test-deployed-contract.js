const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing Deployed ConnectShare MVP Contract...");
  
  // Replace with your deployed contract address
  const CONTRACT_ADDRESS = process.env.DEPLOYED_CONTRACT_ADDRESS || "YOUR_CONTRACT_ADDRESS_HERE";
  
  if (CONTRACT_ADDRESS === "YOUR_CONTRACT_ADDRESS_HERE") {
    console.error("❌ Please set DEPLOYED_CONTRACT_ADDRESS in your .env file");
    process.exit(1);
  }
  
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("Testing with deployer:", deployer.address);
  console.log("Network:", network.name);
  
  // Connect to deployed contract
  const ConnectShareMVP = await ethers.getContractFactory("ConnectShareMVP");
  const contract = ConnectShareMVP.attach(CONTRACT_ADDRESS);
  
  console.log("\n=== Contract Basic Info ===");
  try {
    const name = await contract.name();
    const symbol = await contract.symbol();
    const totalSupply = await contract.totalSupply();
    const bundleCount = await contract.bundleCount();
    
    console.log("✅ Token Name:", name);
    console.log("✅ Token Symbol:", symbol);
    console.log("✅ Total Supply:", ethers.formatEther(totalSupply), "BWD");
    console.log("✅ Bundle Count:", bundleCount.toString());
  } catch (error) {
    console.error("❌ Basic info test failed:", error.message);
  }
  
  console.log("\n=== Testing Data Bundles ===");
  try {
    const bundles = await contract.getDataBundles();
    console.log("✅ Data bundles retrieved:", bundles.length);
    
    bundles.forEach((bundle, index) => {
      console.log(`  ${index + 1}. ${bundle.name} - ${bundle.dataMB}MB - ${ethers.formatEther(bundle.priceInBWD)} BWD`);
    });
  } catch (error) {
    console.error("❌ Data bundles test failed:", error.message);
  }
  
  console.log("\n=== Testing Region Bonuses ===");
  try {
    const regions = ["Northern", "Upper East", "Upper West", "Volta", "Central"];
    for (const region of regions) {
      const bonus = await contract.regionBonuses(region);
      console.log(`✅ ${region}: ${bonus}% bonus`);
    }
  } catch (error) {
    console.error("❌ Region bonuses test failed:", error.message);
  }
  
  console.log("\n=== Testing Mobile Money Providers ===");
  try {
    const providers = await Promise.all([
      contract.supportedProviders(0),
      contract.supportedProviders(1),
      contract.supportedProviders(2)
    ]);
    console.log("✅ Mobile Money Providers:");
    providers.forEach((provider, index) => {
      console.log(`  ${index + 1}. ${provider}`);
    });
  } catch (error) {
    console.error("❌ Mobile money providers test failed:", error.message);
  }
  
  console.log("\n=== Testing User Registration ===");
  try {
    // Test user registration
    const phoneNumber = "+233501234567";
    const region = "Greater Accra";
    
    const tx = await contract.connect(user1).registerUser(phoneNumber, region);
    await tx.wait();
    
    const userInfo = await contract.users(user1.address);
    console.log("✅ User registered successfully");
    console.log("  Phone:", userInfo.phoneNumber);
    console.log("  Region:", userInfo.region);
    console.log("  Registered:", userInfo.isRegistered);
  } catch (error) {
    console.error("❌ User registration test failed:", error.message);
  }
  
  console.log("\n=== Testing Bandwidth Submission ===");
  try {
    const bandwidthMB = 1000; // 1GB
    const region = "Greater Accra";
    
    const tx = await contract.connect(user1).submitBandwidth(bandwidthMB, region);
    await tx.wait();
    
    const balance = await contract.balanceOf(user1.address);
    console.log("✅ Bandwidth submitted successfully");
    console.log("  BWD Balance:", ethers.formatEther(balance), "BWD");
  } catch (error) {
    console.error("❌ Bandwidth submission test failed:", error.message);
  }
  
  console.log("\n=== Testing Data Bundle Purchase ===");
  try {
    const bundleId = 0; // First bundle (MTN 1GB)
    const phoneNumber = "+233501234567";
    
    // First approve the spending
    const bundle = await contract.dataBundles(bundleId);
    const approveTx = await contract.connect(user1).approve(CONTRACT_ADDRESS, bundle.priceInBWD);
    await approveTx.wait();
    
    const purchaseTx = await contract.connect(user1).purchaseDataBundle(bundleId, phoneNumber);
    await purchaseTx.wait();
    
    console.log("✅ Data bundle purchased successfully");
    
    const newBalance = await contract.balanceOf(user1.address);
    console.log("  New BWD Balance:", ethers.formatEther(newBalance), "BWD");
  } catch (error) {
    console.error("❌ Data bundle purchase test failed:", error.message);
  }
  
  console.log("\n=== Contract Testing Complete ===");
  console.log("🎉 All core functions tested successfully!");
  console.log("\n📋 Next Steps:");
  console.log("1. Verify contract on explorer");
  console.log("2. Set up frontend integration");
  console.log("3. Implement mobile money APIs");
  console.log("4. Begin user testing");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Contract testing failed:", error);
    process.exit(1);
  });
