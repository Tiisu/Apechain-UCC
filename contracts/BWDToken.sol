// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
/**
 * @title BWD Token (Bandwidth Token)
 * @dev ERC-20 token with deflationary mechanism, staking, governance, and APE holder verification
 * Built for ConnectShare DApp on Ape Chain
 */
contract BWDToken is ERC20, ERC20Burnable, ERC20Pausable, AccessControl, ReentrancyGuard {

    // Roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    // Token configuration
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion BWD
    uint256 public constant MAX_SUPPLY = 10_000_000_000 * 10**18; // 10 billion BWD max
    
    // Deflationary mechanism
    uint256 public burnPercentage = 200; // 2% burn on data purchases (in basis points)
    uint256 public constant MAX_BURN_PERCENTAGE = 1000; // 10% max burn rate
    
    // APE token contract address (ApeCoin on Ape Chain)
    address public apeTokenAddress;
    uint256 public apeHolderBonusPercentage = 1000; // 10% bonus for APE holders
    uint256 public minimumApeBalance = 1 * 10**18; // Minimum 1 APE token required
    
    // Staking configuration
    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 lockPeriod;
        uint256 rewardRate; // APY in basis points
        bool claimed;
    }
    
    mapping(address => StakeInfo[]) public userStakes;
    mapping(uint256 => uint256) public lockPeriodToAPY; // lock period (days) => APY (basis points)
    uint256 public totalStaked;
    uint256 public stakingRewardsPool;
    
    // Governance
    mapping(address => uint256) public votingPower;
    uint256 public totalVotingPower;
    
    // Events
    event TokensBurned(uint256 amount, string reason);
    event TokensStaked(address indexed user, uint256 amount, uint256 lockPeriod);
    event StakeWithdrawn(address indexed user, uint256 stakeIndex, uint256 amount, uint256 rewards);
    event APETokenAddressUpdated(address indexed newAddress);
    event BurnPercentageUpdated(uint256 newPercentage);
    event StakingAPYUpdated(uint256 lockPeriod, uint256 newAPY);
    event VotingPowerUpdated(address indexed user, uint256 newVotingPower);

    constructor(
        address _apeTokenAddress,
        address _admin
    ) ERC20("Bandwidth Token", "BWD") {
        require(_apeTokenAddress != address(0), "Invalid APE token address");
        require(_admin != address(0), "Invalid admin address");
        
        apeTokenAddress = _apeTokenAddress;
        
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(MINTER_ROLE, _admin);
        _grantRole(BURNER_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);
        _grantRole(GOVERNANCE_ROLE, _admin);
        
        // Initialize staking APY rates
        lockPeriodToAPY[30] = 500;   // 30 days = 5% APY
        lockPeriodToAPY[90] = 800;   // 90 days = 8% APY
        lockPeriodToAPY[180] = 1200; // 180 days = 12% APY
        lockPeriodToAPY[365] = 1800; // 365 days = 18% APY
        
        // Mint initial supply
        _mint(_admin, INITIAL_SUPPLY);
        
        // Initialize voting power
        _updateVotingPower(_admin);
    }

    /**
     * @dev Mint new tokens (only MINTER_ROLE)
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
        _updateVotingPower(to);
    }

    /**
     * @dev Burn tokens with reason (only BURNER_ROLE)
     */
    function burnWithReason(uint256 amount, string memory reason) external onlyRole(BURNER_ROLE) {
        _burn(msg.sender, amount);
        emit TokensBurned(amount, reason);
    }

    /**
     * @dev Burn tokens from data bundle purchases
     */
    function burnFromDataPurchase(address user, uint256 purchaseAmount) external onlyRole(BURNER_ROLE) {
        uint256 burnAmount = (purchaseAmount * burnPercentage) / 10000;
        require(balanceOf(user) >= burnAmount, "Insufficient balance for burn");

        _burn(user, burnAmount);
        emit TokensBurned(burnAmount, "Data bundle purchase");

        _updateVotingPower(user);
    }

    /**
     * @dev Check if user is APE holder
     */
    function isApeHolder(address user) public view returns (bool) {
        if (apeTokenAddress == address(0)) return false;
        
        try IERC20(apeTokenAddress).balanceOf(user) returns (uint256 balance) {
            return balance >= minimumApeBalance;
        } catch {
            return false;
        }
    }

    /**
     * @dev Get APE holder bonus for user
     */
    function getApeHolderBonus(address user, uint256 baseAmount) public view returns (uint256) {
        if (!isApeHolder(user)) return 0;
        return baseAmount.mul(apeHolderBonusPercentage).div(10000);
    }

    /**
     * @dev Stake tokens for rewards
     */
    function stake(uint256 amount, uint256 lockPeriodDays) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(lockPeriodToAPY[lockPeriodDays] > 0, "Invalid lock period");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);

        // Create stake
        userStakes[msg.sender].push(StakeInfo({
            amount: amount,
            startTime: block.timestamp,
            lockPeriod: lockPeriodDays * 1 days,
            rewardRate: lockPeriodToAPY[lockPeriodDays],
            claimed: false
        }));

        totalStaked = totalStaked.add(amount);

        // Update voting power (staked tokens get 1.5x voting power)
        _updateVotingPower(msg.sender);

        emit TokensStaked(msg.sender, amount, lockPeriodDays);
    }

    /**
     * @dev Withdraw stake and rewards
     */
    function withdrawStake(uint256 stakeIndex) external nonReentrant {
        require(stakeIndex < userStakes[msg.sender].length, "Invalid stake index");

        StakeInfo storage stakeInfo = userStakes[msg.sender][stakeIndex];
        require(!stakeInfo.claimed, "Stake already claimed");
        require(block.timestamp >= stakeInfo.startTime.add(stakeInfo.lockPeriod), "Lock period not ended");

        uint256 stakedAmount = stakeInfo.amount;
        uint256 rewards = calculateStakeRewards(msg.sender, stakeIndex);

        stakeInfo.claimed = true;
        totalStaked = totalStaked.sub(stakedAmount);

        // Transfer staked amount back
        _transfer(address(this), msg.sender, stakedAmount);

        // Mint rewards if available
        if (rewards > 0 && stakingRewardsPool >= rewards) {
            stakingRewardsPool = stakingRewardsPool.sub(rewards);
            _mint(msg.sender, rewards);
        }

        // Update voting power
        _updateVotingPower(msg.sender);

        emit StakeWithdrawn(msg.sender, stakeIndex, stakedAmount, rewards);
    }

    /**
     * @dev Calculate stake rewards
     */
    function calculateStakeRewards(address user, uint256 stakeIndex) public view returns (uint256) {
        require(stakeIndex < userStakes[user].length, "Invalid stake index");

        StakeInfo memory stakeInfo = userStakes[user][stakeIndex];
        if (stakeInfo.claimed) return 0;

        uint256 stakingDuration = block.timestamp.sub(stakeInfo.startTime);
        if (stakingDuration < stakeInfo.lockPeriod) return 0;

        // Calculate base rewards: (amount * APY * time) / (365 days * 10000)
        uint256 baseRewards = stakeInfo.amount
            .mul(stakeInfo.rewardRate)
            .mul(stakingDuration)
            .div(365 days)
            .div(10000);

        // Add APE holder bonus
        uint256 apeBonus = getApeHolderBonus(user, baseRewards);

        return baseRewards.add(apeBonus);
    }

    /**
     * @dev Get user's total staked amount
     */
    function getUserStakedAmount(address user) external view returns (uint256) {
        uint256 totalUserStaked = 0;
        for (uint256 i = 0; i < userStakes[user].length; i++) {
            if (!userStakes[user][i].claimed) {
                totalUserStaked = totalUserStaked.add(userStakes[user][i].amount);
            }
        }
        return totalUserStaked;
    }

    /**
     * @dev Get user's stake count
     */
    function getUserStakeCount(address user) external view returns (uint256) {
        return userStakes[user].length;
    }

    /**
     * @dev Update voting power for user
     */
    function _updateVotingPower(address user) internal {
        uint256 oldVotingPower = votingPower[user];

        // Base voting power from token balance
        uint256 newVotingPower = balanceOf(user);

        // Add 1.5x voting power for staked tokens
        uint256 stakedAmount = this.getUserStakedAmount(user);
        newVotingPower = newVotingPower.add(stakedAmount.mul(15).div(10));

        // Add 2x voting power for APE holders
        if (isApeHolder(user)) {
            newVotingPower = newVotingPower.mul(2);
        }

        votingPower[user] = newVotingPower;
        totalVotingPower = totalVotingPower.sub(oldVotingPower).add(newVotingPower);

        emit VotingPowerUpdated(user, newVotingPower);
    }

    // Administrative functions

    /**
     * @dev Update APE token address (only admin)
     */
    function updateApeTokenAddress(address newApeTokenAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newApeTokenAddress != address(0), "Invalid address");
        apeTokenAddress = newApeTokenAddress;
        emit APETokenAddressUpdated(newApeTokenAddress);
    }

    /**
     * @dev Update burn percentage (only admin)
     */
    function updateBurnPercentage(uint256 newBurnPercentage) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newBurnPercentage <= MAX_BURN_PERCENTAGE, "Burn percentage too high");
        burnPercentage = newBurnPercentage;
        emit BurnPercentageUpdated(newBurnPercentage);
    }

    /**
     * @dev Update staking APY for lock period (only admin)
     */
    function updateStakingAPY(uint256 lockPeriodDays, uint256 newAPY) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newAPY <= 5000, "APY too high"); // Max 50% APY
        lockPeriodToAPY[lockPeriodDays] = newAPY;
        emit StakingAPYUpdated(lockPeriodDays, newAPY);
    }

    /**
     * @dev Add funds to staking rewards pool (only admin)
     */
    function addStakingRewards(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _transfer(msg.sender, address(this), amount);
        stakingRewardsPool = stakingRewardsPool.add(amount);
    }

    /**
     * @dev Update minimum APE balance requirement (only admin)
     */
    function updateMinimumApeBalance(uint256 newMinimum) external onlyRole(DEFAULT_ADMIN_ROLE) {
        minimumApeBalance = newMinimum;
    }

    /**
     * @dev Update APE holder bonus percentage (only admin)
     */
    function updateApeHolderBonus(uint256 newBonusPercentage) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newBonusPercentage <= 2000, "Bonus too high"); // Max 20% bonus
        apeHolderBonusPercentage = newBonusPercentage;
    }

    /**
     * @dev Pause contract (only PAUSER_ROLE)
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract (only PAUSER_ROLE)
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Emergency withdraw (only admin, when paused)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) whenPaused {
        if (token == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            IERC20(token).transfer(msg.sender, amount);
        }
    }

    // Override functions for pausable functionality

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Pausable) {
        super._beforeTokenTransfer(from, to, amount);

        // Update voting power after transfer
        if (from != address(0)) _updateVotingPower(from);
        if (to != address(0)) _updateVotingPower(to);
    }

    /**
     * @dev Get contract information
     */
    function getContractInfo() external view returns (
        uint256 _totalSupply,
        uint256 _maxSupply,
        uint256 _totalStaked,
        uint256 _stakingRewardsPool,
        uint256 _burnPercentage,
        uint256 _totalVotingPower,
        address _apeTokenAddress
    ) {
        return (
            totalSupply(),
            MAX_SUPPLY,
            totalStaked,
            stakingRewardsPool,
            burnPercentage,
            totalVotingPower,
            apeTokenAddress
        );
    }
}
