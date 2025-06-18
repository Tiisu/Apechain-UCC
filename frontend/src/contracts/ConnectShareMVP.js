// ConnectShare MVP Contract Configuration
// ✅ DEPLOYED: Curtis Testnet - 0x55b9e94Af59bA7A1dA7324e63f19eb8d8F2A9A67
export const CONTRACT_ADDRESSES = {
  curtis: import.meta.env.VITE_CURTIS_CONTRACT_ADDRESS || "0x55b9e94Af59bA7A1dA7324e63f19eb8d8F2A9A67",
  apechain: import.meta.env.VITE_APECHAIN_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
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

// Contract ABI - Complete interface matching deployed contract
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
  "function registerUser(string memory phoneNumber, string memory region) external",
  "function submitBandwidth(uint256 bandwidthMB, string memory region) external",
  "function purchaseDataBundle(uint256 bundleId, string memory phoneNumber) external",
  "function requestWithdrawal(uint256 amount, string memory provider, string memory phoneNumber) external",

  // View functions
  "function users(address) view returns (string memory phoneNumber, string memory region, bool isRegistered, uint256 totalBandwidthShared, uint256 totalEarned)",
  "function getDataBundles() view returns (tuple(string name, string provider, uint256 dataMB, uint256 priceInBWD, bool active)[])",
  "function dataBundles(uint256) view returns (string name, string provider, uint256 dataMB, uint256 priceInBWD, bool active)",
  "function regionBonuses(string memory) view returns (uint256)",
  "function supportedProviders(uint256) view returns (string memory)",
  "function bundleCount() view returns (uint256)",
  "function owner() view returns (address)",

  // Events
  "event UserRegistered(address indexed user, string phoneNumber, string region)",
  "event BandwidthSubmitted(address indexed user, uint256 bandwidthMB, string region, uint256 tokensEarned)",
  "event DataBundlePurchased(address indexed user, uint256 bundleId, string phoneNumber, uint256 cost)",
  "event WithdrawalRequested(address indexed user, uint256 amount, string provider, string phoneNumber)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

// Ghana regions with bonuses (matching deployed contract)
export const GHANA_REGIONS = [
  { name: "Greater Accra", bonus: 5 },
  { name: "Ashanti", bonus: 10 },
  { name: "Eastern", bonus: 10 },
  { name: "Central", bonus: 15 },
  { name: "Western", bonus: 15 },
  { name: "Volta", bonus: 20 },
  { name: "Northern", bonus: 25 },
  { name: "Upper East", bonus: 25 },
  { name: "Upper West", bonus: 25 },
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
