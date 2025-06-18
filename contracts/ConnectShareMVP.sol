// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ConnectShare MVP
 * @dev Simplified version of ConnectShare for Ghana market
 * Combines token, rewards, and data purchase functionality in one contract
 */
contract ConnectShareMVP is ERC20, Ownable, ReentrancyGuard {
    
    // User structure
    struct User {
        bool registered;
        string phoneNumber;
        uint256 totalBandwidthShared;
        uint256 totalEarnings;
        uint256 reputationScore;
        string mobileMoneyProvider;
        uint256 registrationTime;
    }
    
    // Bandwidth submission structure
    struct BandwidthSubmission {
        address user;
        uint256 amount; // in MB
        uint256 timestamp;
        bool rewarded;
        string location; // Ghana region
    }
    
    // Data bundle structure
    struct DataBundle {
        uint256 id;
        string name;
        uint256 dataMB;
        uint256 priceInBWD;
        string provider; // MTN, Vodafone, AirtelTigo
        bool active;
    }
    
    // State variables
    mapping(address => User) public users;
    mapping(address => BandwidthSubmission[]) public userSubmissions;
    mapping(uint256 => DataBundle) public dataBundles;
    mapping(string => uint256) public regionBonuses; // Ghana regions => bonus percentage
    
    uint256 public totalUsers;
    uint256 public bundleCount;
    uint256 public baseRewardRate = 10 * 10**18; // 10 BWD per GB
    uint256 public constant DECIMALS_FACTOR = 10**18;
    
    // Ghana mobile money providers
    string[] public supportedProviders = ["MTN Mobile Money", "Vodafone Cash", "AirtelTigo Money"];
    
    // Events
    event UserRegistered(address indexed user, string phoneNumber, string provider);
    event BandwidthSubmitted(address indexed user, uint256 amount, string location);
    event RewardsDistributed(address indexed user, uint256 amount);
    event DataBundlePurchased(address indexed user, uint256 bundleId, string provider);
    event WithdrawalRequested(address indexed user, uint256 amount, string provider);
    
    constructor() ERC20("Bandwidth Token", "BWD") Ownable(msg.sender) {
        // Initialize Ghana region bonuses
        regionBonuses["Northern"] = 25; // 25% bonus
        regionBonuses["Upper East"] = 25;
        regionBonuses["Upper West"] = 25;
        regionBonuses["Volta"] = 20;
        regionBonuses["Central"] = 15;
        regionBonuses["Western"] = 15;
        regionBonuses["Eastern"] = 10;
        regionBonuses["Ashanti"] = 10;
        regionBonuses["Greater Accra"] = 5;
        
        // Initialize data bundles
        _addInitialBundles();
        
        // Mint initial supply for rewards
        _mint(address(this), 1000000 * DECIMALS_FACTOR); // 1M BWD for rewards
    }
    
    /**
     * @dev Register new user
     */
    function registerUser(
        string memory phoneNumber,
        string memory mobileMoneyProvider
    ) external {
        require(!users[msg.sender].registered, "User already registered");
        require(bytes(phoneNumber).length > 0, "Phone number required");
        require(_isValidProvider(mobileMoneyProvider), "Invalid mobile money provider");
        
        users[msg.sender] = User({
            registered: true,
            phoneNumber: phoneNumber,
            totalBandwidthShared: 0,
            totalEarnings: 0,
            reputationScore: 100, // Starting reputation
            mobileMoneyProvider: mobileMoneyProvider,
            registrationTime: block.timestamp
        });
        
        totalUsers++;
        
        // Welcome bonus
        _transfer(address(this), msg.sender, 10 * DECIMALS_FACTOR); // 10 BWD welcome
        
        emit UserRegistered(msg.sender, phoneNumber, mobileMoneyProvider);
    }
    
    /**
     * @dev Submit bandwidth sharing data
     */
    function submitBandwidth(
        uint256 amountMB,
        string memory location
    ) external {
        require(users[msg.sender].registered, "User not registered");
        require(amountMB > 0, "Amount must be positive");
        
        // Create submission
        BandwidthSubmission memory submission = BandwidthSubmission({
            user: msg.sender,
            amount: amountMB,
            timestamp: block.timestamp,
            rewarded: false,
            location: location
        });
        
        userSubmissions[msg.sender].push(submission);
        
        // Calculate and distribute rewards immediately (simplified)
        uint256 rewardAmount = _calculateReward(amountMB, location);
        
        if (rewardAmount > 0 && balanceOf(address(this)) >= rewardAmount) {
            _transfer(address(this), msg.sender, rewardAmount);
            
            // Update user stats
            users[msg.sender].totalBandwidthShared += amountMB;
            users[msg.sender].totalEarnings += rewardAmount;
            users[msg.sender].reputationScore += 1; // Increase reputation
            
            // Mark as rewarded
            userSubmissions[msg.sender][userSubmissions[msg.sender].length - 1].rewarded = true;
            
            emit RewardsDistributed(msg.sender, rewardAmount);
        }
        
        emit BandwidthSubmitted(msg.sender, amountMB, location);
    }
    
    /**
     * @dev Purchase data bundle
     */
    function purchaseDataBundle(uint256 bundleId) external nonReentrant {
        require(users[msg.sender].registered, "User not registered");
        require(bundleId <= bundleCount && bundleId > 0, "Invalid bundle ID");
        
        DataBundle memory bundle = dataBundles[bundleId];
        require(bundle.active, "Bundle not active");
        require(balanceOf(msg.sender) >= bundle.priceInBWD, "Insufficient BWD balance");
        
        // Transfer BWD tokens (burn mechanism)
        _transfer(msg.sender, address(this), bundle.priceInBWD);
        
        emit DataBundlePurchased(msg.sender, bundleId, bundle.provider);
    }
    
    /**
     * @dev Request withdrawal to mobile money
     */
    function requestWithdrawal(uint256 amount) external {
        require(users[msg.sender].registered, "User not registered");
        require(amount > 0, "Amount must be positive");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // In MVP, we just emit event for backend processing
        emit WithdrawalRequested(msg.sender, amount, users[msg.sender].mobileMoneyProvider);
    }
    
    /**
     * @dev Get user's bandwidth submissions
     */
    function getUserSubmissions(address user) external view returns (BandwidthSubmission[] memory) {
        return userSubmissions[user];
    }
    
    /**
     * @dev Get user info
     */
    function getUserInfo(address user) external view returns (User memory) {
        return users[user];
    }
    
    /**
     * @dev Get available data bundles
     */
    function getDataBundles() external view returns (DataBundle[] memory) {
        DataBundle[] memory bundles = new DataBundle[](bundleCount);
        for (uint256 i = 1; i <= bundleCount; i++) {
            bundles[i-1] = dataBundles[i];
        }
        return bundles;
    }
    
    // Internal functions
    
    function _calculateReward(uint256 amountMB, string memory location) internal view returns (uint256) {
        // Convert MB to GB and calculate base reward
        uint256 amountGB = amountMB / 1024;
        if (amountGB == 0) amountGB = 1; // Minimum 1 GB equivalent for small amounts
        
        uint256 baseReward = amountGB * baseRewardRate;
        
        // Apply regional bonus
        uint256 bonus = regionBonuses[location];
        if (bonus > 0) {
            baseReward = baseReward + (baseReward * bonus / 100);
        }
        
        return baseReward;
    }
    
    function _isValidProvider(string memory provider) internal view returns (bool) {
        for (uint256 i = 0; i < supportedProviders.length; i++) {
            if (keccak256(bytes(supportedProviders[i])) == keccak256(bytes(provider))) {
                return true;
            }
        }
        return false;
    }
    
    function _addInitialBundles() internal {
        // MTN Ghana bundles
        _addBundle("MTN 1GB Daily", 1024, 25 * DECIMALS_FACTOR, "MTN Ghana");
        _addBundle("MTN 2GB Weekly", 2048, 45 * DECIMALS_FACTOR, "MTN Ghana");
        _addBundle("MTN 5GB Monthly", 5120, 80 * DECIMALS_FACTOR, "MTN Ghana");
        
        // Vodafone Ghana bundles
        _addBundle("Vodafone 1GB Daily", 1024, 27 * DECIMALS_FACTOR, "Vodafone Ghana");
        _addBundle("Vodafone 3GB Weekly", 3072, 55 * DECIMALS_FACTOR, "Vodafone Ghana");
        
        // AirtelTigo bundles
        _addBundle("AirtelTigo 2GB Weekly", 2048, 40 * DECIMALS_FACTOR, "AirtelTigo Ghana");
        _addBundle("AirtelTigo 10GB Monthly", 10240, 120 * DECIMALS_FACTOR, "AirtelTigo Ghana");
    }
    
    function _addBundle(string memory name, uint256 dataMB, uint256 price, string memory provider) internal {
        bundleCount++;
        dataBundles[bundleCount] = DataBundle({
            id: bundleCount,
            name: name,
            dataMB: dataMB,
            priceInBWD: price,
            provider: provider,
            active: true
        });
    }
    
    // Admin functions
    
    function addDataBundle(
        string memory name,
        uint256 dataMB,
        uint256 priceInBWD,
        string memory provider
    ) external onlyOwner {
        _addBundle(name, dataMB, priceInBWD, provider);
    }
    
    function updateRegionBonus(string memory region, uint256 bonusPercentage) external onlyOwner {
        require(bonusPercentage <= 50, "Bonus too high");
        regionBonuses[region] = bonusPercentage;
    }
    
    function updateBaseRewardRate(uint256 newRate) external onlyOwner {
        baseRewardRate = newRate;
    }
    
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = balanceOf(address(this));
        if (balance > 0) {
            _transfer(address(this), owner(), balance);
        }
    }
}
