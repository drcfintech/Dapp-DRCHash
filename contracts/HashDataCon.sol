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
  constructor() public {
  }
	
	/**
	 * @dev insertHash,insert hash into contract
	 * @param _hash is input value of hash
   * @param _uploadedData is the uploaded value on to the blockchain
	 * @return bool,true is successful and false is failed
	 */
  function insertHash(string memory _hash, bytes memory _uploadedData) 
    public 
    onlyOwner 
    returns (bool) 
  {
    require(!_hash.equal(""));
    string memory _saverName = abi.decode(_uploadedData, (string));
    bool res = hashInfoLib.insertHash(_hash, _saverName);
    require(res);
    emit LogInsertHash(msg.sender, _hash, res);
    return res;
  }
    
	/**
	 * @dev selectHash,select hash from contract
	 * @param _hash is input value of hash
	 * @return true/false,saver,save time
	 */
  function selectHash(string memory _hash) 
    public 
    view 
    returns (bool, address, bytes memory, uint256, string memory) 
  {
    (
      bool res, 
      address saver, 
      string memory saverName, 
      uint256 saveTime
    ) = hashInfoLib.selectHash(_hash);
    
    string memory txHash = getTxIdByHash(_hash);
    return (res, saver, abi.encode(saverName), saveTime, txHash);
  } 
    
	/**
	 * @dev deleteHash,delete hash into contract
	 * @param _hash is input value of hash
	 * @return bool,true is successful and false is failed
	 */
  function deleteHash(string memory _hash) public onlyOwner returns (bool) {
    bool res = hashInfoLib.deleteHash(_hash);
    emit LogDeleteHash(msg.sender, _hash, res);

    return res;
  } 

}