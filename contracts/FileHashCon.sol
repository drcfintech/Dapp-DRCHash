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

  event LogInsertFileHash(
    address indexed _operator, 
    string _hash, string _fileName, 
    string fileUrl, 
    bool _bool
  );
  
  event LogDeleteFileHash(
    address indexed _operator, 
    string _hash, 
    string _fileName, 
    string fileUrl, 
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
    (string memory _saverName, string memory _fileName, string memory _fileUrl, string memory _author) 
      = abi.decode(_uploadedData, (string, string, string, string));
    bool res = hashInfoLib.insertHash(_hash, _saverName);
    require(res);
    fileHashInfo[_hash] = FileInfo(_fileName, _fileUrl, _author); 
    emit LogInsertFileHash(
      msg.sender, 
      _hash, 
      fileHashInfo[_hash].fileName, 
      fileHashInfo[_hash].fileUrl, 
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
      fileHashInfo[_hash].fileName,
      fileHashInfo[_hash].fileUrl,
      fileHashInfo[_hash].author
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
      delete fileHashInfo[_hash];

    emit LogDeleteFileHash(
      msg.sender, 
      _hash, 
      fileHashInfo[_hash].fileName, 
      fileHashInfo[_hash].fileUrl,
      res
    );

    return res;
  }

}