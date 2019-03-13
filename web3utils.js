const Web3 = require("web3");
// 生成钱包
//const HDWalletProvider = require("truffle-hdwallet-provider");
const walletConfig = require("./config/walletConfig.json");
const keystore = require(walletConfig.keystore);
//console.log('keystore  ', keystore);

const infura_url = {
    mainnet: "https://mainnet.infura.io/v3/",
    ropsten: "https://ropsten.infura.io/v3/",
    rinkeby: "https://rinkeby.infura.io/v3/"
};

// 调用合约的账号
let account;
let web3;

// 新建initWeb3Provider连接
let initWeb3Provider = () => {
    if (typeof web3 !== "undefined") {
        web3 = new Web3(web3.currentProvider);
    } else {
        web3 = new Web3(
            new Web3.providers.HttpProvider(
                infura_url.rinkeby + walletConfig.infuraAPIkey
            )
        );
    }

    // 解决Error：TypeError: Cannot read property 'kdf' of undefined
    account = web3.eth.accounts.decrypt(
        JSON.parse(JSON.stringify(keystore).toLowerCase()),
        walletConfig.password
    );
    web3.eth.defaultAccount = account.address;
    console.log("web3.eth.defaultAccount : ", web3.eth.defaultAccount);

    if (typeof web3.eth.getAccountsPromise === "undefined") {
        //console.log('解决 Error: Web3ProviderEngine does not support synchronous requests.');
        Promise.promisifyAll(web3.eth, {
            suffix: "Promise"
        });
    }
};

let currentProvider = () => {
    return web3.currentProvider;
};

let realValue = (value) => {
    var temp = value.toFixed(7);
    // web3.utils.toBN(requestObject.value).mul(wb3.utils.toBN(decimals.default));
    return web3.utils
        .toBN(Number.parseInt(temp * decimals.fixedWidth))
        .mul(web3.utils.toBN(decimals.leftWidth))
        .toString();
};

module.exports = {
    initWeb3Provider: initWeb3Provider,
    currentProvider: currentProvider,
    realValue: realValue
};