// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "hardhat/console.sol";
import "./MultiSigFactory.sol";


contract MultiSig{
    //Custom Errors - Start
    error AlreadyOwner(address _newOwner);
    error InvalidOwner(address _owner);
    error NotAnOwner();
    error NotAllowed();
    error InvalidApprovalsValue(uint _value);
    error InvalidTxnId(uint256 _txnId);
    error NotEnoughApprovals(uint256 _txnId);
    error TxnAlreadyConfirmed(address _owner, uint256 _txnId);
    error TxnNotConfirmed(address _owner, uint256 _txnId);
    error TxnAlreadyExecuted(uint256 _txnId);

    //Custom Errors - End

    //EVENTS - Start
    event Deposit(address indexed sender, uint256 value);
    event NewOwner(address indexed owner);
    event RemovedOwner(address indexed owner, uint256 newApprovalVal);
    event NewProposal(address indexed owner, uint256 txnId);
    event ExecutedProposal(address indexed owner, uint256 txnId);
    event ApprovedProposal(address indexed owner, uint256 txnId);
    event RevokedApproval(address indexed owner, uint256 txnId);
    //EVENTS - End

    address[] public walletOwners;
    mapping(address => bool) public isOwner;
    uint256 public approvalsRequired;

    struct TransactionProposals {
        string name;
        address to;
        uint256 value;
        bytes data;
        uint256 confirmations;
        bool executed;
    }
    
    TransactionProposals[] public transactions;

    // mapping from tx index => owner => bool
    mapping(uint => mapping(address => bool)) public isConfirmed;

    string public walletName;

    constructor(
        string memory _walletName,
        address[] memory _owners,
        uint256 _approvalsRequired
    ) {
        require(_owners.length > 0, "required owners");
        require(
            _approvalsRequired > 0 && _approvalsRequired <= _owners.length,
            "invalid approvalsVal"
        );
        for (uint256 i; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "invalid owner");
            isOwner[owner] = true;
            walletOwners.push(owner);
        }
        approvalsRequired = _approvalsRequired;
        walletName = _walletName;
    }

    modifier validateOwnerAddress(address _owner) {
        if (_owner == address(0)) revert InvalidOwner(_owner);
        _;
    }

    modifier checkIfOwnerExists(address _owner) {
        if (isOwner[_owner]) revert AlreadyOwner(_owner);
        _;
    }

    modifier onlyOwner() {
        if (!isOwner[msg.sender]) revert NotAnOwner();
        _;
    }

    modifier onlyWallet() {
        if (msg.sender != address(this)) revert NotAllowed();
        _;
    }

    modifier validateApprovals(uint256 _newApprovalValue) {
        if (_newApprovalValue <= 0 && _newApprovalValue > walletOwners.length)
            revert InvalidApprovalsValue(_newApprovalValue);
        _;
    }

    modifier txnExists(uint256 _txnIdx) {
        if (_txnIdx > transactions.length) revert InvalidTxnId(_txnIdx);
        _;
    }

    function _notConfirmed(uint256 _txnIdx) private view{
        if (isConfirmed[_txnIdx][msg.sender])
            revert TxnAlreadyConfirmed(msg.sender, _txnIdx);
    }

    function _notExecuted(uint256 _txnIdx) private view{
        if (transactions[_txnIdx].executed) revert TxnAlreadyExecuted(_txnIdx);
    }

    function _isConfirmedByOwner(uint256 _txnIdx) private view{
        if (!isConfirmed[_txnIdx][msg.sender])
            revert TxnNotConfirmed(msg.sender, _txnIdx);
    }

    function submitProposal(
        string memory _name,
        address _to,
        uint256 _value,
        bytes memory _data
    ) public onlyOwner {
        require(_to != address(0), "invalid to");
        uint256 txnId = walletOwners.length;
        transactions.push(
            TransactionProposals({
                name: _name,
                to: _to,
                value: _value,
                data: _data,
                confirmations: 0,
                executed: false
            })
        );
        emit NewProposal(msg.sender, txnId);
    }

    function approveTransaction(uint256 _txnIdx)
        public
        onlyOwner
        txnExists(_txnIdx)
    {
        _notConfirmed(_txnIdx);
        _notExecuted(_txnIdx);
        TransactionProposals storage transaction = transactions[_txnIdx];
        transaction.confirmations++;
        isConfirmed[_txnIdx][msg.sender] = true;
        emit ApprovedProposal(msg.sender, _txnIdx);
    }

    function revokeApproval(uint _txnIdx)
        public
        onlyOwner
        txnExists(_txnIdx)
    {
        _isConfirmedByOwner(_txnIdx);
        _notExecuted(_txnIdx);
        TransactionProposals storage transaction = transactions[_txnIdx];
        transaction.confirmations--;
        isConfirmed[_txnIdx][msg.sender] = false;
        emit RevokedApproval(msg.sender, _txnIdx);
    }

    function addNewOwnerProposal(address _newOwner)
        public
        validateOwnerAddress(_newOwner)
        checkIfOwnerExists(_newOwner)
        onlyWallet
    {
        isOwner[_newOwner] = true;
        walletOwners.push(_newOwner);
        emit NewOwner(_newOwner);
    }

    function removeOwnerProposal(
        address _ownerToRemove,
        uint256 _newApprovalsRequired
    )
        public
        validateOwnerAddress(_ownerToRemove)
        validateApprovals(_newApprovalsRequired)
        onlyWallet
    {
        if (!isOwner[_ownerToRemove]) revert NotAnOwner();
        for (uint i = 0; i < walletOwners.length; i++) {
            if (walletOwners[i] == _ownerToRemove) {
                _removeOwner(i);
                break;
            }
        }
        approvalsRequired = _newApprovalsRequired;
    }

    function _removeOwner(uint256 _ownerIndex) internal {
        delete walletOwners[_ownerIndex];
        walletOwners[_ownerIndex] = walletOwners[walletOwners.length - 1];
        walletOwners.pop();
    }

    function executeProposal(uint256 _txnIndex)
        public
        onlyOwner
        txnExists(_txnIndex)
    {
        _notExecuted(_txnIndex);
        TransactionProposals storage transaction = transactions[_txnIndex];

        require(
            transaction.confirmations >= approvalsRequired,
            "cannot execute tx"
        );

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(
            transaction.data
        );
        require(success, "tx failed");

        emit ExecutedProposal(msg.sender, _txnIndex);
    }

    function getMultiSigOwners()
        public
        view
        returns (address[] memory allOwners)
    {
        allOwners = walletOwners;
    }

    function getTransactionCount() public view returns (uint) {
        return transactions.length;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }
}
