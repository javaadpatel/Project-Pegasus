const InvestmentFactory = artifacts.require("InvestmentFactory");
const InvestmentRanking = artifacts.require("InvestmentRanking");

module.exports = function(deployer) {
  deployer.deploy(InvestmentRanking).then(function(){
    return deployer.deploy(InvestmentFactory, InvestmentRanking.address)
  });
};
