//import InvestmentFactory from '../contracts/InvestmentFactory.json';
import uPortConnect from './uPortConnect';
import {investmentFactoryContractAddress} from '../configuration';
import InvestmentFactory from '../contracts/InvestmentFactory.json';
import { ethers } from "ethers";
import {getWeb3} from './web3Provider';

export const createInvestmentFactory = async () => {
    let provider =  getWeb3();
    var investmentFactoryInstance = new ethers.Contract(investmentFactoryContractAddress, InvestmentFactory.abi, provider);
    return investmentFactoryInstance;
}

export const createUPortInvestmentFactory = async () => {
    const uPortContractInstance =  uPortConnect.contract(InvestmentFactory.abi).at(investmentFactoryContractAddress);
    console.log(uPortContractInstance);
    return uPortContractInstance;
}