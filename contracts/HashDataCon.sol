pragma solidity >=0.4.22 <0.7.0;


import "./HashBaseCon.sol";

/**
 * This contract will take charge of submitting pure hash data to blockchain
 *
 */
contract DRCHashDataCon is DRCHashBase {
  event LogInsertHash(address indexed _saver, string _hash, bool _bool);
  event LogDeleteHash(address indexed _saver, string _hash, bool _bool);

	/**
	 * @dev Constructor,not used just reserved
	 */
  function DRCHashDataCon() public {
  }
	
	/**
	 * @dev insertHash,insert hash into contract
	 * @param _hash is input value of hash
   * @param _saverName is the name of the guy which submit the hash value
	 * @return bool,true is successful and false is failed
	 */
  function insertHash(string _hash, string _saverName) public returns (bool) {
    bool res = hashInfo.insertHash(_hash, _saverName);
    require(res);
    emit LogInsertHash(msg.sender, _hash, res);
    return res;
  }
    
	/**
	 * @dev selectHash,select hash from contract
	 * @param _hash is input value of hash
	 * @return true/false,saver,save time
	 */
  function selectHash(string _hash) public view returns (bool, address, string, uint256) {
    return (hashInfo.selectHash(_hash));
  } 
    
	/**
	 * @dev deleteHash,delete hash into contract
	 * @param _hash is input value of hash
	 * @return bool,true is successful and false is failed
	 */
  function deleteHash(string _hash) public onlyOwner returns (bool) {
    bool res = hashInfo.deleteHash(_hash);
    require(res);
    emit LogDeleteHash(msg.sender, _hash, res);
    return res;
  } 

}