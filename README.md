# ConnectShare MVP - Ghana Bandwidth Sharing Platform

ConnectShare MVP is a streamlined decentralized application built on Ape Chain that enables users in Ghana to monetize their internet bandwidth and purchase data bundles using BWD tokens.

## 🇬🇭 Ghana-Focused MVP

This MVP is specifically designed for the Ghanaian market with essential features only:

- **Target Market**: Ghana
- **Mobile Money Integration**: MTN Mobile Money, Vodafone Cash, AirtelTigo Money
- **Simple Pricing**: Direct BWD to GHS conversion (1 BWD = 0.5 GHS)
- **Core Features**: Registration, Bandwidth Sharing, Data Purchase, Token Withdrawal, AI Assistant

## 🏗️ MVP Architecture

### Single Smart Contract

**ConnectShareMVP.sol** - All-in-one contract containing:
- BWD Token functionality (ERC-20)
- User registration and management
- Bandwidth reward distribution
- Data bundle purchasing
- Mobile money withdrawal requests

## 🚀 MVP Features

### 1. User Registration
- **Phone Number Verification**: Ghana mobile numbers (+233)
- **Mobile Money Provider**: MTN, Vodafone, AirtelTigo selection
- **Welcome Bonus**: 10 BWD tokens for new users

### 2. Bandwidth Sharing
- **Simple Submission**: Enter bandwidth amount in MB
- **Location Tracking**: Ghana region selection
- **Instant Rewards**: 1 BWD per 100 MB shared

### 3. Data Purchase
- **Pre-defined Bundles**: 500MB, 1GB, 2GB options
- **Multiple Providers**: MTN, Vodafone, AirtelTigo
- **BWD Payment**: Direct token spending

### 4. Token Withdrawal
- **Mobile Money Integration**: Direct withdrawal to registered mobile money account
- **Fixed Rate**: 1 BWD = 0.5 GHS
- **Processing Time**: Up to 24 hours

### 5. AI Assistant
- **24/7 Support**: Automated help for common questions
- **Platform Guidance**: Step-by-step instructions
- **Ghana-specific**: Local mobile money and network information

## 📋 Prerequisites

- Node.js v18+
- npm
- MetaMask or compatible Web3 wallet

## 🛠️ Quick Start

1. **Clone the repository:**
```bash
git clone https://github.com/Tiisu/Apechain-UCC.git
cd Apechain-UCC
```

2. **Install backend dependencies:**
```bash
npm install
```

3. **Install frontend dependencies:**
```bash
npm run frontend:install
```

4. **Set up environment:**
```bash
cp .env.example .env
# Add your PRIVATE_KEY for deployment
```

5. **Compile smart contract:**
```bash
npm run compile
```

6. **Deploy MVP contract:**
```bash
npm run deploy:mvp
```

7. **Start frontend:**
```bash
npm run frontend:dev
```

## 🧪 Testing

```bash
# Test smart contract
npm test

# Test with gas reporting
REPORT_GAS=true npm test
```

## 🚀 Deployment

### Ape Chain Deployment
```bash
# Deploy to Ape Chain
npx hardhat run scripts/deploy-mvp.js --network apechain
```

## 📱 Frontend

The React frontend includes:
- **Wallet Connection**: RainbowKit integration
- **5 Core Components**: Registration, Bandwidth Sharing, Data Purchase, Withdrawal, AI Assistant
- **Responsive Design**: Tailwind CSS styling
- **Ghana-specific UI**: Mobile money providers, regions, phone number formatting

## 🔧 Project Structure

```
├── contracts/
│   └── ConnectShareMVP.sol    # Single MVP contract
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── config/           # Web3 configuration
│   │   └── App.tsx           # Main application
│   └── package.json
├── scripts/
│   └── deploy-mvp.js         # Deployment script
├── test/
│   └── ConnectShareMVP.test.js
└── README.md
```

## 🇬🇭 Ghana-Specific Features

- **Mobile Money Providers**: MTN, Vodafone, AirtelTigo
- **Phone Number Format**: Ghana (+233) format validation
- **Regional Support**: All 16 Ghana regions
- **Currency**: BWD to GHS conversion (1:0.5 ratio)
- **Local Context**: AI assistant with Ghana-specific information

## 📄 License

MIT License - see LICENSE file for details.