# APE Chain Deployment Guide

This guide provides comprehensive instructions for deploying ConnectShare MVP to APE Chain networks.

## 🌐 Network Information

### APE Chain Mainnet
- **Network Name**: ApeChain
- **RPC URL**: https://apechain.calderachain.xyz/http
- **Chain ID**: 33139
- **Currency Symbol**: APE
- **Block Explorer**: https://apechain.calderaexplorer.xyz/

### APE Chain Testnet (Curtis)
- **Network Name**: Curtis
- **RPC URL**: https://curtis.rpc.caldera.xyz/http
- **Chain ID**: 33111
- **Currency Symbol**: APE
- **Block Explorer**: https://curtis.explorer.caldera.xyz/

## 🔧 Configuration Features

### Gas Optimization
- **Solidity Version**: 0.8.20+ (compatible with 0.8.19+ requirement)
- **Optimizer Runs**: 1000 (increased for better gas efficiency)
- **Via IR**: Enabled for advanced optimization
- **Target Gas Limit**: Under 50,000 gas per transaction

### Network Settings
- **Automatic Gas Price**: Network determines optimal gas pricing
- **Automatic Gas Limit**: Smart estimation for each transaction
- **Extended Timeouts**: 60 seconds for network latency
- **Contract Verification**: Integrated with APE Chain explorers

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your private key
```

### 2. Compile Contracts
```bash
npm run compile
```

### 3. Deploy to Curtis Testnet
```bash
npm run deploy:curtis
```

### 4. Deploy to APE Chain Mainnet
```bash
npm run deploy:apechain
```

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run compile` | Compile smart contracts |
| `npm run test` | Run test suite |
| `npm run deploy:curtis` | Deploy to Curtis testnet |
| `npm run deploy:apechain` | Deploy to APE Chain mainnet |
| `npm run verify:curtis` | Verify contracts on Curtis |
| `npm run verify:apechain` | Verify contracts on mainnet |

## 🔐 Environment Variables

```env
# Required
PRIVATE_KEY="your-private-key-here"

# Optional
ETHERSCAN_API_KEY=""  # Not required for APE Chain
REPORT_GAS=false      # Enable gas reporting
COINMARKETCAP_API_KEY=""  # For gas cost in USD
```

## ✅ Contract Verification

### Automatic Verification
Contracts are automatically verified during deployment using the integrated verification system.

### Manual Verification
```bash
# For Curtis testnet
npx hardhat verify --network curtis <CONTRACT_ADDRESS>

# For APE Chain mainnet
npx hardhat verify --network apechain <CONTRACT_ADDRESS>
```

## 🎯 Gas Optimization Features

1. **Increased Optimizer Runs**: 1000 runs for better gas efficiency
2. **IR-based Code Generation**: Advanced optimization techniques
3. **Automatic Gas Estimation**: Network-optimized gas settings
4. **Gas Reporting**: Optional detailed gas usage analysis

## 🔍 Network Connectivity Test

Test your configuration:
```bash
# Test compilation
npm run compile

# Test network connectivity (Curtis)
npx hardhat console --network curtis

# Test network connectivity (Mainnet)
npx hardhat console --network apechain
```

## 📊 Deployment Output

The deployment script provides comprehensive information:
- Contract addresses and transaction hashes
- Gas usage and optimization metrics
- Available data bundles and pricing
- Ghana regional bonus structure
- Mobile money provider integration
- Verification commands and next steps

## 🛠️ Troubleshooting

### Common Issues

1. **Network Connection Timeout**
   - Increase timeout in hardhat.config.js
   - Check RPC endpoint availability

2. **Gas Estimation Failures**
   - Use manual gas settings if auto fails
   - Check account balance for gas fees

3. **Verification Failures**
   - Ensure contract is deployed successfully
   - Wait for block confirmations before verifying

### Support Resources
- [APE Chain Documentation](https://docs.apechain.com/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

## 🎉 Success Indicators

✅ Contracts compile without errors
✅ Network connectivity established
✅ Deployment completes successfully
✅ Contract verification passes
✅ Gas usage under 50,000 target
✅ All MVP features functional

## 📈 Next Steps

After successful deployment:
1. Test contract functions on testnet
2. Integrate with frontend application
3. Set up monitoring and analytics
4. Prepare for mainnet deployment
5. Implement user onboarding flow

---

**Note**: Always test thoroughly on Curtis testnet before deploying to APE Chain mainnet.
