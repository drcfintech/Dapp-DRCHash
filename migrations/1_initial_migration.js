var Migrations = artifacts.require("./Migrations.sol");

// module.exports = function(deployer) {
//   deployer.deploy(Migrations);
// };

const deployIndex = 0;
const contractConfig = require('../config/compileContract.json');
const defaultGasLimit = 6721975;


// console.log(contractConfig.contracts);
// var contractInstance1 = artifacts.require(contractConfig.contracts[1].name);
// var contractInstance2 = artifacts.require(contractConfig.contracts[2].name);

module.exports = function(deployer) {
  // deployContract(DRCWalletMgrCon, deployer);
  // sleep(300000);
  // deployContract(DRCWalletStorage, deployer);
  // deployer.then(() => {
  // contractConfig.contracts.map((contract, ind) => {
  let contract = contractConfig.contracts[deployIndex];
  // if (ind > 0) {
  console.log(contract.name);
  deployer.deploy(Migrations, {
    gas: contract.requiredGasLimit, //'6700000',
    gasPrice: contractConfig.gasPrice
  });
  // }
  // });
  // });
};