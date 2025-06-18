import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { defineChain } from 'viem'

// Define Ape Chain
export const apeChain = defineChain({
  id: 33139,
  name: 'Ape Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'ApeCoin',
    symbol: 'APE',
  },
  rpcUrls: {
    default: {
      http: ['https://apechain.calderachain.xyz/http'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Ape Chain Explorer',
      url: 'https://apechain.calderachain.xyz',
    },
  },
  testnet: false,
})

export const config = getDefaultConfig({
  appName: 'ConnectShare MVP',
  projectId: 'YOUR_PROJECT_ID', // Get this from WalletConnect Cloud
  chains: [apeChain],
  ssr: false,
})

// Contract addresses (update these after deployment)
export const CONNECTSHARE_MVP_ADDRESS = '0x...' // Update with deployed contract address

// Contract ABI (simplified for MVP)
export const CONNECTSHARE_MVP_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "phoneNumber", "type": "string"},
      {"internalType": "string", "name": "mobileMoneyProvider", "type": "string"}
    ],
    "name": "registerUser",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "amountMB", "type": "uint256"},
      {"internalType": "string", "name": "location", "type": "string"}
    ],
    "name": "submitBandwidth",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "bundleId", "type": "uint256"}
    ],
    "name": "purchaseDataBundle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "requestWithdrawal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "getUserInfo",
    "outputs": [
      {
        "components": [
          {"internalType": "bool", "name": "registered", "type": "bool"},
          {"internalType": "string", "name": "phoneNumber", "type": "string"},
          {"internalType": "uint256", "name": "totalBandwidthShared", "type": "uint256"},
          {"internalType": "uint256", "name": "totalEarnings", "type": "uint256"},
          {"internalType": "uint256", "name": "reputationScore", "type": "uint256"},
          {"internalType": "string", "name": "mobileMoneyProvider", "type": "string"},
          {"internalType": "uint256", "name": "registrationTime", "type": "uint256"}
        ],
        "internalType": "struct ConnectShareMVP.User",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getDataBundles",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "id", "type": "uint256"},
          {"internalType": "string", "name": "name", "type": "string"},
          {"internalType": "uint256", "name": "dataMB", "type": "uint256"},
          {"internalType": "uint256", "name": "priceInBWD", "type": "uint256"},
          {"internalType": "string", "name": "provider", "type": "string"},
          {"internalType": "bool", "name": "active", "type": "bool"}
        ],
        "internalType": "struct ConnectShareMVP.DataBundle[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "account", "type": "address"}
    ],
    "name": "balanceOf",
    "outputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const
