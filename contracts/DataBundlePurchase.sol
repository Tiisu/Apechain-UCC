// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./BWDToken.sol";

/**
 * @title Data Bundle Purchase Contract
 * @dev Handles BWD-to-data conversion, telecom integration, and token burning
 * Built for ConnectShare DApp on Ape Chain
 */
contract DataBundlePurchase is AccessControl, ReentrancyGuard, Pausable {

    // Roles
    bytes32 public constant TELECOM_ROLE = keccak256("TELECOM_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant REFUND_ROLE = keccak256("REFUND_ROLE");

    // BWD Token contract
    BWDToken public bwdToken;

    // Telecom providers
    enum TelecomProvider {
        SAFARICOM,
        MTN,
        AIRTEL,
        ORANGE,
        VODACOM
    }

    // Data bundle structure
    struct DataBundle {
        uint256 id;
        TelecomProvider provider;
        string name;
        uint256 dataAmount; // in MB
        uint256 bwdPrice; // price in BWD tokens
        uint256 validityDays;
        bool active;
        string[] supportedCountries;
    }

    // Purchase record
    struct Purchase {
        uint256 id;
        address user;
        uint256 bundleId;
        string phoneNumber;
        uint256 bwdAmount;
        uint256 timestamp;
        PurchaseStatus status;
        string transactionId; // Telecom API transaction ID
        string failureReason;
    }

    // Purchase status
    enum PurchaseStatus {
        PENDING,
        PROCESSING,
        COMPLETED,
        FAILED,
        REFUNDED
    }

    // Group purchase structure
    struct GroupPurchase {
        uint256 id;
        address organizer;
        uint256 bundleId;
        uint256 targetParticipants;
        uint256 currentParticipants;
        uint256 discountPercentage;
        uint256 deadline;
        bool active;
        bool executed;
        mapping(address => bool) participants;
        mapping(address => string) phoneNumbers;
    }

    // State variables
    mapping(uint256 => DataBundle) public dataBundles;
    mapping(uint256 => Purchase) public purchases;
    mapping(uint256 => GroupPurchase) public groupPurchases;
    mapping(TelecomProvider => string) public telecomAPIEndpoints;
    mapping(TelecomProvider => bool) public telecomProviderActive;
    mapping(string => uint256) public countryToProvider; // country code => provider enum

    uint256 public bundleCount;
    uint256 public purchaseCount;
    uint256 public groupPurchaseCount;
    uint256 public totalPurchaseVolume;
    uint256 public totalBWDBurned;

    // Pricing and fees
    uint256 public platformFeePercentage = 100; // 1% platform fee
    uint256 public groupDiscountThreshold = 10; // Minimum participants for group discount
    uint256 public maxGroupDiscount = 2000; // Maximum 20% group discount
    uint256 public refundWindow = 1 hours; // Window for refunds on failed purchases

    // Events
    event DataBundleAdded(uint256 indexed bundleId, TelecomProvider provider, string name, uint256 bwdPrice);
    event DataBundleUpdated(uint256 indexed bundleId, uint256 newPrice, bool active);
    event PurchaseInitiated(uint256 indexed purchaseId, address indexed user, uint256 bundleId, uint256 bwdAmount);
    event PurchaseCompleted(uint256 indexed purchaseId, string transactionId);
    event PurchaseFailed(uint256 indexed purchaseId, string reason);
    event PurchaseRefunded(uint256 indexed purchaseId, uint256 refundAmount);
    event GroupPurchaseCreated(uint256 indexed groupId, address indexed organizer, uint256 bundleId);
    event GroupPurchaseJoined(uint256 indexed groupId, address indexed participant);
    event GroupPurchaseExecuted(uint256 indexed groupId, uint256 participantCount);
    event TelecomProviderUpdated(TelecomProvider provider, string endpoint, bool active);

    constructor(
        address _bwdToken,
        address _admin
    ) {
        require(_bwdToken != address(0), "Invalid BWD token address");
        require(_admin != address(0), "Invalid admin address");

        bwdToken = BWDToken(_bwdToken);

        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(TELECOM_ROLE, _admin);
        _grantRole(ORACLE_ROLE, _admin);
        _grantRole(REFUND_ROLE, _admin);

        // Initialize telecom providers - Ghana-focused
        telecomProviderActive[TelecomProvider.MTN] = true; // MTN Ghana (Primary)
        telecomProviderActive[TelecomProvider.VODACOM] = true; // Vodafone Ghana
        telecomProviderActive[TelecomProvider.AIRTEL] = true; // AirtelTigo Ghana
        telecomProviderActive[TelecomProvider.ORANGE] = true; // Regional West Africa
        telecomProviderActive[TelecomProvider.SAFARICOM] = true; // Kenya expansion
    }

    /**
     * @dev Add a new data bundle
     */
    function addDataBundle(
        TelecomProvider provider,
        string memory name,
        uint256 dataAmount,
        uint256 bwdPrice,
        uint256 validityDays,
        string[] memory supportedCountries
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(dataAmount > 0, "Data amount must be positive");
        require(bwdPrice > 0, "Price must be positive");
        require(validityDays > 0, "Validity must be positive");
        require(telecomProviderActive[provider], "Provider not active");

        bundleCount++;
        
        dataBundles[bundleCount] = DataBundle({
            id: bundleCount,
            provider: provider,
            name: name,
            dataAmount: dataAmount,
            bwdPrice: bwdPrice,
            validityDays: validityDays,
            active: true,
            supportedCountries: supportedCountries
        });

        emit DataBundleAdded(bundleCount, provider, name, bwdPrice);
    }

    /**
     * @dev Purchase a data bundle
     */
    function purchaseDataBundle(
        uint256 bundleId,
        string memory phoneNumber
    ) external nonReentrant whenNotPaused {
        require(bundleId <= bundleCount && bundleId > 0, "Invalid bundle ID");
        require(bytes(phoneNumber).length > 0, "Phone number required");

        DataBundle memory bundle = dataBundles[bundleId];
        require(bundle.active, "Bundle not active");
        require(telecomProviderActive[bundle.provider], "Provider not active");

        uint256 totalCost = bundle.bwdPrice;
        uint256 platformFee = (totalCost * platformFeePercentage) / 10000;
        uint256 finalCost = totalCost + platformFee;

        require(bwdToken.balanceOf(msg.sender) >= finalCost, "Insufficient BWD balance");

        // Transfer BWD tokens to contract
        require(bwdToken.transferFrom(msg.sender, address(this), finalCost), "Transfer failed");

        // Burn tokens (deflationary mechanism)
        bwdToken.burnFromDataPurchase(address(this), totalCost);
        totalBWDBurned = totalBWDBurned + ((totalCost * bwdToken.burnPercentage()) / 10000);

        purchaseCount++;
        
        purchases[purchaseCount] = Purchase({
            id: purchaseCount,
            user: msg.sender,
            bundleId: bundleId,
            phoneNumber: phoneNumber,
            bwdAmount: finalCost,
            timestamp: block.timestamp,
            status: PurchaseStatus.PENDING,
            transactionId: "",
            failureReason: ""
        });

        totalPurchaseVolume = totalPurchaseVolume + finalCost;

        emit PurchaseInitiated(purchaseCount, msg.sender, bundleId, finalCost);
    }

    /**
     * @dev Create a group purchase
     */
    function createGroupPurchase(
        uint256 bundleId,
        uint256 targetParticipants,
        uint256 discountPercentage,
        uint256 durationHours
    ) external whenNotPaused {
        require(bundleId <= bundleCount && bundleId > 0, "Invalid bundle ID");
        require(targetParticipants >= groupDiscountThreshold, "Not enough target participants");
        require(discountPercentage <= maxGroupDiscount, "Discount too high");
        require(durationHours > 0 && durationHours <= 168, "Invalid duration"); // Max 1 week

        DataBundle memory bundle = dataBundles[bundleId];
        require(bundle.active, "Bundle not active");

        groupPurchaseCount++;

        GroupPurchase storage groupPurchase = groupPurchases[groupPurchaseCount];
        groupPurchase.id = groupPurchaseCount;
        groupPurchase.organizer = msg.sender;
        groupPurchase.bundleId = bundleId;
        groupPurchase.targetParticipants = targetParticipants;
        groupPurchase.currentParticipants = 0;
        groupPurchase.discountPercentage = discountPercentage;
        groupPurchase.deadline = block.timestamp + (durationHours * 1 hours);
        groupPurchase.active = true;
        groupPurchase.executed = false;

        emit GroupPurchaseCreated(groupPurchaseCount, msg.sender, bundleId);
    }

    /**
     * @dev Join a group purchase
     */
    function joinGroupPurchase(
        uint256 groupId,
        string memory phoneNumber
    ) external whenNotPaused {
        require(groupId <= groupPurchaseCount && groupId > 0, "Invalid group ID");
        require(bytes(phoneNumber).length > 0, "Phone number required");

        GroupPurchase storage groupPurchase = groupPurchases[groupId];
        require(groupPurchase.active, "Group purchase not active");
        require(block.timestamp <= groupPurchase.deadline, "Group purchase expired");
        require(!groupPurchase.participants[msg.sender], "Already joined");
        require(groupPurchase.currentParticipants < groupPurchase.targetParticipants, "Group full");

        DataBundle memory bundle = dataBundles[groupPurchase.bundleId];
        uint256 discountedPrice = (bundle.bwdPrice * (10000 - groupPurchase.discountPercentage)) / 10000;
        uint256 platformFee = (discountedPrice * platformFeePercentage) / 10000;
        uint256 finalCost = discountedPrice + platformFee;

        require(bwdToken.balanceOf(msg.sender) >= finalCost, "Insufficient BWD balance");

        // Transfer BWD tokens to contract (held in escrow)
        require(bwdToken.transferFrom(msg.sender, address(this), finalCost), "Transfer failed");

        groupPurchase.participants[msg.sender] = true;
        groupPurchase.phoneNumbers[msg.sender] = phoneNumber;
        groupPurchase.currentParticipants++;

        emit GroupPurchaseJoined(groupId, msg.sender);

        // Auto-execute if target reached
        if (groupPurchase.currentParticipants == groupPurchase.targetParticipants) {
            _executeGroupPurchase(groupId);
        }
    }

    /**
     * @dev Execute group purchase
     */
    function executeGroupPurchase(uint256 groupId) external {
        require(groupId <= groupPurchaseCount && groupId > 0, "Invalid group ID");

        GroupPurchase storage groupPurchase = groupPurchases[groupId];
        require(groupPurchase.active, "Group purchase not active");
        require(
            groupPurchase.currentParticipants >= groupPurchase.targetParticipants ||
            block.timestamp > groupPurchase.deadline,
            "Cannot execute yet"
        );

        _executeGroupPurchase(groupId);
    }

    /**
     * @dev Internal function to execute group purchase
     */
    function _executeGroupPurchase(uint256 groupId) internal {
        GroupPurchase storage groupPurchase = groupPurchases[groupId];
        require(!groupPurchase.executed, "Already executed");

        groupPurchase.executed = true;
        groupPurchase.active = false;

        DataBundle memory bundle = dataBundles[groupPurchase.bundleId];
        uint256 discountedPrice = (bundle.bwdPrice * (10000 - groupPurchase.discountPercentage)) / 10000;

        // Burn tokens for each participant
        uint256 totalBurnAmount = discountedPrice * groupPurchase.currentParticipants;
        bwdToken.burnFromDataPurchase(address(this), totalBurnAmount);
        totalBWDBurned = totalBWDBurned + ((totalBurnAmount * bwdToken.burnPercentage()) / 10000);

        emit GroupPurchaseExecuted(groupId, groupPurchase.currentParticipants);
    }

    /**
     * @dev Complete purchase (called by telecom API integration)
     */
    function completePurchase(
        uint256 purchaseId,
        string memory transactionId
    ) external onlyRole(TELECOM_ROLE) {
        require(purchaseId <= purchaseCount && purchaseId > 0, "Invalid purchase ID");

        Purchase storage purchase = purchases[purchaseId];
        require(purchase.status == PurchaseStatus.PENDING || purchase.status == PurchaseStatus.PROCESSING, "Invalid status");

        purchase.status = PurchaseStatus.COMPLETED;
        purchase.transactionId = transactionId;

        emit PurchaseCompleted(purchaseId, transactionId);
    }

    /**
     * @dev Fail purchase (called by telecom API integration)
     */
    function failPurchase(
        uint256 purchaseId,
        string memory reason
    ) external onlyRole(TELECOM_ROLE) {
        require(purchaseId <= purchaseCount && purchaseId > 0, "Invalid purchase ID");

        Purchase storage purchase = purchases[purchaseId];
        require(purchase.status == PurchaseStatus.PENDING || purchase.status == PurchaseStatus.PROCESSING, "Invalid status");

        purchase.status = PurchaseStatus.FAILED;
        purchase.failureReason = reason;

        emit PurchaseFailed(purchaseId, reason);
    }

    /**
     * @dev Refund failed purchase
     */
    function refundPurchase(uint256 purchaseId) external nonReentrant {
        require(purchaseId <= purchaseCount && purchaseId > 0, "Invalid purchase ID");

        Purchase storage purchase = purchases[purchaseId];
        require(purchase.status == PurchaseStatus.FAILED, "Purchase not failed");
        require(purchase.user == msg.sender || hasRole(REFUND_ROLE, msg.sender), "Not authorized");
        require(block.timestamp <= purchase.timestamp + refundWindow, "Refund window expired");

        purchase.status = PurchaseStatus.REFUNDED;

        // Refund BWD tokens (minus burn amount already processed)
        uint256 refundAmount = purchase.bwdAmount;
        require(bwdToken.transfer(purchase.user, refundAmount), "Refund transfer failed");

        emit PurchaseRefunded(purchaseId, refundAmount);
    }

    // Administrative Functions

    /**
     * @dev Update data bundle
     */
    function updateDataBundle(
        uint256 bundleId,
        uint256 newPrice,
        bool active
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bundleId <= bundleCount && bundleId > 0, "Invalid bundle ID");

        DataBundle storage bundle = dataBundles[bundleId];
        bundle.bwdPrice = newPrice;
        bundle.active = active;

        emit DataBundleUpdated(bundleId, newPrice, active);
    }

    /**
     * @dev Update telecom provider
     */
    function updateTelecomProvider(
        TelecomProvider provider,
        string memory endpoint,
        bool active
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        telecomAPIEndpoints[provider] = endpoint;
        telecomProviderActive[provider] = active;

        emit TelecomProviderUpdated(provider, endpoint, active);
    }

    /**
     * @dev Update platform fee
     */
    function updatePlatformFee(uint256 newFeePercentage) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFeePercentage <= 1000, "Fee too high"); // Max 10%
        platformFeePercentage = newFeePercentage;
    }

    /**
     * @dev Update group purchase parameters
     */
    function updateGroupPurchaseParams(
        uint256 newThreshold,
        uint256 newMaxDiscount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newThreshold > 0, "Invalid threshold");
        require(newMaxDiscount <= 5000, "Discount too high"); // Max 50%

        groupDiscountThreshold = newThreshold;
        maxGroupDiscount = newMaxDiscount;
    }

    /**
     * @dev Update refund window
     */
    function updateRefundWindow(uint256 newWindow) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newWindow >= 30 minutes && newWindow <= 24 hours, "Invalid refund window");
        refundWindow = newWindow;
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Emergency withdraw BWD tokens
     */
    function emergencyWithdraw(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) whenPaused {
        require(amount <= bwdToken.balanceOf(address(this)), "Insufficient balance");
        require(bwdToken.transfer(msg.sender, amount), "Transfer failed");
    }

    // View Functions

    /**
     * @dev Get data bundle details
     */
    function getDataBundle(uint256 bundleId) external view returns (DataBundle memory) {
        require(bundleId <= bundleCount && bundleId > 0, "Invalid bundle ID");
        return dataBundles[bundleId];
    }

    /**
     * @dev Get purchase details
     */
    function getPurchase(uint256 purchaseId) external view returns (Purchase memory) {
        require(purchaseId <= purchaseCount && purchaseId > 0, "Invalid purchase ID");
        return purchases[purchaseId];
    }

    /**
     * @dev Get user's purchase history
     */
    function getUserPurchases(address user) external view returns (uint256[] memory) {
        uint256[] memory userPurchaseIds = new uint256[](purchaseCount);
        uint256 count = 0;

        for (uint256 i = 1; i <= purchaseCount; i++) {
            if (purchases[i].user == user) {
                userPurchaseIds[count] = i;
                count++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = userPurchaseIds[i];
        }

        return result;
    }

    /**
     * @dev Check if user is in group purchase
     */
    function isInGroupPurchase(uint256 groupId, address user) external view returns (bool) {
        require(groupId <= groupPurchaseCount && groupId > 0, "Invalid group ID");
        return groupPurchases[groupId].participants[user];
    }

    /**
     * @dev Get group purchase phone number for user
     */
    function getGroupPurchasePhoneNumber(uint256 groupId, address user) external view returns (string memory) {
        require(groupId <= groupPurchaseCount && groupId > 0, "Invalid group ID");
        require(groupPurchases[groupId].participants[user], "User not in group");
        return groupPurchases[groupId].phoneNumbers[user];
    }

    /**
     * @dev Get contract statistics
     */
    function getContractStats() external view returns (
        uint256 _bundleCount,
        uint256 _purchaseCount,
        uint256 _groupPurchaseCount,
        uint256 _totalPurchaseVolume,
        uint256 _totalBWDBurned
    ) {
        return (
            bundleCount,
            purchaseCount,
            groupPurchaseCount,
            totalPurchaseVolume,
            totalBWDBurned
        );
    }

    /**
     * @dev Get active bundles for provider
     */
    function getActiveBundlesForProvider(TelecomProvider provider) external view returns (uint256[] memory) {
        uint256[] memory activeBundles = new uint256[](bundleCount);
        uint256 count = 0;

        for (uint256 i = 1; i <= bundleCount; i++) {
            if (dataBundles[i].provider == provider && dataBundles[i].active) {
                activeBundles[count] = i;
                count++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeBundles[i];
        }

        return result;
    }
}
