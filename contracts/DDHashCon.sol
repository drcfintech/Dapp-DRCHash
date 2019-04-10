pragma solidity >=0.4.22 <0.7.0;


import "./HashBaseCon.sol";
import "../solidity-lib/utils/StringUtils.sol";


/**
 * This contract will take charge of submitting DD result hash to blockchain
 *
 */
contract DRCDDHashCon is DRCHashBase {
  using StringUtils for string;

  struct DDInfo {
    string ddTask;
    mapping(string => string) ddersHashInfo; // could be empty
    string[] dderNames; // could be empty
  }

  mapping(string => DDInfo) private ddHashInfo;

  event LogInsertDDHash(address indexed _operator, string _hash, DDInfo _ddInfo, bool _bool);
  event LogDeleteDDHash(address indexed _operator, string _hash, DDInfo _ddInfo, bool _bool);

  /**
   * @dev Constructor,not used just reserved
   */
  constructor() public {
  }

  function insertDDers(string _dders, string _ddersHashStrs) internal returns (bool) {
    require(_dders.length == _ddersHashStrs.length);

    if (_dders.length == 0 || _ddersHashStrs.length == 0) {
      return false; // no dders or data errors
    }

    string memory seperators = ",";
    int ind = _dders.indexOf(seperators);
    while (ind != -1) {

    }

  }

  /**
   * @dev insertHash,insert hash into contract
   * @param _hash is input value of hash
   * @return bool,true is successful and false is failed
   */
  function insertHash(
    string _hash,  
    string _saverName, 
    string _ddTaskName,
    bytes _dders, 
    bytes _ddersHashStrs
  ) 
  public 
  onlyOwner 
  returns (bool) {
    bool res = hashInfo.insertHash(_hash, _saverName);
    require(res);
    ddHashInfo[_hash].ddTask = _ddTaskName; 
    ddHashInfo[_hash].dderNames = abi.decode(_dders, (string[128]));
    emit LogInsertDDHash(msg.sender, _hash, ddHashInfo[_hash], res);

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
  returns (bool, address, string, uint256, string, string, string) {
    bool selectRes;
    HashOperateLib.ExInfo memory exInfo;
    FileInfo memory fileInfo;

    (selectRes, exInfo.saver, exInfo.saverName, exInfo.saveTime) = hashInfo.selectHash(_hash);
    fileInfo = ddHashInfo[_hash];

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
  function deleteHash(string _hash, address _deleter) public onlyOwner returns (bool) {
    require(_deleter != address(0));

    bool selectRes;
    address origSaver;
    string memory origSaverName;
    uint256 timeStamp;

    (selectRes, origSaver, origSaverName, timeStamp) = hashInfo.selectHash(_hash);
    require(selectRes);

    bool res = hashInfo.deleteHash(_hash);
    require(res);    
    delete ddHashInfo[_hash];
    emit LogDeleteDDHash(_deleter, _hash, ddHashInfo[_hash], res);

    return true;
  }

}