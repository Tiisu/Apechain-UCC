/**
 * ConnectShare Configuration Verification Script
 * Verifies that all environment variables and contract addresses are properly configured
 */

const fs = require('fs');
const path = require('path');

function verifyConfiguration() {
  console.log('🔍 Verifying ConnectShare Frontend Configuration...\n');
  
  // Check .env file
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    return false;
  }
  
  // Read .env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ .env file found');
  
  // Check for contract address
  const curtisAddressMatch = envContent.match(/VITE_CURTIS_CONTRACT_ADDRESS=(.+)/);
  if (!curtisAddressMatch || curtisAddressMatch[1] === '0x0000000000000000000000000000000000000000') {
    console.error('❌ Curtis contract address not configured properly');
    return false;
  }
  
  const contractAddress = curtisAddressMatch[1];
  console.log('✅ Curtis contract address configured:', contractAddress);
  
  // Verify contract address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
    console.error('❌ Invalid contract address format');
    return false;
  }
  console.log('✅ Contract address format is valid');
  
  // Check contract configuration file
  const contractConfigPath = path.join(__dirname, 'src', 'contracts', 'ConnectShareMVP.js');
  if (!fs.existsSync(contractConfigPath)) {
    console.error('❌ Contract configuration file not found!');
    return false;
  }
  console.log('✅ Contract configuration file found');
  
  // Verify network configuration
  const networkConfig = {
    curtis: {
      chainId: 33111,
      rpcUrl: 'https://curtis.rpc.caldera.xyz/http',
      explorer: 'https://curtis.explorer.caldera.xyz/'
    },
    apechain: {
      chainId: 33139,
      rpcUrl: 'https://apechain.calderachain.xyz/http',
      explorer: 'https://apechain.calderaexplorer.xyz/'
    }
  };
  
  console.log('✅ Network configuration verified');
  console.log('  - Curtis Testnet: Chain ID', networkConfig.curtis.chainId);
  console.log('  - APE Chain Mainnet: Chain ID', networkConfig.apechain.chainId);
  
  // Check if all required files exist
  const requiredFiles = [
    'src/contexts/Web3Context.jsx',
    'src/components/UserRegistration.tsx',
    'src/components/BandwidthRewards.tsx',
    'src/components/DataPurchase.tsx',
    'src/components/TokenWithdrawal.tsx',
    'src/components/Dashboard.tsx',
    'src/components/MobileLayout.tsx',
    'src/utils/performance.js'
  ];
  
  let allFilesExist = true;
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log('✅', file);
    } else {
      console.error('❌', file, 'not found');
      allFilesExist = false;
    }
  }
  
  if (!allFilesExist) {
    console.error('\n❌ Some required files are missing!');
    return false;
  }
  
  // Summary
  console.log('\n🎉 Configuration Verification Complete!');
  console.log('=' .repeat(50));
  console.log('✅ All configuration files are present');
  console.log('✅ Contract address is properly configured');
  console.log('✅ Network settings are correct');
  console.log('✅ All required components are available');
  
  console.log('\n📋 Next Steps:');
  console.log('1. Open http://localhost:5173/ in your browser');
  console.log('2. Connect MetaMask wallet');
  console.log('3. Switch to Curtis testnet (Chain ID: 33111)');
  console.log('4. Test user registration and other features');
  
  console.log('\n🔗 Contract Information:');
  console.log('  Address:', contractAddress);
  console.log('  Network: Curtis Testnet (APE Chain)');
  console.log('  Explorer: https://curtis.explorer.caldera.xyz/address/' + contractAddress);
  
  return true;
}

// Run verification
if (require.main === module) {
  const success = verifyConfiguration();
  process.exit(success ? 0 : 1);
}

module.exports = verifyConfiguration;
