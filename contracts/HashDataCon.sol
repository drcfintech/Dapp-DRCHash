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
  function insertHash(string _hash, bytes _uploadedData) public onlyOwner returns (bool) {
    string memory _saverName = abi.decode(_uploadedData, (string));
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
  function selectHash(string _hash) public view returns (bool, address, bytes, uint256, string) {
    (
      bool res, 
      address saver, 
      string memory saverName, 
      uint256 saveTime, 
      string memory txHash
    ) = hashInfo.selectHash(_hash);
    return (res, saver, abi.encode(saverName), saveTime, txHash);
  } 
    
	/**
	 * @dev deleteHash,delete hash into contract
	 * @param _hash is input value of hash
	 * @return bool,true is successful and false is failed
	 */
  function deleteHash(string _hash) public onlyOwner returns (bool) {
    bool res = hashInfo.deleteHash(_hash);
    emit LogDeleteHash(msg.sender, _hash, res);

    return res;
  } 

}