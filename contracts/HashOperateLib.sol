pragma solidity >=0.4.22 <0.7.0;


import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../solidity-lib/utils/StringUtils.sol";


/**
 * A library for only submit hash string to blockchain
 *
 */
library HashOperateLib {
  using SafeMath for uint256;
  using StringUtils for string;

  struct ExInfo {
    address saver;
    string saverName;
    uint256 saveTime;
  }

  struct Info {
    mapping(string => ExInfo) hashInfo;
    string[] hashLib;
  }

  /**
   * @dev insertHash,insert method
   * @param  _self is where the data will be saved
   *         _hash is input value of hash
   * @return bool,true is successful and false is failed
   */
  function insertHash(Info storage _self, string _hash, address _saver, string _saverName) 
    internal 
    returns(bool) 
  {
    if (_self.hashInfo[_hash].saveTime > 0) {
      return false;
    } else {
      _self.hashInfo[_hash].saver = _saver; // not msg.sender, we need the origin TX submitter;
      _self.hashInfo[_hash].saveTime = now;
      _self.hashInfo[_hash].saverName = _saverName;
      _self.hashLib.push(_hash);

      return true;
    }
  }

  /**
   * @dev deleteHash,delete method
   * @param  _self is where the data will be saved
   *         _hash is input value of hash
   * @return bool,true is successful and false is failed
   */
  function deleteHash(Info storage _self, string _hash) internal returns(bool) {
    if (_self.hashInfo[_hash].saveTime > 0) {
      delete _self.hashInfo[_hash];
      removeHash(_self, _hash);
      return true;
    } else {
      return false;
    }
  }

  /**
   * @dev selectHash,select method
   * @param  _self is where the data will be saved
   *         _hash is input value of hash
   * @return true/false,saver,save time
   */
  function selectHash(Info storage _self, string _hash) 
    internal 
    view 
    returns(bool, address, string, uint256) 
  {
    if (_self.hashInfo[_hash].saveTime > 0) {
      return (true, 
              _self.hashInfo[_hash].saver,
              _self.hashInfo[_hash].saverName, 
              _self.hashInfo[_hash].saveTime);
    } else {
      return (false, address(0), "", 0);
    }
  }

  /**
   * @dev remove a hash value from hash info storage
   *
   * @param _hashStr the account address in the list
   */
  function removeHash(Info storage _self, string _hashStr) internal returns(bool) {
    uint i = 0;
    for (; i < _self.hashLib.length; i = i.add(1)) {
      if (_self.hashLib[i].equal(_hashStr)) 
        break;
    }

    if (i >= _self.hashLib.length)
      return false;

    uint lastInd = _self.hashLib.length.sub(1);
    while (i < lastInd) {
      _self.hashLib[i] = _self.hashLib[i.add(1)];
      i = i.add(1);
    }

    delete _self.hashLib[lastInd];
    _self.hashLib.length = lastInd;

    return true;
  }

}