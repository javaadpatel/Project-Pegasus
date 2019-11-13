import Web3 from "web3";
import {ropstenProviderUrl} from '../configuration/index.js';
import { ethers } from "ethers";


export const getWeb3 = () => {
    if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
        window.ethereum.enable();
        return new ethers.providers.Web3Provider(window.web3.currentProvider);
    }
    //running on server *OR* user is not running metamask
    else {
        const provider = new Web3.providers.HttpProvider(
            ropstenProviderUrl
        );
        return new ethers.providers.Web3Provider(provider);
    } 
}
