/**
 * ConnectShare Mobile Money Integration Service
 * Handles BWD token withdrawals to Ghana mobile money providers
 */

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const { ethers } = require('ethers');

class MobileMoneyService {
  constructor() {
    this.providers = {
      mtn: {
        name: 'MTN Mobile Money',
        baseUrl: process.env.MTN_API_BASE_URL || 'https://sandbox.momodeveloper.mtn.com',
        apiKey: process.env.MTN_API_KEY,
        apiSecret: process.env.MTN_API_SECRET,
        subscriptionKey: process.env.MTN_SUBSCRIPTION_KEY,
      },
      vodafone: {
        name: 'Vodafone Cash',
        baseUrl: process.env.VODAFONE_API_BASE_URL || 'https://api.vodafone.com.gh',
        apiKey: process.env.VODAFONE_API_KEY,
        apiSecret: process.env.VODAFONE_API_SECRET,
      },
      airteltigo: {
        name: 'AirtelTigo Money',
        baseUrl: process.env.AIRTELTIGO_API_BASE_URL || 'https://api.airteltigo.com.gh',
        apiKey: process.env.AIRTELTIGO_API_KEY,
        apiSecret: process.env.AIRTELTIGO_API_SECRET,
      }
    };
    
    // BWD to GHS exchange rate (mock - should be from oracle in production)
    this.bwdToGhsRate = 0.50; // 1 BWD = 0.50 GHS
  }

  /**
   * Process withdrawal request from smart contract
   */
  async processWithdrawal(withdrawalData) {
    const { userAddress, amount, provider, phoneNumber, transactionId } = withdrawalData;
    
    try {
      console.log(`Processing withdrawal: ${amount} BWD to ${provider} (${phoneNumber})`);
      
      // Convert BWD to GHS
      const ghsAmount = parseFloat(amount) * this.bwdToGhsRate;
      
      // Route to appropriate provider
      let result;
      switch (provider.toLowerCase()) {
        case 'mtn mobile money':
          result = await this.processMTNWithdrawal(phoneNumber, ghsAmount, transactionId);
          break;
        case 'vodafone cash':
          result = await this.processVodafoneWithdrawal(phoneNumber, ghsAmount, transactionId);
          break;
        case 'airteltigo money':
          result = await this.processAirtelTigoWithdrawal(phoneNumber, ghsAmount, transactionId);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
      
      return {
        success: true,
        transactionId: result.transactionId,
        amount: ghsAmount,
        currency: 'GHS',
        provider: provider,
        phoneNumber: phoneNumber,
        status: 'completed'
      };
      
    } catch (error) {
      console.error('Withdrawal processing failed:', error);
      return {
        success: false,
        error: error.message,
        transactionId: transactionId,
        status: 'failed'
      };
    }
  }

  /**
   * MTN Mobile Money Integration
   */
  async processMTNWithdrawal(phoneNumber, amount, referenceId) {
    const config = this.providers.mtn;
    
    try {
      // Step 1: Get access token
      const tokenResponse = await axios.post(
        `${config.baseUrl}/collection/token/`,
        {},
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString('base64')}`,
            'Ocp-Apim-Subscription-Key': config.subscriptionKey,
          }
        }
      );
      
      const accessToken = tokenResponse.data.access_token;
      
      // Step 2: Request payment
      const paymentData = {
        amount: amount.toString(),
        currency: 'GHS',
        externalId: referenceId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: phoneNumber.replace('+233', '0') // Convert to local format
        },
        payerMessage: 'ConnectShare BWD withdrawal',
        payeeNote: 'BWD token withdrawal to mobile money'
      };
      
      const paymentResponse = await axios.post(
        `${config.baseUrl}/collection/v1_0/requesttopay`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Reference-Id': referenceId,
            'X-Target-Environment': process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
            'Ocp-Apim-Subscription-Key': config.subscriptionKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        transactionId: referenceId,
        status: 'pending',
        provider: 'MTN Mobile Money'
      };
      
    } catch (error) {
      console.error('MTN withdrawal failed:', error.response?.data || error.message);
      throw new Error(`MTN withdrawal failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Vodafone Cash Integration (Mock Implementation)
   */
  async processVodafoneWithdrawal(phoneNumber, amount, referenceId) {
    // Mock implementation - replace with actual Vodafone API
    console.log(`Mock Vodafone withdrawal: ${amount} GHS to ${phoneNumber}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock success response
    return {
      transactionId: `VF_${referenceId}`,
      status: 'completed',
      provider: 'Vodafone Cash'
    };
  }

  /**
   * AirtelTigo Money Integration (Mock Implementation)
   */
  async processAirtelTigoWithdrawal(phoneNumber, amount, referenceId) {
    // Mock implementation - replace with actual AirtelTigo API
    console.log(`Mock AirtelTigo withdrawal: ${amount} GHS to ${phoneNumber}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock success response
    return {
      transactionId: `AT_${referenceId}`,
      status: 'completed',
      provider: 'AirtelTigo Money'
    };
  }

  /**
   * Validate Ghana phone number
   */
  validatePhoneNumber(phoneNumber) {
    const ghanaPhoneRegex = /^(\+233|0)[0-9]{9}$/;
    return ghanaPhoneRegex.test(phoneNumber);
  }

  /**
   * Generate unique transaction reference
   */
  generateTransactionId() {
    return crypto.randomUUID();
  }

  /**
   * Check transaction status
   */
  async checkTransactionStatus(transactionId, provider) {
    // Implementation depends on provider APIs
    // This is a mock implementation
    return {
      transactionId,
      status: 'completed',
      provider
    };
  }
}

// Express.js API endpoints
const app = express();
app.use(express.json());

const mobileMoneyService = new MobileMoneyService();

// Webhook endpoint for smart contract withdrawal events
app.post('/api/withdrawal/process', async (req, res) => {
  try {
    const { userAddress, amount, provider, phoneNumber } = req.body;
    
    // Validate input
    if (!userAddress || !amount || !provider || !phoneNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!mobileMoneyService.validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ error: 'Invalid Ghana phone number' });
    }
    
    // Generate transaction ID
    const transactionId = mobileMoneyService.generateTransactionId();
    
    // Process withdrawal
    const result = await mobileMoneyService.processWithdrawal({
      userAddress,
      amount,
      provider,
      phoneNumber,
      transactionId
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('Withdrawal API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check transaction status endpoint
app.get('/api/withdrawal/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { provider } = req.query;
    
    const status = await mobileMoneyService.checkTransactionStatus(transactionId, provider);
    res.json(status);
    
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'ConnectShare Mobile Money Service',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🏦 Mobile Money Service running on port ${PORT}`);
    console.log(`📱 Supported providers: MTN, Vodafone, AirtelTigo`);
  });
}

module.exports = { MobileMoneyService, app };
