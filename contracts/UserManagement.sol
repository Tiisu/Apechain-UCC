// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./BWDToken.sol";

/**
 * @title User Management & KYC Contract
 * @dev Handles user registration, KYC tracking, reputation scoring, and referral program
 * Built for ConnectShare DApp on Ape Chain
 */
contract UserManagement is AccessControl, ReentrancyGuard, Pausable {
    using Strings for uint256;

    // Roles
    bytes32 public constant KYC_VERIFIER_ROLE = keccak256("KYC_VERIFIER_ROLE");
    bytes32 public constant REPUTATION_MANAGER_ROLE = keccak256("REPUTATION_MANAGER_ROLE");

    // BWD Token contract
    BWDToken public bwdToken;

    // KYC Status
    enum KYCStatus {
        NOT_SUBMITTED,
        PENDING,
        VERIFIED,
        REJECTED,
        EXPIRED
    }

    // User profile structure
    struct UserProfile {
        address userAddress;
        string phoneNumber;
        bytes32 phoneHash; // Hashed phone number for privacy
        string country;
        KYCStatus kycStatus;
        uint256 kycTimestamp;
        uint256 registrationTimestamp;
        uint256 reputationScore;
        uint256 totalBandwidthShared;
        uint256 totalEarnings;
        uint256 referralCount;
        address referredBy;
        bool active;
        string mobileMoneyProvider; // M-Pesa, MTN, etc.
        string mobileMoneyAccount;
    }

    // Referral structure
    struct ReferralProgram {
        uint256 referrerBonus; // BWD tokens for referrer
        uint256 refereeBonus; // BWD tokens for new user
        uint256 minimumActivity; // Minimum bandwidth sharing to qualify
        uint256 bonusValidityPeriod; // How long bonus is valid
        bool active;
    }

    // Reputation factors
    struct ReputationFactors {
        uint256 bandwidthSharingWeight;
        uint256 uptimeWeight;
        uint256 qualityWeight;
        uint256 communityParticipationWeight;
        uint256 kycVerificationBonus;
        uint256 maxReputationScore;
    }

    // State variables
    mapping(address => UserProfile) public userProfiles;
    mapping(bytes32 => address) public phoneHashToAddress;
    mapping(address => address[]) public userReferrals;
    mapping(address => uint256) public pendingReferralBonuses;
    mapping(string => bool) public supportedCountries;
    mapping(string => bool) public supportedMobileMoneyProviders;

    ReferralProgram public referralProgram;
    ReputationFactors public reputationFactors;

    uint256 public totalUsers;
    uint256 public verifiedUsers;
    uint256 public totalReferrals;
    uint256 public totalReferralBonusesPaid;

    // KYC requirements
    uint256 public kycValidityPeriod = 365 days; // KYC valid for 1 year
    uint256 public minimumReputationForKYC = 1000; // Minimum reputation to apply for KYC

    // Events
    event UserRegistered(address indexed user, string phoneNumber, string country);
    event KYCSubmitted(address indexed user, uint256 timestamp);
    event KYCStatusUpdated(address indexed user, KYCStatus status, uint256 timestamp);
    event ReputationUpdated(address indexed user, uint256 oldScore, uint256 newScore);
    event ReferralRegistered(address indexed referrer, address indexed referee, uint256 bonusAmount);
    event ReferralBonusPaid(address indexed user, uint256 amount);
    event MobileMoneyLinked(address indexed user, string provider, string account);
    event UserProfileUpdated(address indexed user);

    constructor(
        address _bwdToken,
        address _admin
    ) {
        require(_bwdToken != address(0), "Invalid BWD token address");
        require(_admin != address(0), "Invalid admin address");

        bwdToken = BWDToken(_bwdToken);

        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(KYC_VERIFIER_ROLE, _admin);
        _grantRole(REPUTATION_MANAGER_ROLE, _admin);

        // Initialize referral program - Ghana-optimized
        referralProgram = ReferralProgram({
            referrerBonus: 30 * 10**18, // 30 BWD for referrer (affordable for Ghana)
            refereeBonus: 15 * 10**18, // 15 BWD for new user (welcome bonus)
            minimumActivity: 512 * 1024 * 1024, // 512 MB minimum sharing (lower threshold)
            bonusValidityPeriod: 30 days,
            active: true
        });

        // Initialize reputation factors
        reputationFactors = ReputationFactors({
            bandwidthSharingWeight: 4000, // 40%
            uptimeWeight: 2000, // 20%
            qualityWeight: 2000, // 20%
            communityParticipationWeight: 1000, // 10%
            kycVerificationBonus: 1000, // 10%
            maxReputationScore: 10000 // 100%
        });

        // Initialize supported countries - Ghana as primary target
        supportedCountries["GH"] = true; // Ghana (Primary target)
        supportedCountries["CI"] = true; // Côte d'Ivoire (neighboring)
        supportedCountries["BF"] = true; // Burkina Faso (neighboring)
        supportedCountries["TG"] = true; // Togo (neighboring)
        supportedCountries["NG"] = true; // Nigeria (regional expansion)
        supportedCountries["KE"] = true; // Kenya (future expansion)
        supportedCountries["UG"] = true; // Uganda (future expansion)
        supportedCountries["TZ"] = true; // Tanzania (future expansion)

        // Initialize supported mobile money providers - Ghana-focused
        supportedMobileMoneyProviders["MTN Mobile Money"] = true; // Primary in Ghana
        supportedMobileMoneyProviders["Vodafone Cash"] = true; // Ghana-specific
        supportedMobileMoneyProviders["AirtelTigo Money"] = true; // Ghana-specific
        supportedMobileMoneyProviders["Zeepay"] = true; // Ghana-specific
        supportedMobileMoneyProviders["G-Money"] = true; // Ghana-specific
        supportedMobileMoneyProviders["Orange Money"] = true; // West Africa regional
        supportedMobileMoneyProviders["M-Pesa"] = true; // Kenya expansion
        supportedMobileMoneyProviders["Airtel Money"] = true; // Multi-country
    }

    /**
     * @dev Register a new user
     */
    function registerUser(
        string memory phoneNumber,
        string memory country,
        address referrer
    ) external whenNotPaused {
        require(bytes(phoneNumber).length > 0, "Phone number required");
        require(supportedCountries[country], "Country not supported");
        require(userProfiles[msg.sender].userAddress == address(0), "User already registered");

        bytes32 phoneHash = keccak256(abi.encodePacked(phoneNumber));
        require(phoneHashToAddress[phoneHash] == address(0), "Phone number already registered");

        // Validate referrer
        if (referrer != address(0)) {
            require(userProfiles[referrer].active, "Invalid referrer");
            require(referrer != msg.sender, "Cannot refer yourself");
        }

        // Create user profile
        userProfiles[msg.sender] = UserProfile({
            userAddress: msg.sender,
            phoneNumber: phoneNumber,
            phoneHash: phoneHash,
            country: country,
            kycStatus: KYCStatus.NOT_SUBMITTED,
            kycTimestamp: 0,
            registrationTimestamp: block.timestamp,
            reputationScore: 1000, // Starting reputation
            totalBandwidthShared: 0,
            totalEarnings: 0,
            referralCount: 0,
            referredBy: referrer,
            active: true,
            mobileMoneyProvider: "",
            mobileMoneyAccount: ""
        });

        phoneHashToAddress[phoneHash] = msg.sender;
        totalUsers++;

        // Handle referral
        if (referrer != address(0)) {
            userReferrals[referrer].push(msg.sender);
            userProfiles[referrer].referralCount++;
            totalReferrals++;

            // Queue referral bonuses (paid after minimum activity)
            if (referralProgram.active) {
                pendingReferralBonuses[referrer] = pendingReferralBonuses[referrer] + referralProgram.referrerBonus;
                pendingReferralBonuses[msg.sender] = pendingReferralBonuses[msg.sender] + referralProgram.refereeBonus;

                emit ReferralRegistered(referrer, msg.sender, referralProgram.referrerBonus + referralProgram.refereeBonus);
            }
        }

        emit UserRegistered(msg.sender, phoneNumber, country);
    }

    /**
     * @dev Submit KYC application
     */
    function submitKYC() external {
        require(userProfiles[msg.sender].active, "User not registered");
        require(userProfiles[msg.sender].reputationScore >= minimumReputationForKYC, "Insufficient reputation");
        require(
            userProfiles[msg.sender].kycStatus == KYCStatus.NOT_SUBMITTED || 
            userProfiles[msg.sender].kycStatus == KYCStatus.REJECTED ||
            userProfiles[msg.sender].kycStatus == KYCStatus.EXPIRED,
            "KYC already submitted or verified"
        );

        userProfiles[msg.sender].kycStatus = KYCStatus.PENDING;
        userProfiles[msg.sender].kycTimestamp = block.timestamp;

        emit KYCSubmitted(msg.sender, block.timestamp);
    }

    /**
     * @dev Update KYC status (only KYC_VERIFIER_ROLE)
     */
    function updateKYCStatus(
        address user,
        KYCStatus status
    ) external onlyRole(KYC_VERIFIER_ROLE) {
        require(userProfiles[user].active, "User not registered");
        require(status != KYCStatus.NOT_SUBMITTED, "Invalid status");

        KYCStatus oldStatus = userProfiles[user].kycStatus;
        userProfiles[user].kycStatus = status;
        userProfiles[user].kycTimestamp = block.timestamp;

        if (status == KYCStatus.VERIFIED && oldStatus != KYCStatus.VERIFIED) {
            verifiedUsers++;
            // Update reputation with KYC bonus
            _updateReputation(user, reputationFactors.kycVerificationBonus, true);
        } else if (oldStatus == KYCStatus.VERIFIED && status != KYCStatus.VERIFIED) {
            verifiedUsers--;
        }

        emit KYCStatusUpdated(user, status, block.timestamp);
    }

    /**
     * @dev Link mobile money account
     */
    function linkMobileMoneyAccount(
        string memory provider,
        string memory account
    ) external {
        require(userProfiles[msg.sender].active, "User not registered");
        require(supportedMobileMoneyProviders[provider], "Provider not supported");
        require(bytes(account).length > 0, "Account required");

        userProfiles[msg.sender].mobileMoneyProvider = provider;
        userProfiles[msg.sender].mobileMoneyAccount = account;

        emit MobileMoneyLinked(msg.sender, provider, account);
    }

    /**
     * @dev Update user bandwidth sharing stats
     */
    function updateBandwidthStats(
        address user,
        uint256 bandwidthAmount,
        uint256 earnings
    ) external onlyRole(REPUTATION_MANAGER_ROLE) {
        require(userProfiles[user].active, "User not registered");

        userProfiles[user].totalBandwidthShared = userProfiles[user].totalBandwidthShared + bandwidthAmount;
        userProfiles[user].totalEarnings = userProfiles[user].totalEarnings + earnings;

        // Check if user qualifies for referral bonus
        if (userProfiles[user].totalBandwidthShared >= referralProgram.minimumActivity) {
            _payReferralBonus(user);
        }

        // Update reputation based on bandwidth sharing
        uint256 reputationIncrease = bandwidthAmount / 1024 / 1024 / 100; // 1 point per 100MB
        _updateReputation(user, reputationIncrease, true);

        emit UserProfileUpdated(user);
    }

    /**
     * @dev Update user reputation
     */
    function _updateReputation(address user, uint256 amount, bool increase) internal {
        uint256 oldScore = userProfiles[user].reputationScore;
        uint256 newScore;

        if (increase) {
            newScore = oldScore + amount;
            if (newScore > reputationFactors.maxReputationScore) {
                newScore = reputationFactors.maxReputationScore;
            }
        } else {
            if (amount >= oldScore) {
                newScore = 100; // Minimum reputation
            } else {
                newScore = oldScore - amount;
            }
        }

        userProfiles[user].reputationScore = newScore;
        emit ReputationUpdated(user, oldScore, newScore);
    }

    /**
     * @dev Pay referral bonus
     */
    function _payReferralBonus(address user) internal {
        uint256 bonus = pendingReferralBonuses[user];
        if (bonus > 0) {
            pendingReferralBonuses[user] = 0;
            totalReferralBonusesPaid = totalReferralBonusesPaid + bonus;

            // Mint BWD tokens as referral bonus
            bwdToken.mint(user, bonus);

            emit ReferralBonusPaid(user, bonus);
        }
    }

    /**
     * @dev Manually adjust user reputation (only REPUTATION_MANAGER_ROLE)
     */
    function adjustReputation(
        address user,
        uint256 newScore
    ) external onlyRole(REPUTATION_MANAGER_ROLE) {
        require(userProfiles[user].active, "User not registered");
        require(newScore <= reputationFactors.maxReputationScore, "Score too high");
        require(newScore >= 100, "Score too low");

        uint256 oldScore = userProfiles[user].reputationScore;
        userProfiles[user].reputationScore = newScore;

        emit ReputationUpdated(user, oldScore, newScore);
    }

    /**
     * @dev Check if KYC is expired
     */
    function isKYCExpired(address user) public view returns (bool) {
        if (userProfiles[user].kycStatus != KYCStatus.VERIFIED) return false;
        return block.timestamp > userProfiles[user].kycTimestamp + kycValidityPeriod;
    }

    /**
     * @dev Expire KYC for user
     */
    function expireKYC(address user) external {
        require(isKYCExpired(user), "KYC not expired");

        userProfiles[user].kycStatus = KYCStatus.EXPIRED;
        verifiedUsers--;

        emit KYCStatusUpdated(user, KYCStatus.EXPIRED, block.timestamp);
    }

    // Administrative Functions

    /**
     * @dev Update referral program parameters
     */
    function updateReferralProgram(
        uint256 referrerBonus,
        uint256 refereeBonus,
        uint256 minimumActivity,
        uint256 bonusValidityPeriod,
        bool active
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        referralProgram.referrerBonus = referrerBonus;
        referralProgram.refereeBonus = refereeBonus;
        referralProgram.minimumActivity = minimumActivity;
        referralProgram.bonusValidityPeriod = bonusValidityPeriod;
        referralProgram.active = active;
    }

    /**
     * @dev Update reputation factors
     */
    function updateReputationFactors(
        uint256 bandwidthWeight,
        uint256 uptimeWeight,
        uint256 qualityWeight,
        uint256 communityWeight,
        uint256 kycBonus,
        uint256 maxScore
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            bandwidthWeight + uptimeWeight + qualityWeight + communityWeight + kycBonus <= 10000,
            "Total weights exceed 100%"
        );

        reputationFactors.bandwidthSharingWeight = bandwidthWeight;
        reputationFactors.uptimeWeight = uptimeWeight;
        reputationFactors.qualityWeight = qualityWeight;
        reputationFactors.communityParticipationWeight = communityWeight;
        reputationFactors.kycVerificationBonus = kycBonus;
        reputationFactors.maxReputationScore = maxScore;
    }

    /**
     * @dev Add supported country
     */
    function addSupportedCountry(string memory countryCode) external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedCountries[countryCode] = true;
    }

    /**
     * @dev Remove supported country
     */
    function removeSupportedCountry(string memory countryCode) external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedCountries[countryCode] = false;
    }

    /**
     * @dev Add supported mobile money provider
     */
    function addMobileMoneyProvider(string memory provider) external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedMobileMoneyProviders[provider] = true;
    }

    /**
     * @dev Remove supported mobile money provider
     */
    function removeMobileMoneyProvider(string memory provider) external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedMobileMoneyProviders[provider] = false;
    }

    /**
     * @dev Update KYC validity period
     */
    function updateKYCValidityPeriod(uint256 newPeriod) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newPeriod >= 30 days && newPeriod <= 1095 days, "Invalid period"); // 30 days to 3 years
        kycValidityPeriod = newPeriod;
    }

    /**
     * @dev Update minimum reputation for KYC
     */
    function updateMinimumReputationForKYC(uint256 newMinimum) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newMinimum >= 100 && newMinimum <= 5000, "Invalid minimum");
        minimumReputationForKYC = newMinimum;
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

    // View Functions

    /**
     * @dev Get user profile
     */
    function getUserProfile(address user) external view returns (UserProfile memory) {
        return userProfiles[user];
    }

    /**
     * @dev Get user referrals
     */
    function getUserReferrals(address user) external view returns (address[] memory) {
        return userReferrals[user];
    }

    /**
     * @dev Get pending referral bonus
     */
    function getPendingReferralBonus(address user) external view returns (uint256) {
        return pendingReferralBonuses[user];
    }

    /**
     * @dev Check if user is registered
     */
    function isUserRegistered(address user) external view returns (bool) {
        return userProfiles[user].userAddress != address(0);
    }

    /**
     * @dev Check if phone number is registered
     */
    function isPhoneNumberRegistered(string memory phoneNumber) external view returns (bool) {
        bytes32 phoneHash = keccak256(abi.encodePacked(phoneNumber));
        return phoneHashToAddress[phoneHash] != address(0);
    }

    /**
     * @dev Get user by phone hash
     */
    function getUserByPhoneHash(bytes32 phoneHash) external view returns (address) {
        return phoneHashToAddress[phoneHash];
    }

    /**
     * @dev Check if country is supported
     */
    function isCountrySupported(string memory countryCode) external view returns (bool) {
        return supportedCountries[countryCode];
    }

    /**
     * @dev Check if mobile money provider is supported
     */
    function isMobileMoneyProviderSupported(string memory provider) external view returns (bool) {
        return supportedMobileMoneyProviders[provider];
    }

    /**
     * @dev Get contract statistics
     */
    function getContractStats() external view returns (
        uint256 _totalUsers,
        uint256 _verifiedUsers,
        uint256 _totalReferrals,
        uint256 _totalReferralBonusesPaid
    ) {
        return (
            totalUsers,
            verifiedUsers,
            totalReferrals,
            totalReferralBonusesPaid
        );
    }

    /**
     * @dev Get referral program details
     */
    function getReferralProgram() external view returns (ReferralProgram memory) {
        return referralProgram;
    }

    /**
     * @dev Get reputation factors
     */
    function getReputationFactors() external view returns (ReputationFactors memory) {
        return reputationFactors;
    }

    /**
     * @dev Calculate user reputation score based on activities
     */
    function calculateReputationScore(
        uint256 bandwidthShared,
        uint256 uptimePercentage,
        uint256 qualityScore,
        uint256 communityParticipation,
        bool isKYCVerified
    ) external view returns (uint256) {
        uint256 bandwidthScore = bandwidthShared / 1024 / 1024 / 1024; // Points per GB
        if (bandwidthScore > 1000) bandwidthScore = 1000; // Cap at 1000 points

        uint256 totalScore = 0;

        // Bandwidth sharing component
        totalScore = totalScore + ((bandwidthScore * reputationFactors.bandwidthSharingWeight) / 10000);

        // Uptime component
        totalScore = totalScore + ((uptimePercentage * reputationFactors.uptimeWeight) / 10000);

        // Quality component
        totalScore = totalScore + ((qualityScore * reputationFactors.qualityWeight) / 10000);

        // Community participation component
        totalScore = totalScore + ((communityParticipation * reputationFactors.communityParticipationWeight) / 10000);

        // KYC verification bonus
        if (isKYCVerified) {
            totalScore = totalScore + reputationFactors.kycVerificationBonus;
        }

        // Ensure score doesn't exceed maximum
        if (totalScore > reputationFactors.maxReputationScore) {
            totalScore = reputationFactors.maxReputationScore;
        }

        return totalScore;
    }
}
