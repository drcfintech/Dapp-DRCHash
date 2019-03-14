pragma solidity >=0.4.22 <0.6.0;


library HashOperateLib {
    
    struct ExInfo {
        address saver;
        string name;
        uint256 saveTime;
    }
    
    struct Info {
        mapping(string=>ExInfo) hashInfo;
        string hashStr;
    }

    //struct 
	
	/**
	 * @dev insertHash,insert method
	 * @param  _self is where the data will be saved
	 *         _hash is input value of hash
	 * @return bool,true is successful and false is failed
	 */
    function insertHash(Info storage _self, string _hash) internal returns (bool) {
        
        if (_self.hashInfo[_hash].saveTime > 0) {
            return false;
        } else {
            _self.hashInfo[_hash].saver = msg.sender;
            _self.hashInfo[_hash].saveTime = now;
            return true;
        }
    }
    
	/**
	 * @dev deleteHash,delete method
	 * @param  _self is where the data will be saved
	 *         _hash is input value of hash
	 * @return bool,true is successful and false is failed
	 */
    function deleteHash(Info storage _self, string _hash) internal returns (bool) {
        
        if (_self.hashInfo[_hash].saveTime > 0) {
            delete _self.hashInfo[_hash];
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
    function selectHash(Info storage _self, string _hash) internal view returns (bool,address,uint256) {
        if (_self.hashInfo[_hash].saveTime > 0) {

            return (true,_self.hashInfo[_hash].saver,_self.hashInfo[_hash].saveTime);
        } else {
            return (false,address(0),0);
        }  
    }
}