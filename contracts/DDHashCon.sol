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

  event LogInsertDDHash(address indexed _operator, string _hash, string _ddTask, bool _bool);
  event LogDeleteDDHash(address indexed _operator, string _hash, string _ddTask, bool _bool);

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
    (
      string memory _saverName, 
      string memory _ddTaskName,
      uint256 ddersNum,
      string[128] memory dders,
      string[128] memory ddersHash
    ) = abi.decode(_uploadedData, (string, string, uint256, string[128], string[128]));

    bool res = hashInfo.insertHash(_hash, _saverName);
    require(res);
    ddHashInfo[_hash].ddTask = _ddTaskName; 

    for (int i = 0; i < ddersNum; i++) {
      ddHashInfo[_hash].dderNames.push(dders[i]);
      ddHashInfo[_hash].dderNames[dders[i]] = ddersHash[i];
    }

    emit LogInsertDDHash(msg.sender, _hash, ddHashInfo[_hash].ddTask, res);
    return true;
  }

  /**
   * @dev selectHash,select hash from contract
   * @param _hash is input value of hash
   * @return true/false,saver,save time
   */
  function selectHash(string _hash) public view returns (bool, address, bytes, uint256, string) {
    bool selectRes;
    HashOperateLib.ExInfo memory exInfo;

    (selectRes, exInfo.saver, exInfo.saverName, exInfo.saveTime) = hashInfo.selectHash(_hash);
    string memory selectTxHash = getTxIdByHash(_hash);

    uint len = ddHashInfo[_hash].dders.length;
    string[128] memory ddersName;
    string[128] memory ddersHash;

    for (int i = 0; i < len; i++) {
      ddersName[i] = ddHashInfo[_hash].dders[i];
      ddersHash[i] = ddHashInfo[_hash].ddersHashInfo[ddersName[i]];
    }

    bytes memory selectData = abi.encodePacked(
      exInfo.saverName, 
      ddHashInfo[_hash].ddTask, 
      ddHashInfo[_hash].dders.length,
      ddersName,
      ddersHash
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
  function deleteHash(string _hash) public onlyOwner returns (bool) {
    bool res = hashInfo.deleteHash(_hash);
    emit LogDeleteDDHash(msg.sender, _hash, ddHashInfo[_hash], res);

    if (res) 
      delete ddHashInfo[_hash];

    return res;
  }

}