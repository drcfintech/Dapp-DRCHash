pragma solidity >=0.4.22 <0.7.0;


import "./HashOperateLib.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


/**
 * This contract will take charge of submitting base hash value to blockchain
 * it will be inherited by other hash operating contracts
 */
contract DRCHashBase is Ownable {
  //import the HashOperateLib for contract
  using HashOperateLib for HashOperateLib.Info;
  HashOperateLib.Info internal hashInfo;
  string public memo;

  constructor() internal {
  }

  /**
   * @dev set the memo to describe the objective of the contract
   */
  function setMemo(string _memoStr) public onlyOwner returns(bool) {
    memo = _memoStr;
    return true;
  }

}