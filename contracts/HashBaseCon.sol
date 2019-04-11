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

  /**
   * @dev insertHash,insert hash into contract with bytes data
	 * @param _hash is input value of hash
   * @param _uploadedData is the data being uploaded with hash value
	 * @return bool,true is successful and false is failed
   */
  function insertHash(string _hash, bytes _uploadedData) public returns(bool);

  /**
	 * @dev selectHash,select hash from contract
	 * @param _hash is input value of hash
	 * @return true/false,saver,uploadedData,save time
	 */
  function selectHash(string _hash) public view returns (bool, address, bytes, uint256, string);
    
	/**
	 * @dev deleteHash,delete hash into contract
	 * @param _hash is input value of hash
	 * @return bool,true is successful and false is failed
	 */
  function deleteHash(string _hash) public returns (bool);

}