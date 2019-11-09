import Web3 from "web3";
import { ethers } from "ethers";
import {ropstenProviderUrl} from '../configuration';

const getWeb3 = () => 
    new Promise ((resolve, reject) =>{
        //Wait for loading completion to avoid race conditions with web3 injection timing
        window.addEventListener("load", async() => {
            //Modern dapp browsers...
            if(window.ethereum){
                const web3 = new ethers.providers.Web3Provider(window.ethereum);
                try{
                    //request account access
                    await window.ethereum.enable();
                    //accounts now exposed
                    resolve(web3);
                }catch(error){
                    reject(error);
                }
            }
            //Legacy dapp browsers
            else if(typeof window !== 'undefined' && window.web3 != 'undefined'){
                //Use mist/metamask provider
                const web3 = new ethers.providers.Web3Provider(window.web3.currentProvider);
                console.log("Injected web3 detected");
                resolve(web3);
            }
            //Fallback to localhost
            else{
                const provider = new Web3.providers.HttpProvider(
                    ropstenProviderUrl
                );
                const web3 = new ethers.providers.Web3Provider(provider);
                console.log("No web3 instance injected, using local web3.")
                resolve(web3);
            }
        });
    });

export default getWeb3;