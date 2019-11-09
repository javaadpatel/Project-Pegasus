//import InvestmentFactory from '../contracts/InvestmentFactory.json';
import uPortConnect from './uPortConnect';
import {investmentFactoryContractAddress} from '../configuration';
import getWeb3 from './web3Provider.js';

const InvestmentFactory = require("../contracts/InvestmentFactory.json");

export const createInvestmentFactory = async () => {
    const web3 = getWeb3();
    InvestmentFactory.setProvider(web3);
    return InvestmentFactory.at(investmentFactoryContractAddress);
    // return await etherlime
    //     .ContractAt(InvestmentFactory, investmentFactoryContractAddress, signer, ethersProvider);
}

export const createUPortInvestmentFactory = async () => {
    return uPortConnect.contract(InvestmentFactory.abi).at(investmentFactoryContractAddress);
}