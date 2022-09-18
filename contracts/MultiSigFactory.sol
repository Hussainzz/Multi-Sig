// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./MultiSig.sol";

contract MultiSigFactory{

  event NewWalletCreated(
    uint indexed contractId,
    address indexed contractAddress,
    address creator,
    address[] owners,
    uint signaturesRequired
  );

  event Owners(
    address indexed contractAddress,
    address[] owners,
    uint256 indexed signaturesRequired
  );

  MultiSig[] public multiSigs;

  constructor() {}

  function createNewMultiSigWallet(string memory _walletName, address[] memory _owners, uint256 _totalApprovals) public {
      uint id = numberOfMultiSigs();
      MultiSig newWallet = new MultiSig(_walletName, _owners, _totalApprovals);
      multiSigs.push(newWallet);
      emit NewWalletCreated(id, address(newWallet), msg.sender, _owners, _totalApprovals);
  }

  function numberOfMultiSigs() public view returns(uint) {
    return multiSigs.length;
  }

  function getMultiSigInfo(uint256 _index)
    public
    view
    returns (
      string memory walletName,
      address multiSigAddress,
      uint signaturesRequired,
      uint balance
    ) {
      return (multiSigs[_index].walletName(), address(multiSigs[_index]), multiSigs[_index].approvalsRequired(), address(multiSigs[_index]).balance);
    }
}