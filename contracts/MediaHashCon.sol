pragma solidity >=0.4.22 <0.7.0;


import "./HashBaseCon.sol";


/**
 * This contract will take charge of submitting file hash to blockchain
 *
 */
contract DRCMediaHashCon is DRCHashBase {
  enum MediaType { 
    ARTICLE, 
    AUDIO, 
    VIDEO 
  }

  struct MediaInfo {
    string mediaName; // must have a value
    string mediaUrl; // must have
    string author; // must have
    MediaType t; // must have    
  }

  mapping(string => MediaInfo) private mediaHashInfo;

  event LogInsertMediaHash(
    address indexed _operator, 
    string _hash, 
    string _mediaName, 
    string _mediaUrl, 
    string _mediaType,
    bool _bool
  );

  event LogDeleteMediaHash(
    address indexed _operator, 
    string _hash, 
    string _mediaName, 
    string _mediaUrl,
    string _mediaType, 
    bool _bool
  );

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
  function insertHash(string memory _hash, bytes memory _uploadedData) 
    public 
    onlyOwner 
    returns (bool) 
  {
    require(!_hash.equal(""));

    (string memory _saverName, string memory _mediaName, string memory _mediaUrl, string memory _author, uint256 _mediaType) 
      = abi.decode(_uploadedData, (string, string, string, string, uint256));

    bool res = hashInfoLib.insertHash(_hash, _saverName);
    require(res);
    mediaHashInfo[_hash] = MediaInfo(_mediaName, _mediaUrl, _author, MediaType(_mediaType)); 
    emit LogInsertMediaHash(
      msg.sender, 
      _hash, 
      mediaHashInfo[_hash].mediaName,
      mediaHashInfo[_hash].mediaUrl, 
      getMediaTypeStr(mediaHashInfo[_hash].t),
      res
    );

    return true;
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
    bool selectRes;
    HashOperateLib.ExInfo memory exInfo;

    (selectRes, exInfo.saver, exInfo.saverName, exInfo.saveTime) = hashInfoLib.selectHash(_hash);
    string memory selectTxHash = getTxIdByHash(_hash);
    bytes memory selectData = abi.encodePacked(
      exInfo.saverName, 
      mediaHashInfo[_hash].mediaName,
      mediaHashInfo[_hash].mediaUrl,
      mediaHashInfo[_hash].author,
      uint256(mediaHashInfo[_hash].t)
    );

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
  function deleteHash(string memory _hash) public onlyOwner returns (bool) {
    bool res = hashInfoLib.deleteHash(_hash);
    if (res) 
      delete mediaHashInfo[_hash];

    emit LogDeleteMediaHash(
      msg.sender, 
      _hash, 
      mediaHashInfo[_hash].mediaName,
      mediaHashInfo[_hash].mediaUrl, 
      getMediaTypeStr(mediaHashInfo[_hash].t),
      res
    );

    return res;
  }

  function getMediaTypeStr(MediaType t) private pure returns (string memory) {
    if (t == MediaType.ARTICLE) {
      return "Article";
    } else if (t == MediaType.AUDIO) {
      return "Audio";
    } else if (t == MediaType.VIDEO) {
      return "Video";
    } else {
      return "";
    }
  }

}