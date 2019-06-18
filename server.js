const validation = require("./validation.js");
const log = require("./log/log.js");
const timer = require("./timer.js");
const responceData = require("./responceData.js");
// log.saveLog();
const app = require("express")();
const serverConfig = require("./config/serverConfig.json");

// 模块：对http请求所带的数据进行解析  https://www.cnblogs.com/whiteMu/p/5986297.html
const querystring = require("querystring");
const contract = require("truffle-contract");
// 解决Error：Web3ProviderEngine does not support synchronous requests
const Promise = require("bluebird");
// 签名之前构造rawTransaction用
let Tx = require("ethereumjs-tx");
// independent module to deal with web3 stuffs
const web3Utils = require("./web3utils.js");
let web3;
let account;
// console.log(web3);
// console.log(web3.eth);

// 用户操作
const operation = ["insertHash", "selectHash"];

const abiPath = "./contractsAbi/";
const abiPath_external = "./external/";
// 智能合约
const HashData_artifacts = require(abiPath + "DRCHashDataCon.json");
// 合约发布地址
const HashData_contractAT = HashData_artifacts.networks["4"].address;

// 合约abi
const HashData_contractABI = HashData_artifacts.abi;
// 初始化合约实例
let HashDataContract;
// 智能合约
const FileHash_artifacts = require(abiPath + "DRCFileHashCon.json");
// 合约发布地址
const FileHash_contractAT = FileHash_artifacts.networks["4"].address;

// 合约abi
const FileHash_contractABI = FileHash_artifacts.abi;
// 初始化合约实例
let FileHashContract;
// 智能合约
const MediaHash_artifacts = require(abiPath + "DRCMediaHashCon.json");
// 合约发布地址
const MediaHash_contractAT = MediaHash_artifacts.networks["4"].address;

// 合约abi
const MediaHash_contractABI = MediaHash_artifacts.abi;
// 初始化合约实例
let MediaHashContract;
// 智能合约
const DDHash_artifacts = require(abiPath + "DRCDDHashCon.json");
// 合约发布地址
const DDHash_contractAT = DDHash_artifacts.networks["4"].address;

// 合约abi
const DDHash_contractABI = DDHash_artifacts.abi;
// 初始化合约实例
let DDHashContract;

const GAS_LIMIT = 6721975; // default gas limit
const SAFE_GAS_PRICE = 41; // default gas price (unit is gwei)
const ADDR_ZERO = "0x0000000000000000000000000000000000000000";
const gasPricePromote = {
  GT_30: 1.25,
  GT_20: 1.2,
  GT_10: 1.15,
  GT_3: 1.12,
  DEFAULT: 1.1
};
const transactionType = {
  INSERTHASH: "insertHash",
  DELETEHASH: "deleteHash",
  NORMAL: "normal"
};
const intervals = {
  retryTx: 300000,
  retryGasPrice: 910000,
  retryTxTimes: 3,
  retryTimes: 10
};
const decimals = {
  default: 1e18,
  fixedWidth: 1e7,
  leftWidth: 1e11
};
const constants = {
  hashLen: 64
};

// Add headers
app.use((req, res, next) => {
  req.setEncoding("utf8");
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Request methods you wish to allow
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", false);

  // Pass to next layer of middleware
  next();
});

// let gasPrice;
let currentNonce = -1;

// 获取账户余额  警告 要大于 0.001Eth
const getBalance = (callback, dataObject = {}) => {
  web3.eth.getBalance(web3.eth.defaultAccount, (error, balance) => {
    if (error) {
      if (dataObject != {}) {
        dataObject.res.end(JSON.stringify(responceData.evmError));
      }
      // 保存log
      // log.saveLog(operation[1], new Date().toLocaleString(), qs.hash, 0, 0, responceData.evmError);
      return;
    }
    console.log("balance =>", balance);
    if (balance && web3.utils.fromWei(balance, "ether") < 0.001) {
      // 返回failed 附带message
      if (dataObject.res) {
        dataObject.res.end(JSON.stringify(responceData.lowBalance));
      }
      // 保存log
      // log.saveLog(operation[1], new Date().toLocaleString(), qs.hash, 0, 0, responceData.lowBalance);
      return;
    }
    callback(dataObject);
  });
};

// 获取data部分的nonce
const getNonce = () => {
  return new Promise((resolve, reject) => {
    const handle = setInterval(() => {
      web3.eth.getTransactionCount(web3.eth.defaultAccount, (error, result) => {
        if (error) {
          clearInterval(handle);
          reject(error);
        }
        if (result) {
          clearInterval(handle);
          console.log("current nonce is: ", currentNonce);
          console.log("current transaction count is: ", result);
          if (currentNonce < result) currentNonce = result;
          else currentNonce += 1;
          resolve(web3.utils.toHex(currentNonce)); // make sure the nonce is different
        }
      });
    }, 5000);
  }).catch(err => {
    console.log("catch error when getNonce");
    return new Promise.reject(err);
  });
};

// 获取data部分的gasPrice
const getGasPrice = () => {
  return new Promise((resolve, reject) => {
    const handle = setInterval(() => {
      web3.eth.getGasPrice((error, result) => {
        if (error) {
          clearInterval(handle);
          reject(error);
        }
        //resolve(web3.utils.toHex(result));
        if (result) {
          clearInterval(handle);

          let gasPrice = web3.utils.fromWei(result, "gwei");
          console.log("gasPrice  ", gasPrice + "gwei");
          if (gasPrice >= 30) gasPrice *= gasPricePromote.GT_30;
          else if (gasPrice >= 20) gasPrice *= gasPricePromote.GT_20;
          else if (gasPrice >= 10) gasPrice *= gasPricePromote.GT_10;
          else if (gasPrice >= 3) gasPrice *= gasPricePromote.GT_3;
          else gasPrice *= gasPricePromote.DEFAULT;

          // resolve(web3.utils.toHex(Math.round(result)));
          resolve(gasPrice.toFixed(2));
        }
      });
    }, 5000);
  }).catch(err => {
    console.log("catch error when getGasPrice");
    return new Promise.reject(err);
  });
};

// 获取estimated gasLimit
const getGasLimit = callObject => {
  return new Promise((resolve, reject) => {
    const handle = setInterval(() => {
      web3.eth.estimateGas(callObject, (error, result) => {
        if (error) {
          clearInterval(handle);
          reject(error);
        }
        //resolve(web3.utils.toHex(result));
        if (result) {
          clearInterval(handle);
          console.log("estimated gasLimit  ", result);
          resolve(Math.round(result * 1.1));
        }
      });
    }, 5000);
  }).catch(err => {
    console.log("catch error when getGasLimit");
    return new Promise.reject(err);
  });
};

const txReplaceRecs = new Map();

let retrySendTransaction = (rawTx, origTxHash) => {
  let newRawTx = rawTx;
  let currTxHash = origTxHash;
  let prevTxHash = origTxHash;

  let iCount = 0;
  let finished = false;
  const handle = setInterval(() => {
    if (finished) {
      clearInterval(handle);
      console.log("retry TX succeed: ", currTxHash);
    }

    iCount++;
    if (iCount > intervals.retryTimes) {
      clearInterval(handle);
      console.log("has retry 10 times of retrying transactions...");
      return new Promise.reject(
        Error("Failed to retry transactions for too many times!")
      );
    }

    Promise.all([getGasPrice()]).then(values => {
      /**
       * internal retry will only take 3 times, if Tx cannot succeed, then
       * the base gasPrice is not correct, so retry another base gasPrice.
       */
      let iCountInternal = 0;
      const handleInternal = setInterval(() => {
        iCountInternal++;
        if (iCountInternal > intervals.retryTxTimes) {
          clearInterval(handleInternal);
          console.log(
            "the base gasPrice is not appropriate, need to change..."
          );
        } else {
          console.log("current retry gasPrice: ", values[0]);
          newRawTx.gasPrice = web3.utils.toHex(
            web3.utils.toWei(values[0].toString(), "gwei")
          );
          let tx = new Tx(newRawTx);

          // 解决 RangeError: private key length is invalid
          tx.sign(new Buffer(account.privateKey.slice(2), "hex"));
          let serializedTx = tx.serialize();

          web3.eth
            .sendSignedTransaction("0x" + serializedTx.toString("hex"))
            .on("transactionHash", hash => {
              console.log("current TX hash: ", currTxHash);
              console.log("retry TX hash: ", hash);
              txReplaceRecs.set(currTxHash, hash); // save this replaced Tx hash
              prevTxHash = currTxHash;
              currTxHash = hash;
            })
            .on("receipt", receipt => {
              console.log(
                "retry transaction succeed at ",
                receipt.transactionHash
              );
              txReplaceRecs.set(prevTxHash, receipt.transactionHash); // save this replaced Tx hash
              console.log(
                "get receipt after retry sending transaction: ",
                receipt
              );
              clearInterval(handle);
              finished = true;
            })
            .on("error", (err, receipt) => {
              console.error(
                "catch an error after retry sendTransaction... ",
                err
              );
              if (err) {
                if (receipt && receipt.status) {
                  console.log(
                    "the retry tx has already got the receipt: ",
                    receipt
                  );
                  txReplaceRecs.set(prevTxHash, receipt.transactionHash); // save this replaced Tx hash
                  clearInterval(handle);
                }
                if (err.message.includes("not mined within")) {
                  console.log(
                    "retry tx met error of not mined within 50 blocks or 750 seconds..."
                  );
                } else {
                  if (err.message.includes("out of gas")) {
                    console.error(
                      "account doesn't have enough gas or TX has been reverted in retry..."
                    );
                  } else {
                    console.error("retry tx met other exceptions...");
                  }
                  clearInterval(handle); // this exception will cause not retrying the Tx submission
                  return new Promise.reject(err);
                }
              }
            });

          values[0] *= gasPricePromote.GT_10; // add 15% gasPrice
        }
      }, intervals.retryTx);
    });
  }, intervals.retryGasPrice);
};

// 给tx签名，并且发送上链
const sendTransaction = (rawTx, txType) => {
  return new Promise((resolve, reject) => {
    let tx = new Tx(rawTx);

    // 解决 RangeError: private key length is invalid
    tx.sign(new Buffer(account.privateKey.slice(2), "hex"));
    let serializedTx = tx.serialize();

    // a simple function to add the real gas Price to the receipt data
    let finalReceipt = receipt => {
      let res = receipt;
      res.gasPrice = rawTx.gasPrice;
      return res;
    };

    // 签好的tx发送到链上
    let txHash;
    web3.eth
      .sendSignedTransaction("0x" + serializedTx.toString("hex"))
      .on("transactionHash", hash => {
        if (hash) {
          console.log(txType + " TX hash: ", hash);
          txHash = hash;
          if (txType != transactionType.NORMAL) {
            return resolve(txHash); // maybe there are other type of transaction not need this
          }
        }
      })
      .on("receipt", receipt => {
        console.log(txType + " get receipt after send transaction: ", receipt);
        if (txType == transactionType.NORMAL)
          return resolve(finalReceipt(receipt));
      })
      .on("confirmation", (confirmationNumber, receipt) => {
        console.log(txType + " confirmation number: ", confirmationNumber);
        if (confirmationNumber == 24 && receipt) {
          console.log(txType + "confirmation receipt", receipt);
          return resolve(finalReceipt(receipt));
        }
      })
      .on("error", (err, receipt) => {
        console.error(
          txType + " catch an error after sendTransaction... ",
          err
        );
        if (!txHash) {
          console.log("TX has not been created and error occurred...");
          currentNonce -= 1; // next Tx will take this currentNonce value;
        }
        if (err) {
          if (receipt && receipt.status) {
            console.log("the real tx has already got the receipt: ", receipt);
            if (txType == transactionType.NORMAL)
              return resolve(finalReceipt(receipt));
          }
          // if (err.message.includes('not mined within 50 blocks')
          //     || err.message.includes('not mined within750 seconds')) {
          if (txHash && err.message.includes("not mined within")) {
            console.log(
              "met error of not mined within 50 blocks or 750 seconds..."
            );

            // keep trying to get TX receipt
            let iCount = 0;
            const handle = setInterval(() => {
              iCount += 1;
              web3.eth
                .getTransactionReceipt(txHash)
                .then(resp => {
                  if (resp != null && resp.blockNumber > 0) {
                    console.log("get Tx receipt from error handling: ", resp);
                    clearInterval(handle);
                    if (txType == transactionType.NORMAL)
                      return resolve(finalReceipt(resp));
                  }
                  if (iCount >= 60) {
                    console.log(
                      "has checked if TX had been mined for 5 minutes..."
                    );
                    clearInterval(handle); // not check any more after 300 minutes
                    // throw('Tx had not been mined for more than 5 minutes...');
                    console.log("retrying tx: ", txHash);
                    retrySendTransaction(rawTx, txHash);
                  }
                })
                .catch(err => {
                  console.log(
                    "met error when getting TX receipt from error handling"
                  );
                  clearInterval(handle);
                  reject(err);
                });
            }, 5000);

            // const TIME_OUT = 1800000; // 30 minutes timeout
            // setTimeout(() => {
            //   clearTimeout(handle);
            // }, TIME_OUT);
          } else if (err.message.includes("out of gas")) {
            console.error(
              "account doesn't have enough gas or TX has been reverted..."
            );
            // console.log('TX receipt, ', receipt);
          } else {
            console.log("met other exceptions when send transaction...");
            // retrySendTransaction(rawTx, txHash);
          }

          reject(err);
        }
      });
  }).catch(e => {
    console.error(txType + " catch error when sendTransaction: ", e);
    return new Promise.reject(e);
  });
};

let TxExecution = function(
  contractAT,
  encodeData,
  resultCallback,
  dataObject = {},
  txType = "normal"
) {
  // 上链结果响应到请求方
  // const returnResult = (result) => {
  //   resultCallback(result);
  // }

  let callback = dataObject => {
    let returnObject = {};
    let callObject = {
      to: contractAT,
      data: encodeData
    };
    let txSubmited = false;

    Promise.all([getNonce(), getGasPrice(), getGasLimit(callObject)])
      .then(values => {
        // gasPrice = web3.utils.fromWei(values[1], "gwei");
        console.log("current gasPrice: ", values[1] + "gwei");
        console.log("current gasLimit: ", values[2]);

        // if current gas price is too high, then cancel the transaction
        if (values[1] > SAFE_GAS_PRICE) {
          if (dataObject != {}) {
            dataObject.res.end(JSON.stringify(responceData.gasPriceTooHigh));
          }
          // 重置
          returnObject = {};
          // 保存log
          // log.saveLog(operation[1], new Date().toLocaleString(), qs.hash, gasPrice, 0, responceData.evmError);
          return;
        }

        let rawTx = {
          nonce: values[0],
          to: contractAT,
          gasPrice: web3.utils.toHex(
            web3.utils.toWei(values[1].toString(), "gwei")
          ), // values[1],
          gasLimit: web3.utils.toHex(values[2]), //web3.utils.toHex(GAS_LIMIT),
          data: encodeData
        };

        return rawTx;
      })
      .then(rawTx => {
        let res = sendTransaction(rawTx, txType);
        txSubmited = true;
        return res;
      })
      .then(result => {
        // console.log("data object is ", dataObject);

        if (dataObject.res) {
          resultCallback(result, returnObject, dataObject);
        } else {
          resultCallback(result, returnObject);
        }
      })
      .catch(e => {
        if (e) {
          console.error("evm error", e);
          if (!txSubmited) {
            currentNonce -= 1; // tx hadn't succeed submitting, so nonce should not increase
          }
          if (dataObject != {}) {
            dataObject.res.end(JSON.stringify(responceData.transactionError));
          }
          // 重置
          returnObject = {};
          // 保存log
          // log.saveLog(operation[1], new Date().toLocaleString(), qs.hash, gasPrice, 0, responceData.evmError);
          return;
        }
      });
  };

  getBalance(callback, dataObject);
};

let hashContract = contractType => {
  console.log("get hash contract instance...\n");
  switch (contractType) {
    case 1:
    case 2:
      return {
        contract: FileHashContract,
        contractAT: FileHash_contractAT
      };
    case 3:
    case 4:
      return {
        contract: DDHashContract,
        contractAT: DDHash_contractAT
      };
    case 5:
    case 6:
    case 7:
      return {
        contract: MediaHashContract,
        contractAT: MediaHash_contractAT
      };
    default:
      return {
        contract: HashDataContract,
        contractAT: HashData_contractAT
      };
  }
};

let getMediaType = dataType => {
  console.log("get media type...");
  let mediaType;
  switch (dataType) {
    case 5:
      mediaType = 0;
      break;
    case 6:
      mediaType = 2;
      break;
    case 7:
      mediaType = 1;
      break;
    default:
      mediaType = 3;
      throw "Wrong media type!";
  }
  return mediaType;
};

let safeStr = str => {
  return str && str !== "" ? str : "";
};

let getUploadData = data => {
  let mediaType;
  console.log("-- -- -- -- -- - upload raw data-- -- -- -- -- -");
  switch (data.type) {
    case 1:
    case 2:
      console.log("operator: ", data.operator);
      console.log("fileName: ", data.filename);
      console.log("fileUrl: ", data.URL);
      console.log("author: ", data.author);
      return web3.eth.abi.encodeParameters(
        ["string", "string", "string", "string"],
        [
          safeStr(data.operator),
          safeStr(data.filename),
          safeStr(data.URL),
          safeStr(data.author)
        ]
      );
    case 3:
    case 4:
      console.log("operator: ", data.operator);
      console.log("taskName: ", data.ddname);
      console.log("dders: ", data.dders);
      console.log("subhash: ", data.subhash);
      let ddersNum = (() => {
        if (data.dders && data.subhash) {
          return data.dders.length < data.subhash.length
            ? data.dders.length
            : data.subhash.length;
        } else {
          return 0;
        }
      })();

      let dders = data.dders && ddersNum > 0 ? data.dders.join(",") : "";
      let ddersHash =
        data.subhash && ddersNum > 0 ? data.subhash.join(",") : "";
      return web3.eth.abi.encodeParameters(
        ["string", "string", "string", "string", "uint256"],
        [
          safeStr(data.operator),
          safeStr(data.ddname),
          safeStr(ddersNum),
          safeStr(dders),
          safeStr(ddersHash)
        ]
      );
    case 5:
    case 6:
    case 7:
      console.log("operator: ", data.operator);
      console.log("fileName: ", data.mname);
      console.log("fileUrl: ", data.URL);
      console.log("author: ", data.author);
      console.log("mediaType: ", data.type);
      return web3.eth.abi.encodeParameters(
        ["string", "string", "string", "string", "uint256"],
        [
          safeStr(data.operator),
          safeStr(data.mname),
          safeStr(data.URL),
          safeStr(data.author),
          getMediaType(data.type)
        ]
      );
    default:
      return web3.eth.abi.encodeParameter("string", data.operator);
  }
};

var Actions = {
  // 初始化：拿到web3提供的地址， 利用json文件生成合约··
  start: function() {
    HashDataContract = new web3.eth.Contract(
      HashData_contractABI,
      HashData_contractAT,
      {}
    );
    FileHashContract = new web3.eth.Contract(
      FileHash_contractABI,
      FileHash_contractAT,
      {}
    );
    MediaHashContract = new web3.eth.Contract(
      MediaHash_contractABI,
      MediaHash_contractAT,
      {}
    );
    DDHashContract = new web3.eth.Contract(
      DDHash_contractABI,
      DDHash_contractAT,
      {}
    );
    HashDataContract.setProvider(web3Utils.currentProvider());
    FileHashContract.setProvider(web3Utils.currentProvider());
    MediaHashContract.setProvider(web3Utils.currentProvider());
    DDHashContract.setProvider(web3Utils.currentProvider());
    // console.log(MediaHash_contractABI);
    // console.log(MediaHashContract);
  },

  // 去链上查询结果
  getEthStatus: function(data) {
    let dataObject = data;
    console.log("data in getEthStatus is: ", dataObject.data);

    if (
      typeof dataObject.data != "string" ||
      dataObject.data != "getEthStatus"
    ) {
      // 返回failed 附带message
      dataObject.res.end(JSON.stringify(responceData.dataError));
      // 保存log
      // log.saveLog(operation[0], new Date().toLocaleString(), qs.hash, 0, 0, responceData.addressError);
      return;
    }

    Promise.all([getGasPrice()])
      .then(values => {
        console.log("current gasPrice: ", values[0] + "gwei");
        // let gasPrice = web3.utils.toWei(values[0].toString(), "gwei");

        // if current gas price is too high, then cancel the transaction
        if (values[0] > SAFE_GAS_PRICE) {
          dataObject.res.end(JSON.stringify(responceData.gasPriceTooHigh));
          // 重置
          // returnObject = {};
          // 保存log
          // log.saveLog(operation[1], new Date().toLocaleString(), qs.hash, gasPrice, 0, responceData.evmError);
        } else {
          console.log("EVM status is fine...");
          dataObject.res.end(JSON.stringify(responceData.ethStatusSuccess));
        }

        return;
      })
      .catch(err => {
        console.log("met error get ethereum status: ", err);
        // 返回failed 附带message
        dataObject.res.end(JSON.stringify(responceData.evmError));
        // 保存log
        // log.saveLog(operation[1], new Date().toLocaleString(), qs.hash, responceData.selectHashFailed);
        return;
      });
  },

  // 往链上存数据
  insertHash: function(data) {
    let dataObject = data;
    let requestObject = dataObject.data;

    console.log(requestObject);

    // first check hash value is valid
    if (
      !web3.utils.isHex(requestObject.roothash) &&
      requestObject.roothash.length != constants.hashLen
    ) {
      // 返回failed 附带message
      dataObject.res.end(JSON.stringify(responceData.addressError));
      // 保存log
      log.saveLog(
        operation[0],
        new Date().toLocaleString(),
        requestObject,
        0,
        0,
        responceData.dataError
      );
      return;
    }

    console.log("the root hash is ", requestObject.roothash);
    let insertHashCon = hashContract(requestObject.type).contract;
    // console.log(insertHashCon);

    // 上链步骤：查询没有结果之后再上链
    insertHashCon.methods
      .selectHash(requestObject.roothash)
      .call((error, result) => {
        if (error) {
          // 以太坊虚拟机的异常
          dataObject.res.end(JSON.stringify(responceData.evmError));
          // 保存log
          log.saveLog(
            operation[0],
            new Date().toLocaleString(),
            requestObject,
            0,
            0,
            responceData.evmError
          );
          return;
        }

        console.log(" 数据上链前的查询结果   \n", result);
        console.log(" 成功与否：\n", result["0"]);
        // 返回值显示已经有该hash的记录
        if (result && result["0"] == true) {
          dataObject.res.end(JSON.stringify(responceData.hashAlreadyInserted));
          // 保存log
          log.saveLog(
            operation[0],
            new Date().toLocaleString(),
            requestObject,
            0,
            0,
            responceData.hashAlreadyInserted
          );

          return;
        }

        if (result && !result["0"]) {
          // 拿到rawTx里面的data部分
          console.log(requestObject);
          console.log("upload hash is ", requestObject.roothash);
          let toUpload = getUploadData(requestObject);
          console.log("to be uploaded: \n", toUpload);
          let encodeData_params = web3.eth.abi.encodeParameters(
            ["string", "bytes"],
            [requestObject.roothash, toUpload]
          );
          console.log(encodeData_params);
          let encodeData_function = web3.eth.abi.encodeFunctionSignature(
            "insertHash(string,bytes)"
          );
          console.log(encodeData_function);
          let encodeData = encodeData_function + encodeData_params.slice(2);
          console.log(encodeData);

          // 上链结果响应到请求方
          let processResult = (result, returnObject, dataObject) => {
            // status = web3.utils.hexToNumber(web3.utils.toHex(result.status));
            console.log("insertHash tx: ", result);
            if (!result) {
              // console.log(dataObject);
              dataObject.res.end(JSON.stringify(responceData.insertHashFailed));
              // log.saveLog(operation[2], new Date().toLocaleString(), qs.withdrawAddress, gasPrice, result.gasUsed, responceData.withdrawFailed);

              return;
            }

            returnObject = responceData.insertHashSuccess;
            if (!result.transactionHash) {
              returnObject.txHash = result;
            } else {
              returnObject.txHash = result.transactionHash;
              returnObject.gasUsed = result.gasUsed;
              returnObject.gasPrice = result.gasPrice;

              let logObject = result.logs[0];
              console.log(logObject);
            }

            console.log("insertHash return object is: ", returnObject);

            // 返回success 附带message
            // console.log(dataObject);
            dataObject.res.end(JSON.stringify(returnObject));
            // 重置
            returnObject = {};
            // 保存log
            // log.saveLog(operation[2], new Date().toLocaleString(), qs.withdrawAddress, gasPrice, result.gasUsed, responceData.createDepositAddrSuccess);
          };

          // console.log("data Object outside is ", dataObject);

          TxExecution(
            hashContract(requestObject.type).contractAT,
            encodeData,
            processResult,
            dataObject,
            transactionType.INSERTHASH
          );
        }
      })
      .catch(e => {
        if (e) {
          console.log("program error", e);
          dataObject.res.end(JSON.stringify(responceData.programError));
          // 重置
          returnObject = {};
          // 保存log
          // log.saveLog(operation[1], new Date().toLocaleString(), qs.hash, 0, 0, responceData.evmError);
          return;
        }
      });

    return;
  },

  // 去链上查询结果
  selectHash: function(data) {
    let dataObject = data;

    HashDataConContract.methods
      .selectHash(dataObject.data)
      .call((err, result) => {
        if (err || !result["0"]) {
          // 返回failed 附带message
          dataObject.res.end(JSON.stringify(responceData.selectHashFailed));
          // 保存log
          // log.saveLog(operation[1], new Date().toLocaleString(), qs.hash, responceData.selectHashFailed);
          return;
        }
        let returnObject = responceData.selectHashSuccess;
        returnObject.data = result;
        // 返回success 附带message
        dataObject.res.end(JSON.stringify(returnObject));
        // 重置
        returnObject = {};
        // 保存log
        // log.saveLog(operation[1], new Date().toLocaleString(), qs.hash, responceData.selectHashSuccess);
      });
  },

  getTxsBlocks: function(data) {
    let dataObject = data;

    try {
      // let queryData = dataObject.data.split(",");
      let queryData = JSON.parse(dataObject.data);
      console.log(queryData);
      console.log(queryData.length);
      console.log(queryData[0]);
      if (queryData.length == 0) {
        // 返回failed 附带message
        dataObject.res.end(JSON.stringify(responceData.dataError));
        // 保存log
        // log.saveLog(operation[0], new Date().toLocaleString(), qs.hash, 0, 0, responceData.dataError);
        return;
      }

      let returnObject = responceData.getTxsBlocksSuccess;
      returnObject.records = new Array(queryData.length);

      for (var i = 0; i < queryData.length; i++) {
        returnObject.records[i] = {
          txHash: queryData[i].txHash
        };
      }
      console.log("get Tx blocks return object currently is: ", returnObject);

      const getBlockNum = txHash => {
        return new Promise((resolve, reject) => {
          let iCount = 0;
          const handle = setInterval(() => {
            iCount += 1;
            web3.eth.getTransaction(txHash, (error, result) => {
              console.log("get block tx hash is: ", txHash);
              if (error) {
                clearInterval(handle);
                reject(error);
              }

              if (result) {
                clearInterval(handle);
                console.log("block number: ", result.blockNumber);
                return resolve(result.blockNumber);
              }

              if (iCount > 2) {
                clearInterval(handle);
                console.log("cannot get block number this time...");
                return resolve(null);
              }
            });
          }, 5000);
        }).catch(err => {
          console.log("catch error when getBlockNum: ", err);
          return "error"; // set the block number as 'error'
        });
      };

      const getTxsBlockNumbers = async (returnOneObject, queryObj) => {
        returnOneObject.blockNumber = await getBlockNum(queryObj.txHash);
        let replHash = txReplaceRecs.get(queryObj.txHash);
        if (replHash) {
          returnOneObject.replacedTxHash = replHash;
        } else {
          returnOneObject.replacedTxHash = null;
        }
        console.log("get block nubmer is: ", returnOneObject.blockNumber);
        console.log("replaced Tx hash is: ", returnOneObject.replacedTxHash);
      };

      var promises = returnObject.records.map((record, ind) => {
        return getTxsBlockNumbers(record, queryData[ind]);
      });

      Promise.all(promises)
        .then(values => {
          // 返回success 附带message
          console.log("get Tx blocks return Object finally is: ", returnObject);
          dataObject.res.end(JSON.stringify(returnObject));
          // 重置
          returnObject = {};
          // 保存log
          // log.saveLog(operation[1], new Date().toLocaleString(), qs.hash, responceData.selectHashSuccess);
        })
        .catch(e => {
          if (e) {
            console.log("evm error", e);
            dataObject.res.end(JSON.stringify(responceData.evmError));
            // 重置
            returnObject = {};
            // 保存log
            // log.saveLog(operation[1], new Date().toLocaleString(), qs.hash, 0, 0, responceData.evmError);
            return;
          }
        });
    } catch (e) {
      if (e) {
        console.log("program error", e);
        dataObject.res.end(JSON.stringify(responceData.programError));
        // 重置
        // returnObject = {};
        // 保存log
        // log.saveLog(operation[1], new Date().toLocaleString(), qs.hash, 0, 0, responceData.evmError);
        return;
      }
    }

    return;
  },

  getTxsDetail: function(data) {
    let dataObject = data;

    let queryData;
    try {
      // let queryData = dataObject.data.split(",");
      queryData = JSON.parse(dataObject.data);
      console.log(queryData);
      console.log(queryData.length);
      console.log(queryData[0]);
      if (queryData.length == 0) {
        // 返回failed 附带message
        dataObject.res.end(JSON.stringify(responceData.dataError));
        // 保存log
        // log.saveLog(operation[0], new Date().toLocaleString(), qs.hash, 0, 0, responceData.dataError);
        return;
      }
    } catch (e) {
      if (e) {
        console.log("program error", e);
        dataObject.res.end(JSON.stringify(responceData.programError));
        // 重置
        // returnObject = {};
        // 保存log
        // log.saveLog(operation[1], new Date().toLocaleString(), qs.hash, 0, 0, responceData.evmError);
        return;
      }
    }

    const totalConfirmNumber = 24;
    web3.eth
      .getBlockNumber()
      .then(result => {
        let currentBlock = result;
        console.log(currentBlock);
        return currentBlock;
      })
      .then(currentBlock => {
        let blockHigh = currentBlock;
        let returnObject = responceData.getTxsDetailSuccess;
        returnObject.records = new Array(queryData.length);

        for (var i = 0; i < queryData.length; i++) {
          returnObject.records[i] = {
            txHash: queryData[i].txHash
          };
          returnObject.records[i].blockNumber = queryData[i].blockNumber;
          console.log(totalConfirmNumber);
          console.log(blockHigh);
          console.log(queryData[i].blockNubmber);
          console.log(returnObject.records[i].blockNumber);
          if (returnObject.records[i].blockNumber != null) {
            console.log(blockHigh - queryData[i].blockNubmber);
            console.log(
              totalConfirmNumber -
                (blockHigh - returnObject.records[i].blockNumber)
            );
            if (
              blockHigh - returnObject.records[i].blockNumber >
              totalConfirmNumber
            ) {
              returnObject.records[i].blockConfirmNum = totalConfirmNumber;
            } else {
              returnObject.records[i].blockConfirmNum =
                blockHigh - returnObject.records[i].blockNumber;
            }
          } else {
            returnObject.records[i].blockConfirmNum = 0;
            console.log(returnObject.records[i].blockConfirmNum);
          }
        }
        console.log(
          "get Tx details return object currently is: ",
          returnObject
        );

        const getGasPrice = txHash => {
          return new Promise((resolve, reject) => {
            const handle = setInterval(() => {
              web3.eth.getTransaction(txHash, (error, result) => {
                if (error) {
                  clearInterval(handle);
                  reject(error);
                }

                if (result) {
                  clearInterval(handle);
                  console.log("gasPrice  ", result.gasPrice);
                  return resolve(result.gasPrice);
                }
              });
            }, 5000);
          }).catch(err => {
            console.log("catch error when getGasPrice");
            return new Promise.reject(err);
          });
        };

        const getGasUsed = txHash => {
          return new Promise((resolve, reject) => {
            const handle = setInterval(() => {
              web3.eth.getTransactionReceipt(txHash, (error, result) => {
                if (error) {
                  clearInterval(handle);
                  reject(error);
                }

                // returnOneObject.gasUsed = result.gasUsed;
                if (result) {
                  clearInterval(handle);
                  console.log("tx status: ", result.status);
                  console.log("gasUsed  ", result.gasUsed);
                  if (result.status) {
                    return resolve(["success", result.gasUsed]);
                  } else {
                    return resolve(["failed", result.gasUsed]);
                  }
                }
              });
            }, 5000);
          }).catch(err => {
            console.log("catch error when getGasUsed");
            return new Promise.reject(err);
          });
        };

        const getTxTimestamp = block => {
          return new Promise((resolve, reject) => {
            const handle = setInterval(() => {
              web3.eth.getBlock(block, (err, res) => {
                if (err) {
                  clearInterval(handle);
                  reject(err);
                }

                if (res) {
                  clearInterval(handle);
                  console.log("timestamp  ", res.timestamp);
                  return resolve(res.timestamp);
                }
              });
            }, 5000);
          }).catch(err => {
            console.log("catch error when getTxTimestamp");
            return new Promise.reject(err);
          });
        };

        const getGasPriceUsed = async (returnOneObject, queryObj) => {
          returnOneObject.gasPrice = await getGasPrice(queryObj.txHash);
          [
            returnOneObject.txstatus,
            returnOneObject.gasUsed
          ] = await getGasUsed(queryObj.txHash);
          returnOneObject.timestamp = await getTxTimestamp(
            queryObj.blockNumber
          );
          console.log(returnOneObject.gasPrice);
          console.log(returnOneObject.txstatus);
          console.log(returnOneObject.gasUsed);
          console.log(returnOneObject.timestamp);
        };

        var promises = returnObject.records.map((record, ind) => {
          return getGasPriceUsed(record, queryData[ind]);
        });

        Promise.all(promises)
          .then(values => {
            // 返回success 附带message
            console.log(
              "get Tx details return Object finally is: ",
              returnObject
            );
            dataObject.res.end(JSON.stringify(returnObject));
            // 重置
            returnObject = {};
            // 保存log
            // log.saveLog(operation[1], new Date().toLocaleString(), qs.hash, responceData.selectHashSuccess);
          })
          .catch(e => {
            if (e) {
              console.log("evm error", e);
              dataObject.res.end(JSON.stringify(responceData.evmError));
              // 重置
              returnObject = {};
              // 保存log
              // log.saveLog(operation[1], new Date().toLocaleString(), qs.hash, 0, 0, responceData.evmError);
              return;
            }
          });
      })
      .catch(e => {
        if (e) {
          console.log("program error", e);
          dataObject.res.end(JSON.stringify(responceData.programError));
          // 重置
          // returnObject = {};
          // 保存log
          // log.saveLog(operation[1], new Date().toLocaleString(), qs.hash, 0, 0, responceData.evmError);
          return;
        }
      });

    return;
  }
};

// post数据处理模块
let qs;
app.use((req, res, next) => {
  // 初始化socket连接
  web3Utils.initWeb3Provider();
  req.on("data", function(chunk) {
    try {
      // 将前台传来的值，转回对象类型
      qs = querystring.parse(chunk);
      console.log("data from client side: ", qs);
      // 处理java post过来的数据
      if (qs.data) {
        qs = JSON.parse(qs.data);
        console.log(qs);
      }
      next();
    } catch (e) {
      if (e) {
        console.error("program error", e);
        res.end(JSON.stringify(responceData.programError));
        // 保存log
        // log.saveLog(operation[1], new Date().toLocaleString(), qs.hash, 0, 0, responceData.evmError);
        return;
      }
    }
  });
});

// 验签模块
app.use((req, res, next) => {
  if (typeof qs.hash != "string") {
    qs.hash = JSON.stringify(qs.hash);
  }
  if (validation.validate(qs.hash, qs.sign)) {
    next();
  } else {
    // 验签不通过，返回错误信息
    res.end(JSON.stringify(responceData.validationFailed));
  }
});

/**********************************************/
/**************SERVER
/**********************************************/
// app.post("/insertHash", function (req, res) {
//   console.log('/insertHash', qs.hash);
//   // 上链方法
//   Actions.insertHash({
//     data: qs.hash.slice(0, 64),
//     res: res
//   });
// });

app.post("/getEthStatus", function(req, res) {
  console.log("/getEthStatus: ", qs.hash);
  // 查询方法
  result = Actions.getEthStatus({
    data: qs.hash,
    res: res
  });
});

app.post("/getTxsBlocks", function(req, res) {
  console.log("/getTxsBlocks: ", qs.hash);
  // 查询方法
  result = Actions.getTxsBlocks({
    data: qs.hash,
    res: res
  });
});

app.post("/getTxsDetail", function(req, res) {
  console.log("/getTxsDetail: ", qs.hash);
  // 查询方法
  result = Actions.getTxsDetail({
    data: qs.hash,
    res: res
  });
});

let lastDid;
app.post("/insertHash", function(req, res) {
  if (qs.hash) {
    console.log("/Hash insert info: ", qs.hash);
    qs = JSON.parse(qs.hash);
  }
  console.log("/upload id: ", qs.did);
  console.log("/roothash ", qs.roothash);
  console.log("/type ", qs.type);
  console.log("/timestamp ", qs.timestamp);
  console.log("/operator ", qs.operator);
  console.log("/filename ", qs.filename);
  console.log("/mname ", qs.mname);
  console.log("/URL ", qs.URL);
  console.log("/author ", qs.author);
  console.log("/subhash ", qs.subhash);
  console.log("/dders ", qs.dders);

  if (lastDid && qs.did === lastDid) return;
  lastDid = qs.did;
  console.log("last did now is: ", lastDid);

  // 查询方法
  result = Actions.insertHash({
    data: qs,
    res: res
  });
});

app.post("/selectHash", function(req, res) {
  console.log("/selectHash", qs.hash);
  // 查询方法
  result = Actions.selectHash({
    data: qs.hash.slice(0, 64),
    res: res
  });
});

app.listen(
  {
    // host: serverConfig.serverHost,
    port: serverConfig.serverPort
  },
  function() {
    // 初始化web3连接
    web3Utils.initWeb3Provider();
    web3 = web3Utils.getWeb3();
    account = web3Utils.getAccount();
    // 初始化
    Actions.start();
    // 定时发邮件
    timer.TimerSendMail();
    console.log(
      "server is listening on ",
      serverConfig.serverHost + ":" + serverConfig.serverPort + "\n"
    );
  }
);

// 取消下面两行注释，即可调用merkleTreeDemo的例子
// const merkleTreeDemo = require("./merkleTreeDemo.js");
// merkleTreeDemo();
