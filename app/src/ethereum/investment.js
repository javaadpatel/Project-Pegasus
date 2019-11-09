import uPortConnect from './uPortConnect';
import getWeb3 from './web3Provider.js';

const Investment = require("../contracts/Investment.json");

export const createInvestment = async (contractAddress) => {
    Investment.setProvider(getWeb3());
    return Investment.at(contractAddress);
}

export const createUPortInvestment = async (contractAddress) => {
    return uPortConnect.contract(Investment.abi).at(contractAddress);
}