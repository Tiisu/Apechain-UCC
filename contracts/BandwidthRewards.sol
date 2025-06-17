// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./BWDToken.sol";

/**
 * @title Bandwidth Rewards Distribution Contract
 * @dev Implements Proof-of-Bandwidth verification and reward calculation engine
 * Built for ConnectShare DApp on Ape Chain
 */
contract BandwidthRewards is AccessControl, ReentrancyGuard, Pausable {
    using SafeMath for uint256;
    using ECDSA for bytes32;

    // Roles
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    // BWD Token contract
    BWDToken public bwdToken;

    // Bandwidth sharing data structure
    struct BandwidthProof {
        address user;
        uint256 bandwidthAmount; // in bytes
        uint256 qualityScore; // 0-10000 (100.00%)
        uint256 uptimeScore; // 0-10000 (100.00%)
        uint256 timestamp;
        uint256 duration; // sharing duration in seconds
        bytes32 geohash; // location hash for geographic bonuses
        bytes signature; // cryptographic proof
        bool verified;
        bool rewarded;
    }

    // Reward calculation parameters
    struct RewardParams {
        uint256 baseRewardRate; // BWD per GB per hour
        uint256 qualityMultiplier; // bonus for high quality
        uint256 uptimeMultiplier; // bonus for high uptime
        uint256 geographicBonus; // bonus for underserved areas
        uint256 apeHolderBonus; // bonus for APE holders
        uint256 minimumThreshold; // minimum bandwidth to earn rewards
    }

    // Geographic bonus zones
    mapping(bytes32 => uint256) public geographicBonuses; // geohash => bonus percentage
    mapping(address => uint256) public userReputationScores;
    mapping(address => uint256) public accumulatedRewards;
    mapping(address => uint256) public lastRewardClaim;

    // Batch processing
    struct BatchReward {
        address user;
        uint256 amount;
    }

    // Configuration
    RewardParams public rewardParams;
    uint256 public distributionThreshold = 1 * 10**18; // 1 BWD minimum for distribution
    uint256 public maxBatchSize = 100;
    uint256 public fraudDetectionWindow = 1 hours;
    uint256 public reputationDecayRate = 100; // per day

    // Tracking
    mapping(bytes32 => bool) public processedProofs;
    mapping(address => BandwidthProof[]) public userProofs;
    uint256 public totalBandwidthShared;
    uint256 public totalRewardsDistributed;
    uint256 public activeUsers;

    // Events
    event BandwidthProofSubmitted(address indexed user, bytes32 indexed proofHash, uint256 bandwidthAmount);
    event BandwidthProofVerified(bytes32 indexed proofHash, bool verified);
    event RewardsCalculated(address indexed user, uint256 amount, bytes32 indexed proofHash);
    event RewardsDistributed(address indexed user, uint256 amount);
    event BatchRewardsDistributed(uint256 userCount, uint256 totalAmount);
    event FraudDetected(address indexed user, bytes32 indexed proofHash, string reason);
    event GeographicBonusUpdated(bytes32 indexed geohash, uint256 bonus);
    event RewardParamsUpdated();

    constructor(
        address _bwdToken,
        address _admin
    ) {
        require(_bwdToken != address(0), "Invalid BWD token address");
        require(_admin != address(0), "Invalid admin address");

        bwdToken = BWDToken(_bwdToken);

        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(VALIDATOR_ROLE, _admin);
        _grantRole(DISTRIBUTOR_ROLE, _admin);
        _grantRole(ORACLE_ROLE, _admin);

        // Initialize reward parameters
        rewardParams = RewardParams({
            baseRewardRate: 10 * 10**18, // 10 BWD per GB per hour
            qualityMultiplier: 5000, // 50% max bonus for quality
            uptimeMultiplier: 3000, // 30% max bonus for uptime
            geographicBonus: 2000, // 20% max geographic bonus
            apeHolderBonus: 1000, // 10% APE holder bonus
            minimumThreshold: 1024 * 1024 // 1 MB minimum
        });
    }

    /**
     * @dev Submit bandwidth proof for verification
     */
    function submitBandwidthProof(
        uint256 bandwidthAmount,
        uint256 qualityScore,
        uint256 uptimeScore,
        uint256 duration,
        bytes32 geohash,
        bytes memory signature
    ) external whenNotPaused {
        require(bandwidthAmount >= rewardParams.minimumThreshold, "Below minimum threshold");
        require(qualityScore <= 10000, "Invalid quality score");
        require(uptimeScore <= 10000, "Invalid uptime score");
        require(duration > 0, "Invalid duration");

        // Create proof hash
        bytes32 proofHash = keccak256(abi.encodePacked(
            msg.sender,
            bandwidthAmount,
            qualityScore,
            uptimeScore,
            block.timestamp,
            duration,
            geohash
        ));

        require(!processedProofs[proofHash], "Proof already processed");

        // Create bandwidth proof
        BandwidthProof memory proof = BandwidthProof({
            user: msg.sender,
            bandwidthAmount: bandwidthAmount,
            qualityScore: qualityScore,
            uptimeScore: uptimeScore,
            timestamp: block.timestamp,
            duration: duration,
            geohash: geohash,
            signature: signature,
            verified: false,
            rewarded: false
        });

        userProofs[msg.sender].push(proof);
        processedProofs[proofHash] = true;

        emit BandwidthProofSubmitted(msg.sender, proofHash, bandwidthAmount);
    }

    /**
     * @dev Verify bandwidth proof (only VALIDATOR_ROLE)
     */
    function verifyBandwidthProof(
        address user,
        uint256 proofIndex,
        bool isValid
    ) external onlyRole(VALIDATOR_ROLE) {
        require(proofIndex < userProofs[user].length, "Invalid proof index");
        
        BandwidthProof storage proof = userProofs[user][proofIndex];
        require(!proof.verified, "Proof already verified");

        proof.verified = true;

        bytes32 proofHash = keccak256(abi.encodePacked(
            proof.user,
            proof.bandwidthAmount,
            proof.qualityScore,
            proof.uptimeScore,
            proof.timestamp,
            proof.duration,
            proof.geohash
        ));

        if (isValid) {
            // Calculate and accumulate rewards
            uint256 rewardAmount = calculateReward(proof);
            accumulatedRewards[user] = accumulatedRewards[user].add(rewardAmount);
            
            // Update reputation
            _updateReputation(user, true);
            
            emit RewardsCalculated(user, rewardAmount, proofHash);
        } else {
            // Penalize for invalid proof
            _updateReputation(user, false);
            emit FraudDetected(user, proofHash, "Invalid bandwidth proof");
        }

        emit BandwidthProofVerified(proofHash, isValid);
    }

    /**
     * @dev Calculate reward for bandwidth proof
     */
    function calculateReward(BandwidthProof memory proof) public view returns (uint256) {
        // Base reward: (bandwidth in GB) * (duration in hours) * base rate
        uint256 bandwidthGB = proof.bandwidthAmount.div(1024).div(1024).div(1024);
        uint256 durationHours = proof.duration.div(3600);
        uint256 baseReward = bandwidthGB.mul(durationHours).mul(rewardParams.baseRewardRate);

        // Quality bonus
        uint256 qualityBonus = baseReward.mul(proof.qualityScore).mul(rewardParams.qualityMultiplier).div(10000).div(10000);

        // Uptime bonus
        uint256 uptimeBonus = baseReward.mul(proof.uptimeScore).mul(rewardParams.uptimeMultiplier).div(10000).div(10000);

        // Geographic bonus
        uint256 geoBonus = 0;
        if (geographicBonuses[proof.geohash] > 0) {
            geoBonus = baseReward.mul(geographicBonuses[proof.geohash]).div(10000);
        }

        // APE holder bonus
        uint256 apeBonus = bwdToken.getApeHolderBonus(proof.user, baseReward);

        // Reputation multiplier
        uint256 reputationMultiplier = userReputationScores[proof.user];
        if (reputationMultiplier == 0) reputationMultiplier = 10000; // Default 100%

        uint256 totalReward = baseReward.add(qualityBonus).add(uptimeBonus).add(geoBonus).add(apeBonus);
        totalReward = totalReward.mul(reputationMultiplier).div(10000);

        return totalReward;
    }

    /**
     * @dev Distribute accumulated rewards to user
     */
    function distributeRewards(address user) external nonReentrant whenNotPaused {
        uint256 amount = accumulatedRewards[user];
        require(amount >= distributionThreshold, "Below distribution threshold");

        accumulatedRewards[user] = 0;
        lastRewardClaim[user] = block.timestamp;
        totalRewardsDistributed = totalRewardsDistributed.add(amount);

        // Mint BWD tokens to user
        bwdToken.mint(user, amount);

        emit RewardsDistributed(user, amount);
    }

    /**
     * @dev Batch distribute rewards (only DISTRIBUTOR_ROLE)
     */
    function batchDistributeRewards(address[] calldata users) external onlyRole(DISTRIBUTOR_ROLE) nonReentrant {
        require(users.length <= maxBatchSize, "Batch size too large");

        uint256 totalDistributed = 0;
        uint256 distributedCount = 0;

        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            uint256 amount = accumulatedRewards[user];

            if (amount >= distributionThreshold) {
                accumulatedRewards[user] = 0;
                lastRewardClaim[user] = block.timestamp;
                totalDistributed = totalDistributed.add(amount);
                distributedCount++;

                // Mint BWD tokens to user
                bwdToken.mint(user, amount);
                emit RewardsDistributed(user, amount);
            }
        }

        totalRewardsDistributed = totalRewardsDistributed.add(totalDistributed);
        emit BatchRewardsDistributed(distributedCount, totalDistributed);
    }

    /**
     * @dev Update user reputation score
     */
    function _updateReputation(address user, bool positive) internal {
        uint256 currentScore = userReputationScores[user];
        if (currentScore == 0) currentScore = 10000; // Default 100%

        if (positive) {
            // Increase reputation (max 150%)
            currentScore = currentScore.add(100);
            if (currentScore > 15000) currentScore = 15000;
        } else {
            // Decrease reputation (min 50%)
            currentScore = currentScore.sub(500);
            if (currentScore < 5000) currentScore = 5000;
        }

        userReputationScores[user] = currentScore;
    }

    /**
     * @dev Get user's proof count
     */
    function getUserProofCount(address user) external view returns (uint256) {
        return userProofs[user].length;
    }

    /**
     * @dev Get user's accumulated rewards
     */
    function getUserAccumulatedRewards(address user) external view returns (uint256) {
        return accumulatedRewards[user];
    }

    /**
     * @dev Check if user can claim rewards
     */
    function canClaimRewards(address user) external view returns (bool) {
        return accumulatedRewards[user] >= distributionThreshold;
    }

    // Administrative functions

    /**
     * @dev Update reward parameters (only admin)
     */
    function updateRewardParams(
        uint256 _baseRewardRate,
        uint256 _qualityMultiplier,
        uint256 _uptimeMultiplier,
        uint256 _geographicBonus,
        uint256 _apeHolderBonus,
        uint256 _minimumThreshold
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_qualityMultiplier <= 10000, "Quality multiplier too high");
        require(_uptimeMultiplier <= 10000, "Uptime multiplier too high");
        require(_geographicBonus <= 10000, "Geographic bonus too high");
        require(_apeHolderBonus <= 10000, "APE holder bonus too high");

        rewardParams.baseRewardRate = _baseRewardRate;
        rewardParams.qualityMultiplier = _qualityMultiplier;
        rewardParams.uptimeMultiplier = _uptimeMultiplier;
        rewardParams.geographicBonus = _geographicBonus;
        rewardParams.apeHolderBonus = _apeHolderBonus;
        rewardParams.minimumThreshold = _minimumThreshold;

        emit RewardParamsUpdated();
    }

    /**
     * @dev Set geographic bonus for area (only ORACLE_ROLE)
     */
    function setGeographicBonus(bytes32 geohash, uint256 bonusPercentage) external onlyRole(ORACLE_ROLE) {
        require(bonusPercentage <= 5000, "Bonus too high"); // Max 50% bonus
        geographicBonuses[geohash] = bonusPercentage;
        emit GeographicBonusUpdated(geohash, bonusPercentage);
    }

    /**
     * @dev Update distribution threshold (only admin)
     */
    function updateDistributionThreshold(uint256 newThreshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        distributionThreshold = newThreshold;
    }

    /**
     * @dev Update max batch size (only admin)
     */
    function updateMaxBatchSize(uint256 newMaxBatchSize) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newMaxBatchSize > 0 && newMaxBatchSize <= 1000, "Invalid batch size");
        maxBatchSize = newMaxBatchSize;
    }

    /**
     * @dev Manually adjust user reputation (only admin)
     */
    function adjustUserReputation(address user, uint256 newScore) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newScore >= 1000 && newScore <= 20000, "Invalid reputation score");
        userReputationScores[user] = newScore;
    }

    /**
     * @dev Pause contract (only admin)
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract (only admin)
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Emergency withdraw accumulated rewards (only admin, when paused)
     */
    function emergencyWithdrawRewards(address user) external onlyRole(DEFAULT_ADMIN_ROLE) whenPaused {
        uint256 amount = accumulatedRewards[user];
        require(amount > 0, "No accumulated rewards");

        accumulatedRewards[user] = 0;
        bwdToken.mint(user, amount);

        emit RewardsDistributed(user, amount);
    }

    /**
     * @dev Get contract statistics
     */
    function getContractStats() external view returns (
        uint256 _totalBandwidthShared,
        uint256 _totalRewardsDistributed,
        uint256 _activeUsers,
        uint256 _distributionThreshold,
        uint256 _maxBatchSize
    ) {
        return (
            totalBandwidthShared,
            totalRewardsDistributed,
            activeUsers,
            distributionThreshold,
            maxBatchSize
        );
    }

    /**
     * @dev Get reward parameters
     */
    function getRewardParams() external view returns (RewardParams memory) {
        return rewardParams;
    }
}
