const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Comprehensive ConnectShare MVP Testing Suite");
  console.log("===============================================\n");
  
  const CONTRACT_ADDRESS = process.env.DEPLOYED_CONTRACT_ADDRESS;
  
  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "YOUR_CONTRACT_ADDRESS_HERE") {
    console.error("❌ Please set DEPLOYED_CONTRACT_ADDRESS in your .env file");
    process.exit(1);
  }
  
  const [deployer, user1, user2, user3] = await ethers.getSigners();
  console.log(`🌐 Network: ${network.name}`);
  console.log(`📍 Contract: ${CONTRACT_ADDRESS}`);
  console.log(`👤 Test Users: ${[user1, user2, user3].map(u => u.address).join(', ')}\n`);
  
  // Connect to deployed contract
  const ConnectShareMVP = await ethers.getContractFactory("ConnectShareMVP");
  const contract = ConnectShareMVP.attach(CONTRACT_ADDRESS);
  
  // Test Results Tracking
  const testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  const runTest = async (testName, testFunction) => {
    try {
      console.log(`🔄 Running: ${testName}`);
      await testFunction();
      console.log(`✅ PASSED: ${testName}\n`);
      testResults.passed++;
      testResults.tests.push({ name: testName, status: 'PASSED' });
    } catch (error) {
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}\n`);
      testResults.failed++;
      testResults.tests.push({ name: testName, status: 'FAILED', error: error.message });
    }
  };
  
  // TEST 1: Contract Basic Information
  await runTest("Contract Basic Information", async () => {
    const name = await contract.name();
    const symbol = await contract.symbol();
    const totalSupply = await contract.totalSupply();
    const bundleCount = await contract.bundleCount();
    
    console.log(`   Token: ${name} (${symbol})`);
    console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} BWD`);
    console.log(`   Data Bundles: ${bundleCount}`);
    
    if (name !== "Bandwidth Token" || symbol !== "BWD") {
      throw new Error("Incorrect token name or symbol");
    }
  });
  
  // TEST 2: Data Bundles Configuration
  await runTest("Data Bundles Configuration", async () => {
    const bundles = await contract.getDataBundles();
    console.log(`   Found ${bundles.length} data bundles:`);
    
    const expectedBundles = [
      { name: "MTN 1GB", provider: "MTN Ghana", dataMB: 1024, price: "25.0" },
      { name: "Vodafone 2GB", provider: "Vodafone Ghana", dataMB: 2048, price: "45.0" },
      { name: "AirtelTigo 500MB", provider: "AirtelTigo Ghana", dataMB: 512, price: "15.0" }
    ];
    
    bundles.forEach((bundle, index) => {
      const expected = expectedBundles[index];
      const actualPrice = ethers.formatEther(bundle.priceInBWD);
      
      console.log(`     ${index + 1}. ${bundle.name} - ${bundle.dataMB}MB - ${actualPrice} BWD`);
      
      if (bundle.name !== expected.name || 
          Number(bundle.dataMB) !== expected.dataMB ||
          actualPrice !== expected.price) {
        throw new Error(`Bundle ${index + 1} configuration mismatch`);
      }
    });
  });
  
  // TEST 3: Ghana Regional Bonuses
  await runTest("Ghana Regional Bonuses", async () => {
    const regions = [
      { name: "Northern", expectedBonus: 25 },
      { name: "Upper East", expectedBonus: 20 },
      { name: "Upper West", expectedBonus: 15 },
      { name: "Volta", expectedBonus: 15 },
      { name: "Greater Accra", expectedBonus: 5 }
    ];
    
    for (const region of regions) {
      const bonus = await contract.regionBonuses(region.name);
      console.log(`     ${region.name}: ${bonus}% bonus`);
      
      if (Number(bonus) !== region.expectedBonus) {
        throw new Error(`${region.name} bonus should be ${region.expectedBonus}%, got ${bonus}%`);
      }
    }
  });
  
  // TEST 4: Mobile Money Providers
  await runTest("Mobile Money Providers", async () => {
    const expectedProviders = ["MTN Mobile Money", "Vodafone Cash", "AirtelTigo Money"];
    
    for (let i = 0; i < expectedProviders.length; i++) {
      const provider = await contract.supportedProviders(i);
      console.log(`     ${i + 1}. ${provider}`);
      
      if (provider !== expectedProviders[i]) {
        throw new Error(`Provider ${i} should be ${expectedProviders[i]}, got ${provider}`);
      }
    }
  });
  
  // TEST 5: User Registration Flow
  await runTest("User Registration Flow", async () => {
    const phoneNumber = "+233501234567";
    const region = "Greater Accra";
    
    // Register user1
    const tx = await contract.connect(user1).registerUser(phoneNumber, region);
    await tx.wait();
    
    const userInfo = await contract.users(user1.address);
    console.log(`     User registered: ${userInfo.phoneNumber} from ${userInfo.region}`);
    
    if (!userInfo.isRegistered || userInfo.phoneNumber !== phoneNumber || userInfo.region !== region) {
      throw new Error("User registration data mismatch");
    }
  });
  
  // TEST 6: Bandwidth Submission & Rewards
  await runTest("Bandwidth Submission & Rewards", async () => {
    const bandwidthMB = 1000; // 1GB
    const region = "Greater Accra";
    
    const balanceBefore = await contract.balanceOf(user1.address);
    
    const tx = await contract.connect(user1).submitBandwidth(bandwidthMB, region);
    await tx.wait();
    
    const balanceAfter = await contract.balanceOf(user1.address);
    const earned = balanceAfter - balanceBefore;
    
    console.log(`     Bandwidth submitted: ${bandwidthMB}MB`);
    console.log(`     BWD earned: ${ethers.formatEther(earned)} BWD`);
    
    if (earned <= 0) {
      throw new Error("No BWD tokens earned from bandwidth submission");
    }
  });
  
  // TEST 7: Data Bundle Purchase
  await runTest("Data Bundle Purchase", async () => {
    const bundleId = 0; // MTN 1GB
    const phoneNumber = "+233501234567";
    
    const balanceBefore = await contract.balanceOf(user1.address);
    const bundle = await contract.dataBundles(bundleId);
    
    // Approve spending
    const approveTx = await contract.connect(user1).approve(CONTRACT_ADDRESS, bundle.priceInBWD);
    await approveTx.wait();
    
    // Purchase bundle
    const purchaseTx = await contract.connect(user1).purchaseDataBundle(bundleId, phoneNumber);
    await purchaseTx.wait();
    
    const balanceAfter = await contract.balanceOf(user1.address);
    const spent = balanceBefore - balanceAfter;
    
    console.log(`     Bundle purchased: ${bundle.name}`);
    console.log(`     BWD spent: ${ethers.formatEther(spent)} BWD`);
    
    if (spent !== bundle.priceInBWD) {
      throw new Error("Incorrect BWD amount spent for bundle purchase");
    }
  });
  
  // TEST 8: Multiple User Scenarios
  await runTest("Multiple User Scenarios", async () => {
    // Register user2 from Northern region (25% bonus)
    await contract.connect(user2).registerUser("+233502345678", "Northern");
    
    // Submit bandwidth from high-bonus region
    const balanceBefore = await contract.balanceOf(user2.address);
    await contract.connect(user2).submitBandwidth(500, "Northern");
    const balanceAfter = await contract.balanceOf(user2.address);
    
    const earned = balanceAfter - balanceBefore;
    console.log(`     Northern region user earned: ${ethers.formatEther(earned)} BWD`);
    
    // Should earn more due to 25% bonus
    if (earned <= 0) {
      throw new Error("Northern region user should earn BWD with bonus");
    }
  });
  
  // TEST 9: Withdrawal Request
  await runTest("Withdrawal Request", async () => {
    const withdrawAmount = ethers.parseEther("10"); // 10 BWD
    const provider = "MTN Mobile Money";
    const phoneNumber = "+233501234567";
    
    const balanceBefore = await contract.balanceOf(user1.address);
    
    if (balanceBefore < withdrawAmount) {
      // Give user1 some tokens for withdrawal test
      await contract.connect(user1).submitBandwidth(2000, "Greater Accra");
    }
    
    const tx = await contract.connect(user1).requestWithdrawal(withdrawAmount, provider, phoneNumber);
    await tx.wait();
    
    console.log(`     Withdrawal requested: ${ethers.formatEther(withdrawAmount)} BWD to ${provider}`);
    console.log(`     Phone: ${phoneNumber}`);
  });
  
  // Print Test Results Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 TEST RESULTS SUMMARY");
  console.log("=".repeat(50));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log("\n❌ Failed Tests:");
    testResults.tests.filter(t => t.status === 'FAILED').forEach(test => {
      console.log(`   - ${test.name}: ${test.error}`);
    });
  }
  
  console.log("\n🎉 ConnectShare MVP Testing Complete!");
  
  if (testResults.failed === 0) {
    console.log("✅ All tests passed! Your MVP is ready for frontend integration.");
  } else {
    console.log("⚠️  Some tests failed. Please review and fix issues before proceeding.");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Testing suite failed:", error);
    process.exit(1);
  });
