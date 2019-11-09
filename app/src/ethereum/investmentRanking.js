// import InvestmentRanking from '../contracts/InvestmentRanking.json';
import uportConnect from './uPortConnect.js';
import {investmentRankingContractAddress} from '../configuration';
import getWeb3 from './web3Provider.js';

const InvestmentRanking = require("../contracts/InvestmentRanking.json");

export const createInvestmentRanking = async () => {
    InvestmentRanking.setProvider(getWeb3());
    return InvestmentRanking.at(investmentRankingContractAddress);
}

export const createUPortInvestmentRanking = async () => {
    return uportConnect.contract(InvestmentRanking.abi).at(investmentRankingContractAddress)
}

export default createInvestmentRanking;