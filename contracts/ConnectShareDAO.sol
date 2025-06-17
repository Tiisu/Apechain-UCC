// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./BWDToken.sol";

/**
 * @title ConnectShare DAO Contract
 * @dev Implements proposal system, weighted voting, treasury management, and regional governance
 * Built for ConnectShare DApp on Ape Chain
 */
contract ConnectShareDAO is AccessControl, ReentrancyGuard, Pausable {
    using SafeMath for uint256;

    // Roles
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");

    // BWD Token contract
    BWDToken public bwdToken;

    // Proposal types
    enum ProposalType {
        PARAMETER_CHANGE,
        TREASURY_SPEND,
        REGIONAL_GOVERNANCE,
        PROTOCOL_UPGRADE,
        PARTNERSHIP
    }

    // Proposal status
    enum ProposalStatus {
        PENDING,
        ACTIVE,
        SUCCEEDED,
        DEFEATED,
        EXECUTED,
        CANCELLED
    }

    // Proposal structure
    struct Proposal {
        uint256 id;
        address proposer;
        ProposalType proposalType;
        string title;
        string description;
        bytes32 region; // for regional governance
        uint256 startTime;
        uint256 endTime;
        uint256 executionTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 quorumRequired;
        uint256 approvalThreshold;
        ProposalStatus status;
        bytes executionData;
        address targetContract;
        uint256 value; // ETH value for treasury proposals
        bool executed;
    }

    // Vote structure
    struct Vote {
        bool hasVoted;
        uint8 support; // 0=against, 1=for, 2=abstain
        uint256 votes;
        string reason;
    }

    // Regional governance
    struct RegionalParams {
        uint256 minProposalThreshold;
        uint256 quorumPercentage;
        uint256 approvalThreshold;
        uint256 votingPeriod;
        bool active;
    }

    // State variables
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Vote)) public proposalVotes;
    mapping(bytes32 => RegionalParams) public regionalParams;
    mapping(address => uint256) public lastProposalTime;
    
    uint256 public proposalCount;
    uint256 public proposalThreshold = 10000 * 10**18; // 10,000 BWD to create proposal
    uint256 public votingDelay = 1 days; // Delay before voting starts
    uint256 public votingPeriod = 7 days; // Voting duration
    uint256 public executionDelay = 2 days; // Delay before execution
    uint256 public quorumPercentage = 400; // 4% of total voting power
    uint256 public approvalThreshold = 5100; // 51% approval required
    uint256 public proposalCooldown = 1 days; // Cooldown between proposals per user

    // Treasury
    uint256 public treasuryBalance;
    mapping(address => uint256) public treasuryAllocations;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        ProposalType proposalType,
        string title,
        uint256 startTime,
        uint256 endTime
    );
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        uint8 support,
        uint256 votes,
        string reason
    );
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    event RegionalParamsUpdated(bytes32 indexed region, RegionalParams params);
    event TreasuryDeposit(address indexed from, uint256 amount);
    event TreasuryWithdrawal(address indexed to, uint256 amount, string purpose);

    constructor(
        address _bwdToken,
        address _admin
    ) {
        require(_bwdToken != address(0), "Invalid BWD token address");
        require(_admin != address(0), "Invalid admin address");

        bwdToken = BWDToken(_bwdToken);

        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(PROPOSER_ROLE, _admin);
        _grantRole(EXECUTOR_ROLE, _admin);
        _grantRole(TREASURY_ROLE, _admin);

        // Initialize default regional parameters
        bytes32 defaultRegion = keccak256("DEFAULT");
        regionalParams[defaultRegion] = RegionalParams({
            minProposalThreshold: proposalThreshold,
            quorumPercentage: quorumPercentage,
            approvalThreshold: approvalThreshold,
            votingPeriod: votingPeriod,
            active: true
        });
    }

    /**
     * @dev Create a new proposal
     */
    function createProposal(
        ProposalType proposalType,
        string memory title,
        string memory description,
        bytes32 region,
        bytes memory executionData,
        address targetContract,
        uint256 value
    ) external whenNotPaused returns (uint256) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(
            block.timestamp >= lastProposalTime[msg.sender].add(proposalCooldown),
            "Proposal cooldown not met"
        );

        // Check proposal threshold
        uint256 userVotingPower = bwdToken.votingPower(msg.sender);
        uint256 requiredThreshold = proposalThreshold;
        
        if (region != bytes32(0) && regionalParams[region].active) {
            requiredThreshold = regionalParams[region].minProposalThreshold;
        }
        
        require(userVotingPower >= requiredThreshold, "Insufficient voting power");

        proposalCount++;
        uint256 proposalId = proposalCount;

        uint256 startTime = block.timestamp.add(votingDelay);
        uint256 endTime = startTime.add(votingPeriod);
        
        if (region != bytes32(0) && regionalParams[region].active) {
            endTime = startTime.add(regionalParams[region].votingPeriod);
        }

        // Calculate quorum and approval thresholds
        uint256 totalVotingPower = bwdToken.totalVotingPower();
        uint256 quorumRequired = totalVotingPower.mul(quorumPercentage).div(10000);
        uint256 approvalThresholdRequired = approvalThreshold;

        if (region != bytes32(0) && regionalParams[region].active) {
            quorumRequired = totalVotingPower.mul(regionalParams[region].quorumPercentage).div(10000);
            approvalThresholdRequired = regionalParams[region].approvalThreshold;
        }

        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            proposalType: proposalType,
            title: title,
            description: description,
            region: region,
            startTime: startTime,
            endTime: endTime,
            executionTime: 0,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            quorumRequired: quorumRequired,
            approvalThreshold: approvalThresholdRequired,
            status: ProposalStatus.PENDING,
            executionData: executionData,
            targetContract: targetContract,
            value: value,
            executed: false
        });

        lastProposalTime[msg.sender] = block.timestamp;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            proposalType,
            title,
            startTime,
            endTime
        );

        return proposalId;
    }

    /**
     * @dev Cast a vote on a proposal
     */
    function castVote(
        uint256 proposalId,
        uint8 support,
        string memory reason
    ) external whenNotPaused {
        require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal ID");
        require(support <= 2, "Invalid support value");

        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.ACTIVE ||
                (proposal.status == ProposalStatus.PENDING && block.timestamp >= proposal.startTime),
                "Proposal not active");
        require(block.timestamp <= proposal.endTime, "Voting period ended");
        require(!proposalVotes[proposalId][msg.sender].hasVoted, "Already voted");

        uint256 userVotingPower = bwdToken.votingPower(msg.sender);
        require(userVotingPower > 0, "No voting power");

        // Update proposal status if needed
        if (proposal.status == ProposalStatus.PENDING) {
            proposal.status = ProposalStatus.ACTIVE;
        }

        // Record vote
        proposalVotes[proposalId][msg.sender] = Vote({
            hasVoted: true,
            support: support,
            votes: userVotingPower,
            reason: reason
        });

        // Update vote counts
        if (support == 0) {
            proposal.againstVotes = proposal.againstVotes.add(userVotingPower);
        } else if (support == 1) {
            proposal.forVotes = proposal.forVotes.add(userVotingPower);
        } else {
            proposal.abstainVotes = proposal.abstainVotes.add(userVotingPower);
        }

        emit VoteCast(msg.sender, proposalId, support, userVotingPower, reason);
    }

    /**
     * @dev Execute a proposal
     */
    function executeProposal(uint256 proposalId) external nonReentrant {
        require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal ID");

        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.ACTIVE, "Proposal not active");
        require(block.timestamp > proposal.endTime, "Voting period not ended");
        require(!proposal.executed, "Proposal already executed");

        // Check if proposal succeeded
        uint256 totalVotes = proposal.forVotes.add(proposal.againstVotes).add(proposal.abstainVotes);
        bool quorumReached = totalVotes >= proposal.quorumRequired;
        bool approvalReached = proposal.forVotes.mul(10000).div(totalVotes) >= proposal.approvalThreshold;

        if (quorumReached && approvalReached) {
            proposal.status = ProposalStatus.SUCCEEDED;
            proposal.executionTime = block.timestamp.add(executionDelay);
        } else {
            proposal.status = ProposalStatus.DEFEATED;
            return;
        }

        // Execute if execution delay has passed
        if (block.timestamp >= proposal.executionTime) {
            proposal.executed = true;
            proposal.status = ProposalStatus.EXECUTED;

            // Execute based on proposal type
            if (proposal.proposalType == ProposalType.TREASURY_SPEND) {
                _executeTreasurySpend(proposal);
            } else if (proposal.proposalType == ProposalType.PARAMETER_CHANGE) {
                _executeParameterChange(proposal);
            } else if (proposal.proposalType == ProposalType.PROTOCOL_UPGRADE) {
                _executeProtocolUpgrade(proposal);
            }

            emit ProposalExecuted(proposalId);
        }
    }

    /**
     * @dev Execute treasury spending proposal
     */
    function _executeTreasurySpend(Proposal memory proposal) internal {
        require(treasuryBalance >= proposal.value, "Insufficient treasury balance");

        treasuryBalance = treasuryBalance.sub(proposal.value);

        if (proposal.value > 0) {
            (bool success, ) = payable(proposal.targetContract).call{value: proposal.value}("");
            require(success, "Treasury transfer failed");
        }

        emit TreasuryWithdrawal(proposal.targetContract, proposal.value, proposal.title);
    }

    /**
     * @dev Execute parameter change proposal
     */
    function _executeParameterChange(Proposal memory proposal) internal {
        // This would contain logic to update contract parameters
        // Implementation depends on specific parameter changes needed
        if (proposal.targetContract != address(0)) {
            (bool success, ) = proposal.targetContract.call(proposal.executionData);
            require(success, "Parameter change execution failed");
        }
    }

    /**
     * @dev Execute protocol upgrade proposal
     */
    function _executeProtocolUpgrade(Proposal memory proposal) internal {
        // This would contain logic for protocol upgrades
        // Implementation depends on upgrade mechanism used
        if (proposal.targetContract != address(0)) {
            (bool success, ) = proposal.targetContract.call(proposal.executionData);
            require(success, "Protocol upgrade execution failed");
        }
    }

    /**
     * @dev Get proposal details
     */
    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal ID");
        return proposals[proposalId];
    }

    /**
     * @dev Get vote details for a user on a proposal
     */
    function getVote(uint256 proposalId, address voter) external view returns (Vote memory) {
        return proposalVotes[proposalId][voter];
    }

    /**
     * @dev Check if proposal can be executed
     */
    function canExecuteProposal(uint256 proposalId) external view returns (bool) {
        if (proposalId > proposalCount || proposalId == 0) return false;

        Proposal memory proposal = proposals[proposalId];
        if (proposal.executed || proposal.status != ProposalStatus.SUCCEEDED) return false;

        return block.timestamp >= proposal.executionTime;
    }

    // Treasury Management

    /**
     * @dev Deposit funds to treasury
     */
    function depositToTreasury() external payable {
        require(msg.value > 0, "Must send ETH");
        treasuryBalance = treasuryBalance.add(msg.value);
        emit TreasuryDeposit(msg.sender, msg.value);
    }

    /**
     * @dev Emergency treasury withdrawal (only TREASURY_ROLE)
     */
    function emergencyTreasuryWithdraw(address payable to, uint256 amount)
        external
        onlyRole(TREASURY_ROLE)
        whenPaused
    {
        require(amount <= treasuryBalance, "Insufficient treasury balance");
        require(to != address(0), "Invalid recipient");

        treasuryBalance = treasuryBalance.sub(amount);
        to.transfer(amount);

        emit TreasuryWithdrawal(to, amount, "Emergency withdrawal");
    }

    // Regional Governance

    /**
     * @dev Set regional governance parameters (only admin)
     */
    function setRegionalParams(
        bytes32 region,
        uint256 minProposalThreshold,
        uint256 quorumPercentage,
        uint256 approvalThreshold,
        uint256 votingPeriod,
        bool active
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(quorumPercentage <= 5000, "Quorum too high"); // Max 50%
        require(approvalThreshold >= 5000 && approvalThreshold <= 10000, "Invalid approval threshold");
        require(votingPeriod >= 1 days && votingPeriod <= 30 days, "Invalid voting period");

        regionalParams[region] = RegionalParams({
            minProposalThreshold: minProposalThreshold,
            quorumPercentage: quorumPercentage,
            approvalThreshold: approvalThreshold,
            votingPeriod: votingPeriod,
            active: active
        });

        emit RegionalParamsUpdated(region, regionalParams[region]);
    }

    /**
     * @dev Cancel a proposal (only admin or proposer)
     */
    function cancelProposal(uint256 proposalId) external {
        require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal ID");

        Proposal storage proposal = proposals[proposalId];
        require(
            msg.sender == proposal.proposer || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Not authorized to cancel"
        );
        require(
            proposal.status == ProposalStatus.PENDING || proposal.status == ProposalStatus.ACTIVE,
            "Cannot cancel proposal"
        );

        proposal.status = ProposalStatus.CANCELLED;
        emit ProposalCancelled(proposalId);
    }

    // Administrative Functions

    /**
     * @dev Update governance parameters (only admin)
     */
    function updateGovernanceParams(
        uint256 _proposalThreshold,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _executionDelay,
        uint256 _quorumPercentage,
        uint256 _approvalThreshold,
        uint256 _proposalCooldown
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_quorumPercentage <= 5000, "Quorum too high");
        require(_approvalThreshold >= 5000 && _approvalThreshold <= 10000, "Invalid approval threshold");
        require(_votingPeriod >= 1 days && _votingPeriod <= 30 days, "Invalid voting period");
        require(_votingDelay <= 7 days, "Voting delay too long");
        require(_executionDelay <= 14 days, "Execution delay too long");

        proposalThreshold = _proposalThreshold;
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        executionDelay = _executionDelay;
        quorumPercentage = _quorumPercentage;
        approvalThreshold = _approvalThreshold;
        proposalCooldown = _proposalCooldown;
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
     * @dev Get governance parameters
     */
    function getGovernanceParams() external view returns (
        uint256 _proposalThreshold,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _executionDelay,
        uint256 _quorumPercentage,
        uint256 _approvalThreshold,
        uint256 _proposalCooldown
    ) {
        return (
            proposalThreshold,
            votingDelay,
            votingPeriod,
            executionDelay,
            quorumPercentage,
            approvalThreshold,
            proposalCooldown
        );
    }

    /**
     * @dev Get treasury balance
     */
    function getTreasuryBalance() external view returns (uint256) {
        return treasuryBalance;
    }

    /**
     * @dev Get regional parameters
     */
    function getRegionalParams(bytes32 region) external view returns (RegionalParams memory) {
        return regionalParams[region];
    }

    // Receive function to accept ETH deposits
    receive() external payable {
        treasuryBalance = treasuryBalance.add(msg.value);
        emit TreasuryDeposit(msg.sender, msg.value);
    }
}
