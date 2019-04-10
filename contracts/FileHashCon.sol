pragma solidity >=0.4.22 <0.7.0;


import "./HashBaseCon.sol";


/**
 * This contract will take charge of submitting file hash to blockchain
 *
 */
contract DRCFileHashCon is DRCHashBase {
  struct FileInfo {
    string fileName; // must have a value
    string fileUrl; // could be empty
    string author; // could be empty    
  }

  mapping(string => FileInfo) private fileHashInfo;

  event LogInsertFileHash(address indexed _operator, string _hash, FileInfo _fileInfo, bool _bool);
  event LogDeleteFileHash(address indexed _operator, string _hash, FileInfo _fileInfo, bool _bool);

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
    (string memory _saverName, FileInfo memory _fileInfo) = abi.decode(_uploadedData, (string, FileInfo));
    bool res = hashInfo.insertHash(_hash, _saverName);
    require(res);
    fileHashInfo[_hash] = _fileInfo; 
    emit LogInsertFileHash(msg.sender, _hash, fileHashInfo[_hash], res);

    return true;
  }

  /**
   * @dev selectHash,select hash from contract
   * @param _hash is input value of hash
   * @return true/false,saver,save time
   */
  function selectHash(string _hash) 
  public 
  view 
  returns(bool, address, string, uint256, string, string, string) {
    bool selectRes;
    HashOperateLib.ExInfo memory exInfo;
    FileInfo memory fileInfo;

    (selectRes, exInfo.saver, exInfo.saverName, exInfo.saveTime) = hashInfo.selectHash(_hash);
    fileInfo = fileHashInfo[_hash];

    return (
      selectRes, 
      exInfo.saver, 
      exInfo.saverName, 
      exInfo.saveTime, 
      fileInfo.fileName,
      fileInfo.fileUrl,
      fileInfo.author
    );
  }

  /**
   * @dev deleteHash,delete hash into contract
   * @param _hash is input value of hash
   * @return bool,true is successful and false is failed
   */
  function deleteHash(string _hash, address _deleter) public onlyOwner returns(bool) {
    require(_deleter != address(0));

    bool selectRes;
    address origSaver;
    string memory origSaverName;
    uint256 timeStamp;

    (selectRes, origSaver, origSaverName, timeStamp) = hashInfo.selectHash(_hash);
    require(selectRes);

    bool res = hashInfo.deleteHash(_hash);
    require(res);    
    delete fileHashInfo[_hash];
    emit LogDeleteFileHash(_deleter, _hash, fileHashInfo[_hash], res);

    return true;
  }

}