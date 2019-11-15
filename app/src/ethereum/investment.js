import uPortConnect from './uPortConnect';
import Investment from '../contracts/Investment.json';
import { ethers } from "ethers";
import {getWeb3} from "./web3Provider";

export const createInvestment = async (contractAddress) => {
    const provider = getWeb3();
    const signer = provider.getSigner();
    var investmentInstance = new ethers.Contract(contractAddress, Investment.abi, signer);
    return investmentInstance;
}

export const createUPortInvestment = async (contractAddress) => {
    return uPortConnect.contract(Investment.abi).at(contractAddress);
}