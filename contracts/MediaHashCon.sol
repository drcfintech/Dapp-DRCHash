pragma solidity >=0.4.22 <0.7.0;


import "./HashBaseCon.sol";


/**
 * This contract will take charge of submitting file hash to blockchain
 *
 */
contract DRCMediaHashCon is DRCHashBase {
  struct MediaInfo {
    string mediaName; // must have a value
    string mediaUrl; // must have
    string author; // must have    
  }

  mapping(string => MediaInfo) private mediaHashInfo;

  event LogInsertFileHash(address indexed _operator, string _hash, MediaInfo _mediaInfo, bool _bool);
  event LogDeleteFileHash(address indexed _operator, string _hash, MediaInfo _mediaInfo, bool _bool);

  /**
   * @dev Constructor,not used just reserved
   */
  constructor() public {
  }

  /**
   * @dev insertHash,insert hash into contract
   * @param _hash is input value of hash
   * @param _uploadedData is the additional data being uploaded to the contract
   * @return bool,true is successful and false is failed
   */
  function insertHash(string _hash, bytes _uploadedData) public onlyOwner returns (bool) {
    require(!_hash.equal(""));
    (string memory _saverName, MediaInfo memory _mediaInfo) = abi.decode(_uploadedData, (string, MediaInfo));
    bool res = hashInfo.insertHash(_hash, _saverName);
    require(res);
    mediaHashInfo[_hash] = _mediaInfo; 
    emit LogInsertFileHash(msg.sender, _hash, mediaHashInfo[_hash], res);

    return true;
  }

  /**
   * @dev selectHash,select hash from contract
   * @param _hash is input value of hash
   * @return true/false,saver,save time
   */
  function selectHash(string _hash) public view returns(bool, address, bytes, uint256, string) {
    bool selectRes;
    HashOperateLib.ExInfo memory exInfo;

    (selectRes, exInfo.saver, exInfo.saverName, exInfo.saveTime) = hashInfo.selectHash(_hash);
    string memory selectTxHash = getTxIdByHash(_hash);
    bytes memory selectData = abi.encodePacked(exInfo.saverName, mediaHashInfo[_hash]);

    return (
      selectRes, 
      exInfo.saver, 
      selectData,
      exInfo.saveTime,
      selectTxHash
    );
  }

  /**
   * @dev deleteHash,delete hash into contract
   * @param _hash is input value of hash
   * @return bool,true is successful and false is failed
   */
  function deleteHash(string _hash) public onlyOwner returns(bool) {
    bool res = hashInfo.deleteHash(_hash);
    emit LogDeleteFileHash(msg.sender, _hash, mediaHashInfo[_hash], res);
    if (res) 
      delete mediaHashInfo[_hash];

    return res;
  }

}