# ConnectShare MVP - Ghana Internet Democratization Platform

## 🇬🇭 Overview

ConnectShare MVP is a simplified version of the full ConnectShare DApp, designed specifically for the Ghanaian market. It enables users to share bandwidth, earn BWD tokens, and purchase affordable data bundles from local telecom providers.

## ✅ MVP Features Implemented

### 1. **Smart Contract (ConnectShareMVP.sol)**
- ✅ User registration with phone number and mobile money provider
- ✅ Bandwidth submission and automatic reward distribution
- ✅ Ghana regional bonuses (25% for Northern regions)
- ✅ Data bundle purchasing from MTN, Vodafone, AirtelTigo
- ✅ Mobile money withdrawal requests
- ✅ BWD token with 10 BWD welcome bonus

### 2. **Web Frontend (Next.js + React)**
- ✅ Wallet connection with RainbowKit
- ✅ Mobile-first responsive design
- ✅ User registration flow
- ✅ Dashboard with balance and stats
- ✅ Bandwidth sharing interface
- ✅ Data bundle marketplace
- ✅ Basic AI chatbot (English/Twi support)

### 3. **Ghana-Specific Features**
- ✅ MTN Mobile Money, Vodafone Cash, AirtelTigo Money integration
- ✅ Ghana regional bonuses for underserved areas
- ✅ Local data bundle pricing in BWD/GHS
- ✅ Ghana flag colors and branding

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MetaMask or compatible Web3 wallet
- Git

### 1. Clone and Setup
```bash
git clone https://github.com/Tiisu/Apechain-UCC.git
cd Apechain-UCC
npm install
```

### 2. Start Local Blockchain
```bash
npx hardhat node
```

### 3. Deploy MVP Contract
```bash
npx hardhat run scripts/deploy-mvp.js --network localhost
```

### 4. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Open in Browser
Visit `http://localhost:3000` and connect your wallet!

## 📱 User Journey

### Step 1: Connect Wallet
- Click "Connect Wallet" button
- Choose MetaMask or preferred wallet
- Connect to localhost network

### Step 2: Register Account
- Enter Ghana phone number (+233...)
- Select mobile money provider (MTN MoMo, Vodafone Cash, etc.)
- Receive 10 BWD welcome bonus

### Step 3: Share Bandwidth
- Go to "Share Data" tab
- Enter amount shared in MB
- Select your Ghana region for bonus
- Submit and receive BWD tokens instantly

### Step 4: Buy Data Bundles
- Go to "Buy Bundles" tab
- Browse MTN, Vodafone, AirtelTigo bundles
- Purchase with earned BWD tokens

### Step 5: Request Withdrawal
- Use AI chatbot or dashboard
- Request withdrawal to mobile money
- Funds sent to your registered mobile money account

## 🎯 Ghana Regional Bonuses

| Region | Bonus | Reason |
|--------|-------|--------|
| Northern | 25% | Underserved area |
| Upper East | 25% | Rural development focus |
| Upper West | 25% | Limited connectivity |
| Volta | 20% | Coastal/rural mix |
| Central | 15% | Moderate development |
| Western | 15% | Mining region support |
| Eastern | 10% | Semi-urban areas |
| Ashanti | 10% | Urban suburbs |
| Greater Accra | 5% | Urban center |

## 💰 Data Bundle Pricing

### MTN Ghana
- 1GB Daily: 25 BWD (~GHS 5)
- 2GB Weekly: 45 BWD (~GHS 9)
- 5GB Monthly: 80 BWD (~GHS 16)

### Vodafone Ghana
- 1GB Daily: 27 BWD (~GHS 5.40)
- 3GB Weekly: 55 BWD (~GHS 11)

### AirtelTigo Ghana
- 2GB Weekly: 40 BWD (~GHS 8)
- 10GB Monthly: 120 BWD (~GHS 24)

## 🤖 AI Assistant Features

The built-in AI chatbot supports:
- **English**: Full feature support
- **Twi**: Basic greetings and common phrases
- Balance inquiries
- Data bundle recommendations
- Bandwidth sharing guidance
- Mobile money withdrawal help

## 🧪 Testing

### Run Smart Contract Tests
```bash
npx hardhat test test/ConnectShareMVP.test.js
```

### Test Coverage
- ✅ User registration
- ✅ Bandwidth submission and rewards
- ✅ Regional bonus calculations
- ✅ Data bundle purchases
- ✅ Withdrawal requests
- ✅ Admin functions

## 🔧 Technical Architecture

### Smart Contract
- **Language**: Solidity 0.8.20
- **Framework**: Hardhat
- **Features**: ERC-20 token, ownership, reentrancy protection
- **Gas Optimization**: viaIR enabled for complex functions

### Frontend
- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Web3**: Wagmi + RainbowKit
- **State**: React hooks + TanStack Query

### Blockchain
- **Network**: Ape Chain (localhost for MVP)
- **Wallet**: MetaMask integration
- **Gas**: Optimized for low-cost transactions

## 🌍 Deployment

### Local Development
```bash
npx hardhat node
npx hardhat run scripts/deploy-mvp.js --network localhost
```

### Ape Chain Testnet
```bash
npx hardhat run scripts/deploy-mvp.js --network apechain_testnet
```

### Ape Chain Mainnet
```bash
npx hardhat run scripts/deploy-mvp.js --network apechain
```

## 📊 MVP Metrics

### Success Criteria
- [ ] 100+ registered users in Accra/Kumasi
- [ ] 1000+ bandwidth submissions
- [ ] 500+ data bundle purchases
- [ ] 50+ mobile money withdrawals
- [ ] 90%+ user satisfaction

### Key Performance Indicators
- User registration rate
- Bandwidth sharing frequency
- Token earning/spending ratio
- Regional distribution of users
- Mobile money integration success rate

## 🔮 Next Steps (Post-MVP)

### Phase 2: Enhanced Features
- [ ] Real mobile money API integration
- [ ] Advanced AI with local language support
- [ ] Group purchasing and community features
- [ ] Reputation-based rewards
- [ ] Referral program

### Phase 3: Scale & Partnerships
- [ ] University partnerships (UG, KNUST, UCC)
- [ ] Telecom provider direct integration
- [ ] Government collaboration
- [ ] West Africa expansion

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

- **Email**: support@connectshare.gh
- **WhatsApp**: +233 XX XXX XXXX
- **Telegram**: @ConnectShareGhana
- **Discord**: ConnectShare Community

## 📄 License

MIT License - see LICENSE file for details.

---

**Akwaaba to ConnectShare! 🇬🇭 Let's democratize internet access in Ghana together!**
