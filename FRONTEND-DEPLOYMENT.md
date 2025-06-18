# ConnectShare Frontend Deployment Guide

## 🚀 **Complete Frontend Integration with Web3**

This guide provides step-by-step instructions for deploying the ConnectShare MVP frontend with full Web3 integration.

## **📋 Prerequisites**

- ✅ Smart contract deployed to APE Chain Curtis testnet
- ✅ Contract address available
- ✅ MetaMask installed
- ✅ Node.js 16+ installed
- ✅ Git repository cloned

## **🔧 Step 1: Environment Configuration**

### **1.1 Create Environment File**
```bash
cd frontend
cp .env.example .env
```

### **1.2 Update Environment Variables**
Edit `.env` file with your deployed contract address:

```env
# Replace with your actual deployed contract address
VITE_CURTIS_CONTRACT_ADDRESS=0xYourContractAddressHere
VITE_APECHAIN_CONTRACT_ADDRESS=0xYourMainnetAddressHere

# API Configuration
VITE_MOBILE_MONEY_API_URL=http://localhost:3001
VITE_BACKEND_API_URL=http://localhost:3000

# Network Configuration
VITE_DEFAULT_NETWORK=curtis
VITE_ENABLE_TESTNET=true

# Performance Settings
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_CACHE_DURATION=300000

# Feature Flags
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=false
```

## **🔧 Step 2: Install Dependencies**

```bash
# Install frontend dependencies
cd frontend
npm install

# Install additional Web3 dependencies (if not already installed)
npm install ethers@^6.0.0
```

## **🧪 Step 3: Run Integration Tests**

```bash
# Run the integration test suite
node test-integration.js
```

**Expected Output:**
```
🚀 Starting ConnectShare Frontend Integration Tests
============================================================
🔄 Running: Contract Configuration
✅ PASSED: Contract Configuration
🔄 Running: Web3Context Integration
✅ PASSED: Web3Context Integration
...
📊 TEST RESULTS SUMMARY
✅ Passed: 8
❌ Failed: 0
📈 Success Rate: 100.0%
```

## **🔧 Step 4: Start Development Server**

```bash
npm start
```

The application will open at `http://localhost:3000`

## **📱 Step 5: MetaMask Configuration**

### **5.1 Add Curtis Testnet to MetaMask**

The app will automatically prompt to add the network, or add manually:

- **Network Name**: Curtis Testnet
- **RPC URL**: https://curtis.rpc.caldera.xyz/http
- **Chain ID**: 33111
- **Currency Symbol**: APE
- **Block Explorer**: https://curtis.explorer.caldera.xyz/

### **5.2 Get Test APE Tokens**

You'll need APE tokens for gas fees. Contact the APE Chain team or use their faucet if available.

## **🧪 Step 6: Manual Testing Checklist**

### **6.1 Wallet Connection**
- [ ] Click "Connect Wallet" button
- [ ] MetaMask opens and connects successfully
- [ ] Network switches to Curtis testnet automatically
- [ ] Wallet address displays in header
- [ ] Connection status shows "Connected"

### **6.2 User Registration**
- [ ] Navigate to Register tab
- [ ] Enter Ghana phone number (format: 50 123 4567)
- [ ] Select Ghana region
- [ ] Submit registration
- [ ] Transaction confirms successfully
- [ ] Success message displays

### **6.3 Bandwidth Submission**
- [ ] Navigate to Bandwidth tab
- [ ] Enter bandwidth amount (100-10000 MB)
- [ ] Select region
- [ ] Submit bandwidth data
- [ ] BWD tokens earned and balance updates
- [ ] Transaction hash displays

### **6.4 Data Bundle Purchase**
- [ ] Navigate to Data tab
- [ ] View available bundles
- [ ] Click purchase on affordable bundle
- [ ] Enter phone number in modal
- [ ] Confirm purchase
- [ ] BWD balance decreases
- [ ] Purchase confirmation displays

### **6.5 Token Withdrawal**
- [ ] Navigate to Withdraw tab
- [ ] Enter phone number
- [ ] Select mobile money provider
- [ ] Enter withdrawal amount
- [ ] Submit withdrawal request
- [ ] Transaction confirms
- [ ] Withdrawal details display

### **6.6 Mobile Responsiveness**
- [ ] Test on mobile device or browser dev tools
- [ ] Bottom navigation works
- [ ] All forms are mobile-friendly
- [ ] Touch interactions work properly
- [ ] PWA install prompt appears

## **🚀 Step 7: Production Build**

### **7.1 Create Production Build**
```bash
npm run build
```

### **7.2 Test Production Build Locally**
```bash
# Install serve globally if not already installed
npm install -g serve

# Serve the production build
serve -s build -l 3000
```

## **🌐 Step 8: Deployment Options**

### **Option A: Vercel Deployment**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel --prod
```

### **Option B: Netlify Deployment**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy to Netlify
netlify deploy --prod --dir=build
```

### **Option C: Traditional Web Hosting**
1. Upload the `build` folder contents to your web server
2. Configure server to serve `index.html` for all routes
3. Ensure HTTPS is enabled

## **🔧 Step 9: Environment-Specific Configuration**

### **Production Environment Variables**
```env
REACT_APP_CURTIS_CONTRACT_ADDRESS=0xYourContractAddress
REACT_APP_APECHAIN_CONTRACT_ADDRESS=0xYourMainnetAddress
REACT_APP_MOBILE_MONEY_API_URL=https://your-api-domain.com
REACT_APP_DEFAULT_NETWORK=apechain
REACT_APP_ENABLE_TESTNET=false
REACT_APP_ENABLE_ANALYTICS=true
```

## **📊 Step 10: Monitoring & Analytics**

### **10.1 Performance Monitoring**
The app includes built-in performance monitoring:
- Network connection detection
- Slow connection optimization
- Cache management
- Error tracking

### **10.2 User Analytics**
Configure analytics in production:
```javascript
// Add to your analytics service
window.gtag('config', 'GA_MEASUREMENT_ID');
```

## **🛠️ Troubleshooting**

### **Common Issues**

#### **1. Contract Address Not Set**
```
Error: Contract not deployed on curtis
```
**Solution**: Update `REACT_APP_CURTIS_CONTRACT_ADDRESS` in `.env`

#### **2. MetaMask Connection Issues**
```
Error: Please connect to APE Chain Curtis testnet
```
**Solution**: 
- Check MetaMask is installed
- Switch to Curtis testnet manually
- Refresh the page

#### **3. Transaction Failures**
```
Error: Transaction failed
```
**Solution**:
- Check you have APE tokens for gas
- Verify contract is deployed correctly
- Check network connection

#### **4. Build Errors**
```
Error: Module not found
```
**Solution**:
- Run `npm install` to ensure all dependencies
- Check import paths are correct
- Clear node_modules and reinstall

### **Debug Mode**
Enable debug logging:
```javascript
localStorage.setItem('debug', 'connectshare:*');
```

## **📋 Success Criteria**

Your frontend integration is successful when:

✅ **Wallet Connection**: Users can connect MetaMask and switch networks automatically
✅ **User Registration**: Users can register with Ghana phone numbers and regions
✅ **Bandwidth Submission**: Users can submit bandwidth data and earn BWD tokens
✅ **Data Purchase**: Users can purchase data bundles with BWD tokens
✅ **Token Withdrawal**: Users can request withdrawals to mobile money
✅ **Mobile Optimization**: App works smoothly on mobile devices
✅ **Performance**: App loads quickly even on slow connections
✅ **Error Handling**: Clear error messages and recovery options

## **🎯 Next Steps**

After successful frontend deployment:

1. **User Testing**: Recruit beta users in Ghana for testing
2. **Mobile Money Integration**: Complete backend API integration
3. **Security Audit**: Conduct security review of frontend code
4. **Performance Optimization**: Monitor and optimize based on real usage
5. **Feature Enhancement**: Add advanced features based on user feedback

## **📞 Support**

For deployment issues:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Test with different browsers and devices
4. Verify contract deployment on APE Chain explorer

---

**🎉 Congratulations!** You now have a fully functional ConnectShare MVP frontend integrated with APE Chain smart contracts, optimized for Ghana's mobile users!
