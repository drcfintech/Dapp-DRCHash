require('babel-register');
const HDWalletProvider = require("truffle-hdwallet-provider");
const Web3 = require('web3');
const walletConfig = require('./config/walletConfig.json');

const infura_url = {
  mainnet: "https://mainnet.infura.io/v3/",
  ropsten: "https://ropsten.infura.io/v3/",
  rinkeby: "https://rinkeby.infura.io/v3/"
};

const infura_apikey = "0eeaa2ca76384986ae1cae796c895de8";
// var infura_apikey = "9rWQxDtU4uAbAWdFFSAR";

module.exports = {
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    },
    version: "0.5.7"
  },
  networks: {
    development: {
      host: '127.0.0.1',
      port: 7545,
      network_id: '*' // Match any network id
    },
    ropsten: {
      provider: () => {
        return new HDWalletProvider(walletConfig.mnemonic,
          infura_url.ropsten + infura_apikey);
      },
      network_id: 3
    },
    rinkeby: {
      provider: () => {
        return new HDWalletProvider(walletConfig.mnemonic,
          infura_url.rinkeby + infura_apikey);
      },
      network_id: 4
    },
    mainnet: {
      provider: () => {
        return new HDWalletProvider(walletConfig.mnemonic,
          infura_url.mainnet + infura_apikey);
      },
      network_id: 1
    }
  }
}