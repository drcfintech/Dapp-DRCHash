pragma solidity >=0.4.22 <0.7.0;


import "./HashBaseCon.sol";
import "../solidity-lib/utils/StringUtils.sol";
import "../solidity-stringutils/src/strings.sol";


/**
 * This contract will take charge of submitting DD result hash to blockchain
 *
 */
contract DRCDDHashCon is DRCHashBase {
  using StringUtils for string;
  using strings for *;

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

  // function splitStrs(string memory _orig, string memory _spliter, string[] storage outStrs) internal returns (bool) {
  //   strings.slice memory origSlices = _orig.toSlice();
  //   strings.slice memory delim = _spliter.toSlice();
    
  //   for(uint i = 0; i < outStrs.length; i = i.add(1)) {
  //     outStrs[i] = origSlices.split(delim).toString();
  //   }

  //   return true;
  // }

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
    (
      string memory _saverName, 
      string memory _ddTaskName,
      uint256 ddersNum,
      string memory dders,
      string memory ddersHashStrs
    ) = abi.decode(_uploadedData, (string, string, uint256, string, string));

    bool res = hashInfoLib.insertHash(_hash, _saverName);
    require(res);
    ddHashInfo[_hash].ddTask = _ddTaskName; 

    strings.slice memory ddersSlice = dders.toSlice();
    strings.slice memory ddersHashSlice = ddersHashStrs.toSlice();
    strings.slice memory delim = ",".toSlice();

    for (uint i = 0; i < ddersNum; i = i.add(1)) {
      string memory tmpDDer = ddersSlice.split(delim).toString();
      ddHashInfo[_hash].dderNames.push(tmpDDer);
      ddHashInfo[_hash].ddersHashInfo[tmpDDer] = ddersHashSlice.split(delim).toString();
    }

    emit LogInsertDDHash(msg.sender, _hash, ddHashInfo[_hash].ddTask, res);
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

    DDInfo storage _ddInfo = ddHashInfo[_hash];
    (selectRes, exInfo.saver, exInfo.saverName, exInfo.saveTime) = hashInfoLib.selectHash(_hash);
    string memory selectTxHash = getTxIdByHash(_hash);

    uint len = _ddInfo.dderNames.length;
    bytes memory selectData;
    if (len > 0) {
      strings.slice[] memory ddersNameList = new strings.slice[](len);
      strings.slice[] memory ddersHashList = new strings.slice[](len);

      string memory tempDDerName;
      for (uint i = 0; i < len; i = i.add(1)) {
        tempDDerName = _ddInfo.dderNames[i];
        ddersNameList[i] = tempDDerName.toSlice();
        ddersHashList[i] = _ddInfo.ddersHashInfo[tempDDerName].toSlice();
      }
      // string memory ddersNameStr = ",".toSlice().join(ddersNameList);
      // string memory ddersHashStr = ",".toSlice().join(ddersHashList);

      selectData = abi.encodePacked(
        exInfo.saverName,
        _ddInfo.ddTask,
        len,
        ",".toSlice().join(ddersNameList),
        ",".toSlice().join(ddersHashList)
      );
    } else {
      selectData = abi.encodePacked(
        exInfo.saverName,
        _ddInfo.ddTask,
        len,
        "",
        ""
      );
    }

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
      delete ddHashInfo[_hash];
      
    emit LogDeleteDDHash(msg.sender, _hash, ddHashInfo[_hash].ddTask, res);

    return res;
  }

}