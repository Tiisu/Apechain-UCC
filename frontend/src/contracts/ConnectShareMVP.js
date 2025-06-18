// ConnectShare MVP Contract Configuration
// TODO: Replace with your actual deployed contract addresses
export const CONTRACT_ADDRESSES = {
  curtis: process.env.REACT_APP_CURTIS_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
  apechain: process.env.REACT_APP_APECHAIN_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
};

export const NETWORK_CONFIG = {
  curtis: {
    chainId: 33111,
    name: "Curtis Testnet",
    rpcUrl: "https://curtis.rpc.caldera.xyz/http",
    blockExplorer: "https://curtis.explorer.caldera.xyz/",
    nativeCurrency: {
      name: "APE",
      symbol: "APE",
      decimals: 18,
    },
  },
  apechain: {
    chainId: 33139,
    name: "APE Chain",
    rpcUrl: "https://apechain.calderachain.xyz/http",
    blockExplorer: "https://apechain.calderaexplorer.xyz/",
    nativeCurrency: {
      name: "APE",
      symbol: "APE",
      decimals: 18,
    },
  },
};

// Contract ABI - Essential functions only
export const CONTRACT_ABI = [
  // ERC20 functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  
  // ConnectShare specific functions
  "function registerUser(string phoneNumber, string region)",
  "function submitBandwidth(uint256 bandwidthMB, string region)",
  "function purchaseDataBundle(uint256 bundleId, string phoneNumber)",
  "function requestWithdrawal(uint256 amount, string provider, string phoneNumber)",
  
  // View functions
  "function users(address) view returns (string phoneNumber, string region, bool isRegistered, uint256 totalBandwidthShared, uint256 totalEarned)",
  "function getDataBundles() view returns (tuple(string name, string provider, uint256 dataMB, uint256 priceInBWD, bool active)[])",
  "function regionBonuses(string) view returns (uint256)",
  "function supportedProviders(uint256) view returns (string)",
  "function bundleCount() view returns (uint256)",
  
  // Events
  "event UserRegistered(address indexed user, string phoneNumber, string region)",
  "event BandwidthSubmitted(address indexed user, uint256 bandwidthMB, string region, uint256 tokensEarned)",
  "event DataBundlePurchased(address indexed user, uint256 bundleId, string phoneNumber, uint256 cost)",
  "event WithdrawalRequested(address indexed user, uint256 amount, string provider, string phoneNumber)",
];

// Ghana regions with bonuses
export const GHANA_REGIONS = [
  { name: "Greater Accra", bonus: 5 },
  { name: "Ashanti", bonus: 10 },
  { name: "Western", bonus: 15 },
  { name: "Central", bonus: 10 },
  { name: "Eastern", bonus: 10 },
  { name: "Volta", bonus: 15 },
  { name: "Northern", bonus: 25 },
  { name: "Upper East", bonus: 20 },
  { name: "Upper West", bonus: 15 },
];

// Mobile Money Providers
export const MOBILE_MONEY_PROVIDERS = [
  { id: "mtn", name: "MTN Mobile Money", code: "*170#" },
  { id: "vodafone", name: "Vodafone Cash", code: "*110#" },
  { id: "airteltigo", name: "AirtelTigo Money", code: "*185#" },
];

// Utility functions
export const formatBWD = (amount) => {
  return parseFloat(amount).toFixed(2);
};

export const formatPhoneNumber = (phone) => {
  // Format Ghana phone numbers
  if (phone.startsWith("0")) {
    return "+233" + phone.substring(1);
  }
  if (!phone.startsWith("+233")) {
    return "+233" + phone;
  }
  return phone;
};

export const validateGhanaPhone = (phone) => {
  const formatted = formatPhoneNumber(phone);
  const regex = /^\+233[0-9]{9}$/;
  return regex.test(formatted);
};
