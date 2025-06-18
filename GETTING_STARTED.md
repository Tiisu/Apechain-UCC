# 🚀 Getting Started with ConnectShare MVP

Welcome to ConnectShare MVP - Ghana's first decentralized bandwidth sharing platform! This guide will help you set up and run the project locally.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)
- **MetaMask** browser extension - [Install here](https://metamask.io/)

## 🛠️ Quick Setup (5 minutes)

### 1. Clone the Repository
```bash
git clone https://github.com/Tiisu/Apechain-UCC.git
cd Apechain-UCC
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
npm run frontend:install
```

### 3. Set Up Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your settings
# At minimum, add your PRIVATE_KEY for deployment
```

### 4. Compile Smart Contract
```bash
npm run compile
```

### 5. Run Tests (Optional)
```bash
npm test
```

### 6. Deploy to Local Network
```bash
# Start local blockchain
npx hardhat node

# In another terminal, deploy contract
npm run deploy:mvp
```

### 7. Start Frontend
```bash
npm run frontend:dev
```

🎉 **That's it!** Open http://localhost:5173 to see ConnectShare MVP running locally.

## 🇬🇭 Ghana-Specific Setup

### MetaMask Configuration for Ape Chain

1. **Open MetaMask** and click on the network dropdown
2. **Add Network** with these details:
   - **Network Name**: Ape Chain
   - **RPC URL**: `https://apechain.calderachain.xyz/http`
   - **Chain ID**: `33139`
   - **Currency Symbol**: `APE`
   - **Block Explorer**: `https://apechain.calderachain.xyz`

3. **Get Test Tokens** (if using testnet):
   - Visit the Ape Chain faucet
   - Request test APE tokens for gas fees

### Mobile Money Integration

The MVP includes support for Ghana's major mobile money providers:
- **MTN Mobile Money** 📱
- **Vodafone Cash** 💳
- **AirtelTigo Money** 🏦

*Note: Mobile money integration is simulated in the MVP. Real integration requires API partnerships.*

## 🎯 Testing the MVP Features

### 1. User Registration
- Connect your MetaMask wallet
- Navigate to "Register" page
- Enter your Ghana phone number (format: 24 123 4567)
- Select your mobile money provider
- Submit registration (you'll receive 10 BWD welcome bonus)

### 2. Bandwidth Sharing
- Go to "Share Bandwidth" page
- Enter bandwidth amount in MB (e.g., 1000 MB)
- Select your Ghana region
- Submit to earn BWD tokens (1 BWD per 100 MB)

### 3. Data Purchase
- Visit "Buy Data" page
- Choose from available bundles (500MB, 1GB, 2GB)
- Select provider (MTN, Vodafone, AirtelTigo)
- Pay with BWD tokens

### 4. Token Withdrawal
- Go to "Withdraw" page
- Enter BWD amount to withdraw
- Confirm mobile money details
- Submit withdrawal request (1 BWD = 0.5 GHS)

### 5. AI Assistant
- Click "AI Assistant" in navigation
- Ask questions about the platform
- Get help with bandwidth sharing, data purchase, etc.

## 🔧 Development Commands

```bash
# Backend Commands
npm run compile          # Compile smart contracts
npm test                # Run contract tests
npm run deploy:mvp      # Deploy MVP contract

# Frontend Commands
npm run frontend:dev    # Start development server
npm run frontend:build  # Build for production
npm run frontend:install # Install frontend dependencies

# Combined Commands
npm run dev             # Start both backend and frontend
npm run build           # Build entire project
```

## 📁 Project Structure

```
Apechain-UCC/
├── contracts/
│   └── ConnectShareMVP.sol     # Main smart contract
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── config/            # Web3 configuration
│   │   └── App.tsx            # Main app
│   └── package.json
├── scripts/
│   └── deploy-mvp.js          # Deployment script
├── test/
│   └── ConnectShareMVP.test.js # Contract tests
├── package.json               # Backend dependencies
└── README.md
```

## 🐛 Troubleshooting

### Common Issues

**1. "Cannot connect to network"**
- Check your internet connection
- Verify Ape Chain RPC URL in MetaMask
- Try switching networks and back

**2. "Transaction failed"**
- Ensure you have enough APE tokens for gas
- Check if you're on the correct network
- Try increasing gas limit

**3. "Contract not deployed"**
- Run `npm run deploy:mvp` first
- Update contract address in frontend config
- Check deployment was successful

**4. "Frontend won't start"**
- Run `npm run frontend:install` again
- Check Node.js version (needs v18+)
- Clear npm cache: `npm cache clean --force`

### Getting Help

- **GitHub Issues**: [Report bugs here](https://github.com/Tiisu/Apechain-UCC/issues)
- **AI Assistant**: Use the built-in AI helper in the app
- **Documentation**: Check README.md for detailed info

## 🚀 Next Steps

Once you have the MVP running:

1. **Test all features** with different scenarios
2. **Deploy to Ape Chain mainnet** for production
3. **Integrate real mobile money APIs** (requires partnerships)
4. **Add more Ghana-specific features** (local languages, regions)
5. **Scale to other West African countries**

## 🎉 Welcome to ConnectShare!

You're now ready to explore Ghana's first decentralized bandwidth sharing platform. Start earning BWD tokens by sharing your bandwidth and help democratize internet access across Ghana!

---

**Need help?** The AI Assistant in the app can answer questions about bandwidth sharing, data purchases, and withdrawals. Just ask! 🤖
