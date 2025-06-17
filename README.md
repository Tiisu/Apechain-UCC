# ConnectShare DApp - Smart Contract Suite

ConnectShare is a revolutionary mobile-first decentralized application built on Ape Chain that transforms smartphones into micro internet service providers, enabling users across Africa to monetize their unused internet bandwidth.

## 🏗️ Smart Contract Architecture

### Core Contracts

1. **BWDToken.sol** - ERC-20 token with advanced features
2. **BandwidthRewards.sol** - Proof-of-Bandwidth verification and reward distribution
3. **ConnectShareDAO.sol** - Governance and treasury management
4. **DataBundlePurchase.sol** - Telecom integration and data bundle purchasing
5. **UserManagement.sol** - User registration, KYC, and reputation system

## 🚀 Features

### BWD Token (Bandwidth Token)
- **ERC-20 Standard**: Full compatibility with wallets and exchanges
- **Deflationary Mechanism**: 2% token burn on data purchases
- **Staking System**: Earn rewards by locking tokens (5-18% APY)
- **Governance Rights**: Voting power based on holdings and staking
- **APE Holder Benefits**: 10% bonus rewards for ApeCoin holders
- **Role-based Access**: Secure admin, minter, and burner roles

### Bandwidth Rewards Distribution
- **Proof-of-Bandwidth**: Cryptographic verification of bandwidth sharing
- **Dynamic Rewards**: Based on bandwidth amount, quality, uptime, and location
- **Geographic Bonuses**: Extra rewards for underserved areas
- **Batch Processing**: Efficient reward distribution to minimize gas costs
- **Fraud Detection**: Reputation-based system to prevent abuse
- **Micro-transactions**: Support for small reward amounts

### Governance DAO
- **Proposal System**: Community-driven decision making
- **Weighted Voting**: BWD holders (1x), APE holders (2x), staked BWD (1.5x)
- **Treasury Management**: Multi-signature control of funds
- **Regional Governance**: Local communities can set area-specific parameters
- **Time-locked Execution**: Security delay for proposal implementation

### Data Bundle Purchase
- **Multi-Provider Support**: Safaricom, MTN, Airtel, Orange, Vodacom
- **Dynamic Pricing**: Real-time BWD-to-data conversion rates
- **Group Purchases**: Bulk buying with community discounts
- **Token Burning**: Deflationary mechanism on each purchase
- **Refund System**: Protection for failed telecom transactions

### User Management & KYC
- **Phone Verification**: Secure registration with mobile numbers
- **KYC Integration**: Mobile money account verification
- **Reputation Scoring**: Dynamic scoring based on network participation
- **Referral Program**: Earn BWD tokens for bringing new users
- **Multi-country Support**: Kenya, Nigeria, Ghana, Uganda, Tanzania

## 📋 Prerequisites

- Node.js v16+
- npm or yarn
- Hardhat development environment

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/Tiisu/Apechain-UCC.git
cd Apechain-UCC
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
# Edit .env with your configuration
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/BWDToken.test.js

# Run tests with gas reporting
REPORT_GAS=true npx hardhat test

# Run tests on specific network
npx hardhat test --network apechain_testnet
```

## 🚀 Deployment

### Local Development
```bash
# Start local Hardhat network
npx hardhat node

# Deploy to local network
npx hardhat run scripts/deploy.js --network localhost
```

### Ape Chain Testnet
```bash
# Deploy to Ape Chain testnet
npx hardhat run scripts/deploy.js --network apechain_testnet
```

### Ape Chain Mainnet
```bash
# Deploy to Ape Chain mainnet
npx hardhat run scripts/deploy.js --network apechain
```

## 🔍 Contract Verification

After deployment, verify contracts on the block explorer:

```bash
# Verify BWD Token
npx hardhat verify --network apechain <BWD_TOKEN_ADDRESS> "<APE_TOKEN_ADDRESS>" "<ADMIN_ADDRESS>"

# Verify other contracts
npx hardhat verify --network apechain <CONTRACT_ADDRESS> "<CONSTRUCTOR_ARGS>"
```