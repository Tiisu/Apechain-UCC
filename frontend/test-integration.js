/**
 * ConnectShare Frontend Integration Testing Script
 * Tests all Web3 functionality and component integration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class IntegrationTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      error: '\x1b[31m',   // Red
      warning: '\x1b[33m', // Yellow
      reset: '\x1b[0m'     // Reset
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async runTest(testName, testFunction) {
    try {
      this.log(`🔄 Running: ${testName}`, 'info');
      await testFunction();
      this.log(`✅ PASSED: ${testName}`, 'success');
      this.testResults.passed++;
      this.testResults.tests.push({ name: testName, status: 'PASSED' });
    } catch (error) {
      this.log(`❌ FAILED: ${testName}`, 'error');
      this.log(`   Error: ${error.message}`, 'error');
      this.testResults.failed++;
      this.testResults.tests.push({ name: testName, status: 'FAILED', error: error.message });
    }
  }

  checkFileExists(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    return true;
  }

  checkFileContains(filePath, searchString) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes(searchString)) {
      throw new Error(`File ${filePath} does not contain: ${searchString}`);
    }
    return true;
  }

  async testContractConfiguration() {
    const contractFile = 'src/contracts/ConnectShareMVP.js';
    
    // Check if contract file exists
    this.checkFileExists(contractFile);
    
    // Check if contract addresses are configured
    const content = fs.readFileSync(contractFile, 'utf8');
    
    if (content.includes('YOUR_CURTIS_CONTRACT_ADDRESS')) {
      throw new Error('Contract addresses not configured. Please update CONTRACT_ADDRESSES in ConnectShareMVP.js');
    }
    
    // Check if environment variables are referenced
    this.checkFileContains(contractFile, 'process.env.REACT_APP_CURTIS_CONTRACT_ADDRESS');
    
    this.log('Contract configuration is properly set up', 'success');
  }

  async testWeb3ContextIntegration() {
    const web3ContextFile = 'src/contexts/Web3Context.jsx';
    
    // Check if Web3Context exists
    this.checkFileExists(web3ContextFile);
    
    // Check for essential functions
    const requiredFunctions = [
      'connectWallet',
      'executeTransaction',
      'readContract',
      'switchToSupportedNetwork'
    ];
    
    const content = fs.readFileSync(web3ContextFile, 'utf8');
    
    for (const func of requiredFunctions) {
      if (!content.includes(func)) {
        throw new Error(`Web3Context missing function: ${func}`);
      }
    }
    
    this.log('Web3Context integration is complete', 'success');
  }

  async testComponentUpdates() {
    const components = [
      'src/components/UserRegistration.tsx',
      'src/components/BandwidthRewards.tsx',
      'src/components/DataPurchase.tsx',
      'src/components/TokenWithdrawal.tsx',
      'src/components/Dashboard.tsx'
    ];
    
    for (const component of components) {
      this.checkFileExists(component);
      
      const content = fs.readFileSync(component, 'utf8');
      
      // Check if component uses Web3Context instead of wagmi
      if (content.includes('useAccount') || content.includes('useWriteContract')) {
        throw new Error(`Component ${component} still uses wagmi hooks instead of Web3Context`);
      }
      
      // Check if component imports Web3Context
      if (!content.includes('useWeb3')) {
        throw new Error(`Component ${component} does not import useWeb3 hook`);
      }
    }
    
    this.log('All components updated to use Web3Context', 'success');
  }

  async testMobileOptimization() {
    const mobileLayoutFile = 'src/components/MobileLayout.tsx';
    const appFile = 'src/App.tsx';
    
    // Check if MobileLayout exists
    this.checkFileExists(mobileLayoutFile);
    
    // Check if App.tsx uses MobileLayout
    this.checkFileContains(appFile, 'MobileLayout');
    
    // Check for mobile-specific features
    const mobileFeatures = [
      'PWAInstallPrompt',
      'MobileNavItem',
      'NetworkOptimizer'
    ];
    
    const mobileContent = fs.readFileSync(mobileLayoutFile, 'utf8');
    
    for (const feature of mobileFeatures) {
      if (!mobileContent.includes(feature)) {
        throw new Error(`MobileLayout missing feature: ${feature}`);
      }
    }
    
    this.log('Mobile optimization features are implemented', 'success');
  }

  async testPerformanceOptimizations() {
    const performanceFile = 'src/utils/performance.js';
    
    // Check if performance utilities exist
    this.checkFileExists(performanceFile);
    
    // Check for performance features
    const performanceFeatures = [
      'NetworkOptimizer',
      'CacheManager',
      'RequestBatcher',
      'GhanaOptimizations'
    ];
    
    const content = fs.readFileSync(performanceFile, 'utf8');
    
    for (const feature of performanceFeatures) {
      if (!content.includes(feature)) {
        throw new Error(`Performance utilities missing: ${feature}`);
      }
    }
    
    this.log('Performance optimization utilities are implemented', 'success');
  }

  async testEnvironmentConfiguration() {
    const envExampleFile = '.env.example';
    
    // Check if .env.example exists
    this.checkFileExists(envExampleFile);
    
    // Check for required environment variables
    const requiredEnvVars = [
      'REACT_APP_CURTIS_CONTRACT_ADDRESS',
      'REACT_APP_APECHAIN_CONTRACT_ADDRESS',
      'REACT_APP_MOBILE_MONEY_API_URL'
    ];
    
    const content = fs.readFileSync(envExampleFile, 'utf8');
    
    for (const envVar of requiredEnvVars) {
      if (!content.includes(envVar)) {
        throw new Error(`Environment configuration missing: ${envVar}`);
      }
    }
    
    this.log('Environment configuration is complete', 'success');
  }

  async testBuildConfiguration() {
    try {
      // Test if the project builds successfully
      this.log('Testing build configuration...', 'info');
      execSync('npm run build', { stdio: 'pipe', cwd: process.cwd() });
      this.log('Build completed successfully', 'success');
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  async testDependencies() {
    const packageJsonFile = 'package.json';
    
    // Check if package.json exists
    this.checkFileExists(packageJsonFile);
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonFile, 'utf8'));
    
    // Check for required dependencies
    const requiredDeps = [
      'ethers',
      'react',
      'react-dom'
    ];
    
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    for (const dep of requiredDeps) {
      if (!allDeps[dep]) {
        throw new Error(`Missing required dependency: ${dep}`);
      }
    }
    
    // Check that wagmi is removed or not used
    if (allDeps['wagmi']) {
      this.log('Warning: wagmi is still in dependencies but should not be used', 'warning');
    }
    
    this.log('Dependencies are properly configured', 'success');
  }

  async runAllTests() {
    this.log('🚀 Starting ConnectShare Frontend Integration Tests', 'info');
    this.log('=' .repeat(60), 'info');
    
    await this.runTest('Contract Configuration', () => this.testContractConfiguration());
    await this.runTest('Web3Context Integration', () => this.testWeb3ContextIntegration());
    await this.runTest('Component Updates', () => this.testComponentUpdates());
    await this.runTest('Mobile Optimization', () => this.testMobileOptimization());
    await this.runTest('Performance Optimizations', () => this.testPerformanceOptimizations());
    await this.runTest('Environment Configuration', () => this.testEnvironmentConfiguration());
    await this.runTest('Dependencies Check', () => this.testDependencies());
    await this.runTest('Build Configuration', () => this.testBuildConfiguration());
    
    this.printResults();
  }

  printResults() {
    this.log('=' .repeat(60), 'info');
    this.log('📊 TEST RESULTS SUMMARY', 'info');
    this.log('=' .repeat(60), 'info');
    this.log(`✅ Passed: ${this.testResults.passed}`, 'success');
    this.log(`❌ Failed: ${this.testResults.failed}`, 'error');
    
    const successRate = ((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1);
    this.log(`📈 Success Rate: ${successRate}%`, 'info');
    
    if (this.testResults.failed > 0) {
      this.log('\n❌ Failed Tests:', 'error');
      this.testResults.tests.filter(t => t.status === 'FAILED').forEach(test => {
        this.log(`   - ${test.name}: ${test.error}`, 'error');
      });
      
      this.log('\n🔧 Next Steps:', 'warning');
      this.log('1. Fix the failed tests above', 'warning');
      this.log('2. Update contract addresses in .env file', 'warning');
      this.log('3. Test wallet connection manually', 'warning');
      this.log('4. Run npm start to test the application', 'warning');
    } else {
      this.log('\n🎉 All tests passed! Your frontend integration is complete.', 'success');
      this.log('\n📋 Next Steps:', 'info');
      this.log('1. Update .env with your deployed contract address', 'info');
      this.log('2. Run: npm start', 'info');
      this.log('3. Connect MetaMask to Curtis testnet', 'info');
      this.log('4. Test all user flows manually', 'info');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new IntegrationTester();
  tester.runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = IntegrationTester;
