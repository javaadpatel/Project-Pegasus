require('dotenv').config();
const path = require("path");
var roptenPrivateKey = process.env["REACT_APP_ROPSTEN_PRIVATE_KEY"];
var infuraKey = process.env["REACT_APP_INFURA_API_KEY"];
const PrivateKeyProvider = require('truffle-privatekey-provider');
console.log(roptenPrivateKey);

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "app/src/contracts"),
  solc:{
    optimizer:{
      enabled: true,
      runs: 2000
    }
  },
  networks: {
    develop: {
      port: 8545,
      defaultEtherBalance: 1000
    },
    ropsten: {
      //wrap provider in function to avoid crashing
      provider: function() {
        return new PrivateKeyProvider(roptenPrivateKey, "https://ropsten.infura.io/v3/" + infuraKey);
      },
      network_id: 3, //ropsten test network
      gas:  4000000, // Gas limit used for deploys
      gasPrice : 1000000000
    }
  }
};
