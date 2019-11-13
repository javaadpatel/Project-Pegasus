// import InvestmentRanking from '../contracts/InvestmentRanking.json';
import uportConnect from './uPortConnect.js';
import {investmentRankingContractAddress} from '../configuration';
import InvestmentRanking from '../contracts/InvestmentRanking.json';
import { ethers } from "ethers";
import {getWeb3} from './web3Provider';

export const createInvestmentRanking = async () => {
    let provider = getWeb3();
    var investmentRankingInstance = new ethers.Contract(investmentRankingContractAddress, InvestmentRanking.abi, provider);
    return investmentRankingInstance;
}

export const createUPortInvestmentRanking = async () => {
    return uportConnect.contract(InvestmentRanking.abi).at(investmentRankingContractAddress)
}

export default createInvestmentRanking;