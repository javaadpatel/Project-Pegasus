import moment from 'moment';
import { ethers } from 'ethers';
import _ from 'lodash';
import {createInvestmentFactory as createInvestmentFactoryInstance, 
    createUPortInvestmentFactory} from '../investmentFactory';
import {createInvestment as createInvestmentInstance,
    createUPortInvestment
 } from  '../investment';
import {createInvestmentObject, createInvestmentContributionSummaryObject, 
    checkFailedInvestment, createPaymentObjectsArray} from './contractHelperFunctions';


export const createInvestmentFromContract = async (managerAddress, formValues) => {
    const investmentFactoryInstance = await createInvestmentFactoryInstance(); //Need to extract this into another file
    //get current blockchain timestamp
    const currentGanacheUnixTimestamp = (await investmentFactoryInstance.getBlockTimestamp()).toNumber();
    const investmentDeadlineUnixTimestamp = moment.unix(currentGanacheUnixTimestamp).add(formValues.deadline, 'd').endOf('day').unix();
    const createdAt = currentGanacheUnixTimestamp;

    /*Create Investment using UPort*/
    (await createUPortInvestmentFactory())
        .createInvestment(
                managerAddress,
                ethers.utils.parseEther(formValues.totalInvestmentCost),
                formValues.title,
                formValues.rationale,
                createdAt,
                investmentDeadlineUnixTimestamp,
                formValues.commissionFee,
            'createInvestmentReq');

    /*Create Investment through metaMask*/
    // const createInvesmentTxn = await investmentFactoryInstance
    //     .createInvestment(
    //         managerAddress,
    //         ethers.utils.parseEther(formValues.totalInvestmentCost),
    //         formValues.title,
    //         formValues.rationale,
    //         createdAt,
    //         investmentDeadlineUnixTimestamp,
    //         formValues.commissionFee
    //     );
    // console.log("investmentTransaction-Metamask:", createInvesmentTxn);
    // await investmentFactoryInstance.verboseWaitForTransaction(createInvesmentTxn);

    //get investment addresses
    var investmentAddresses = await investmentFactoryInstance.getDeployedInvestments();

    //last address will be the one that was just created
    var investmentAddress = _.last(investmentAddresses);
    var investment = await createInvestmentInstance(investmentAddress);
    var investmentDetails = await investment.getInvestmentSummary();
    investmentDetails.unshift(investmentAddress);
    return createInvestmentObject(investmentDetails);
}

export const fetchInvestmentsFromContract = async () => {
    const investments = [];
    const investmentFactoryInstance = await createInvestmentFactoryInstance(); //Need to extract this into another file

    var investmentAddresses = await investmentFactoryInstance.getDeployedInvestments();
    await Promise.all(investmentAddresses.map(async (address) => {
        var investment = await createInvestmentInstance(address);
        var investmentDetails = await investment.getInvestmentSummary();
        //add address property to array
        investmentDetails.unshift(address);

        //create investmentObject
        var investmentObject = createInvestmentObject(investmentDetails);

        //check investmentStatus to determine if investment is failed
        investmentObject = await checkFailedInvestment(investment, investmentObject);
        
        //convert array to object
        investments.push(investmentObject);
    }));

    return investments;
}

export const fetchInvestmentFromContract = async (address) => {
    var investment = await createInvestmentInstance(address);
    var investmentDetails = await investment.getInvestmentSummary();
    //add address property to array
    investmentDetails.unshift(address);
        
    //convert array to object
    var investmentObject = createInvestmentObject(investmentDetails);

     //check investmentStatus to determine if investment is failed
     investmentObject = await checkFailedInvestment(investment, investmentObject);

     return investmentObject;
}

export const investToContract = async (contractAddress, investmentInEther) => {
    var investmentInstance = await createInvestmentInstance(contractAddress);
    var investTxn = await investmentInstance.invest({value: ethers.utils.parseEther(investmentInEther)});
    await investmentInstance.verboseWaitForTransaction(investTxn);
}

export const withdrawInvestmentFromContract = async (address) => {
    var investmentInstance = await createInvestmentInstance(address);
    var withdrawalTxn = await investmentInstance.withdrawInvestment();
    await investmentInstance.verboseWaitForTransaction(withdrawalTxn);
}

export const fetchInvestmentContributionSummaryFromContract = async (address) => {
    var investmentInstance = await createInvestmentInstance(address);
    var investmentContributionSummaryArray = await investmentInstance.getInvestmentContributionSummary();
    //convert array to object
    var investmentContributionSummaryObject = createInvestmentContributionSummaryObject(address, investmentContributionSummaryArray);
    return investmentContributionSummaryObject;
}

export const getPaymentsFromContract = async (contractAddress) => {
    var investmentInstance = await createInvestmentInstance(contractAddress);
    var paymentsArray = await investmentInstance.getAllPaymentRecords();
    var paymentsObjectArray = createPaymentObjectsArray(paymentsArray);

    //create payment object which has the contractAddress as a key and the array of payments as a value
    var paymentObject = {};
    paymentObject[contractAddress] = paymentsObjectArray;

    return paymentObject;
}

export const makePaymentToContract = async (contractAddress, paymentInWei) => {
    var investmentInstance = await createInvestmentInstance(contractAddress);
    var paymentTxn = await investmentInstance.pay({value: ethers.utils.parseEther(paymentInWei)});
    await investmentInstance.verboseWaitForTransaction(paymentTxn);
}

export const withdrawPaymentsFromContract = async (contractAddress) => {
    var investmentInstance = await createInvestmentInstance(contractAddress);
    var paymentWithdrawalTxn = await investmentInstance.withdrawPayments();
    await investmentInstance.verboseWaitForTransaction(paymentWithdrawalTxn);
}

export const extractInvestmentsFromContract = async (contractAddress) => {
    var investmentInstance = await createInvestmentInstance(contractAddress);
    var extractInvestmentsTxn = await investmentInstance.transferInvestmentContributions();
    await investmentInstance.verboseWaitForTransaction(extractInvestmentsTxn);
}

export const extractInvestmentsFromContract_uPort = async (contractAddress) => {
    (await createUPortInvestment(contractAddress))
        .transferInvestmentContributions(
            'extractInvestmentsReq');
}
