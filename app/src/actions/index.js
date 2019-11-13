import {
    SIGN_IN,
    SIGN_OUT,
    CREATE_INVESTMENT,
    FETCH_INVESTMENTS,
    FETCH_INVESTMENT,
    INVEST,
    WITHDRAW_INVESTMENT,
    FETCH_INVESTMENTCONTRIBUTIONSUMMARY,
    MAKE_PAYMENT,
    FETCH_ALLPAYMENTS,
    WITHDRAW_PAYMENTS,
    FETCH_INVESTMENTMANAGER,
    UPGRADE_INVESTMENTMANAGER_RANKING,
    FETCH_ETH_PROVIDER_ERROR,
    FETCH_ETH_PROVIDER_SUCCESS
} from './types';
import {
    createInvestmentFromContract,
    fetchInvestmentsFromContract,
    fetchInvestmentFromContract,
    investToContract,
    withdrawInvestmentFromContract,
    fetchInvestmentContributionSummaryFromContract,
    makePaymentToContract,
    getPaymentsFromContract,
    withdrawPaymentsFromContract,
    extractInvestmentsFromContract_uPort
} from '../ethereum/investmentContract/investmentContract';
import {
    fetchInvestmentManagerFromContract,
    upgradeRankFromContract
} from '../ethereum/investmentContract/investmentRankingContract';
import history from '../history';
import uPortConnect from '../ethereum/uPortConnect';
import {etherScanApiKey} from '../configuration';

const performAction = async (actionType, actionFunc, dispatch) => {
    try{
        console.log("sending request")
        dispatch({
            type: `${actionType}_REQUEST`
        });

        await actionFunc();
    
        dispatch({
            type: `${actionType}_SUCCESS`
        });
    }catch(err){
        dispatch({
            type: `${actionType}_FAILURE`,
            payload: {message: err.message}
        })
    }
}

export const etherScanStatusChecker = (txnHash, funcToDispatch, parameterForDispatch) => async (dispatch) => {
    var timesCalledApi = 0;
    var maxCallsAllowed = 30; //corresponds to 10 minutes
    var etherScanStatusInterval = setInterval(async function (){
        timesCalledApi++;
        console.log(timesCalledApi);
        //call etherscan api
        var transactionStatus = await callEtherScanApi(txnHash);
        /*If the transaction is completed it will have a status of 1*/
        if (transactionStatus === 1 || transactionStatus === "1" || transactionStatus === "error" || timesCalledApi >= maxCallsAllowed){
            clearInterval(etherScanStatusInterval);
            //dispatch some event
            if(funcToDispatch)
            {
                if (parameterForDispatch){
                    dispatch(funcToDispatch(parameterForDispatch));
                }else{
                    dispatch(funcToDispatch());
                }
            }
        }
    }, 20000);
}

const callEtherScanApi = async (txnHash) => {
    try {
        const res = await fetch(`https://api-ropsten.etherscan.io/api?module=transaction&action=gettxreceiptstatus&txhash=${txnHash}&apikey=${etherScanApiKey}`);
        const blocks = await res.json();
        const transactionStatus = blocks.result.status;
        return transactionStatus;
   } catch (e) {
       return "error";
   }
 }


export const signIn = (userId) => {

    var user =  {
        did: userId,
        uPortAddress: userId.split(':')[2]
    };
    return {
        type: SIGN_IN,
        payload: user
    }
};

export const signOut = () => {
    return {
        type: SIGN_OUT
    }
}

export const registerOnEthProviderUpdate = () => dispatch => {
    if(window.web3) {
      const publicConfigStore = window.web3.currentProvider.publicConfigStore;
          console.log({publicConfigStore});
      dispatch({
        type: FETCH_ETH_PROVIDER_SUCCESS,
        payload: {
          selectedAddress: publicConfigStore._state.selectedAddress,
          networkVersion: publicConfigStore._state.networkVersion
        }
      });
  
      window.web3.currentProvider.publicConfigStore.on('update', (config) => {
          console.log(config);
        dispatch({
          type: FETCH_ETH_PROVIDER_SUCCESS,
          payload: {
            selectedAddress: config.selectedAddress,
            networkVersion: config.networkVersion
          }
        });
      });
    } else {
      dispatch({
        type: FETCH_ETH_PROVIDER_ERROR,
        payload: { error: true }
      });
    }
  }

export const createInvestment = (managerAddress, formValues) => async (dispatch, getState) => {
    await createInvestmentFromContract(managerAddress, formValues);

    uPortConnect.onResponse('createInvestmentReq').then(async payload => {
        const txnHash = payload.payload;
        dispatch(etherScanStatusChecker(txnHash, fetchInvestments));
    })

    // dispatch({
    //     type: CREATE_INVESTMENT,
    //     payload: investment
    // });

    //programatic navigation
    history.push('/');
};

export const fetchInvestments = () => async dispatch => {
    var investments = await fetchInvestmentsFromContract();
    dispatch({
        type: FETCH_INVESTMENTS,
        payload: investments
    })
}

export const fetchInvestment = (address) => async dispatch => {
    var investment = await fetchInvestmentFromContract(address);
    dispatch({
        type: FETCH_INVESTMENT,
        payload: investment
    })
}

export const invest = (formValues, contractAddress) => async dispatch => {
    //reload page
    console.log(`/investments/${contractAddress}`)

    await performAction(INVEST, async () => {
        //invest in investment
        await investToContract(contractAddress, formValues.amount);
        console.log("invested");
        //fetch investment
        var investment = await fetchInvestmentFromContract(contractAddress);

        dispatch({
                type: INVEST,
                payload: investment
            })
    }, dispatch);

    //update investment contribution
    dispatch(fetchInvestmentContributionSummary(contractAddress));
    //update investment details
    dispatch(fetchInvestment(contractAddress));
}

export const withdrawInvestment = (contractAddress) => async dispatch => {
    await performAction(WITHDRAW_INVESTMENT, async () => {
        //withdraw investment
        await withdrawInvestmentFromContract(contractAddress);
        
        //fetch investment
        var investment = await fetchInvestmentFromContract(contractAddress);
        
        dispatch({
            type: WITHDRAW_INVESTMENT,
            payload: investment
        })
    }, dispatch);
}

export const fetchInvestmentContributionSummary = (contractAddress) => async dispatch => {
    //fetch summary
    var investmentSummary = await fetchInvestmentContributionSummaryFromContract(contractAddress);
    dispatch({
        type: FETCH_INVESTMENTCONTRIBUTIONSUMMARY,
        payload: investmentSummary
    })
}

export const makePayment = (formValues, contractAddress) => async dispatch => {
    await performAction(MAKE_PAYMENT, async () => {
        //make payment
        await makePaymentToContract(contractAddress, formValues.amount);

        //get all payments
        const allPaymentsForContract = await getPaymentsFromContract(contractAddress);
    
        dispatch({
            type: MAKE_PAYMENT,
            payload: allPaymentsForContract
        })
    }, dispatch);
}

export const fetchPayments = (contractAddress) => async dispatch => {
    //get all payments
    const allPaymentsForContract = await getPaymentsFromContract(contractAddress);

    dispatch({
        type: FETCH_ALLPAYMENTS,
        payload: allPaymentsForContract
    })
}

export const withdrawPayments = (contractAddress) => async dispatch => {
    await performAction(WITHDRAW_PAYMENTS, async () => {

        //withdraw all payments as currently selected address
        await withdrawPaymentsFromContract(contractAddress);
        
        dispatch({
            type: WITHDRAW_PAYMENTS,
            payload: null
        })
    }, dispatch);
}

export const extractInvestments = (contractAddress) => async dispatch => {
    /*uPort method of extracting investments*/
    await extractInvestmentsFromContract_uPort(contractAddress);

    uPortConnect.onResponse('extractInvestmentsReq').then(async payload => {
        dispatch(etherScanStatusChecker(payload.payload, fetchInvestment, contractAddress));
    })

    /*Metamask methof of extracting investments */
    /*
    await performAction(EXTRACT_INVESTMENTS, async () => {
        //as an investment creator (manager) 
        //extract all investments made from investors
        await extractInvestmentsFromContract(contractAddress);

        //fetch investment
        var investment = await fetchInvestmentFromContract(contractAddress);

        dispatch({
                type: EXTRACT_INVESTMENTS,
                payload: investment
        });

    }, dispatch);
    */
}


export const fetchInvestmentManager = () => async (dispatch, getState) => {
    const managerAddress = getState().auth.user.uPortAddress;
    const investmentManager = await fetchInvestmentManagerFromContract(managerAddress);

    dispatch({
        type: FETCH_INVESTMENTMANAGER,
        payload: investmentManager
    })
}

export const upgradeInvestmentManagerRanking = (managerAddress) => async dispatch => {
    await upgradeRankFromContract(managerAddress);

    uPortConnect.onResponse('upgradeRankReq').then(async payload => {
        dispatch(etherScanStatusChecker(payload.payload, fetchInvestmentManager));
    })

    dispatch({
        type: UPGRADE_INVESTMENTMANAGER_RANKING,
        payload: null
    });
}







