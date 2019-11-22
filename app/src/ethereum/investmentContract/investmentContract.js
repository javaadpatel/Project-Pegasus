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

const requiredNumberOfConfirmations = 3;

export const createInvestmentFromContract = async (managerAddress, formValues) => {
    console.log(formValues);
    const investmentFactoryInstance = await createInvestmentFactoryInstance(); //Need to extract this into another file
    //get current blockchain timestamp
    const currentGanacheUnixTimestamp = (await investmentFactoryInstance.getBlockTimestamp()).toNumber();
    const investmentDeadlineUnixTimestamp = moment.unix(currentGanacheUnixTimestamp).add(formValues.deadline, 'd').endOf('day').unix();
    const createdAt = currentGanacheUnixTimestamp;
    console.log("created at", currentGanacheUnixTimestamp);
    console.log("deadline at", investmentDeadlineUnixTimestamp);


    console.log(managerAddress);
    /*Create Investment using UPort*/
    var txn = (await createUPortInvestmentFactory())
        .createInvestment(
                managerAddress,
                ethers.utils.parseEther(formValues.totalInvestmentCost),
                formValues.title,
                formValues.rationale,
                createdAt,
                investmentDeadlineUnixTimestamp,
                formValues.commissionFee,
            'createInvestmentReq');

    console.log(txn);
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

    console.log("creating investment");
    //get investment addresses
    // var investmentAddresses = await investmentFactoryInstance.getDeployedInvestments();

    // //last address will be the one that was just created
    // var investmentAddress = _.last(investmentAddresses);
    // console.log(investmentAddress);
    // var investment = await createInvestmentInstance(investmentAddress);
    // var investmentDetails = await investment.getInvestmentSummary();
    // investmentDetails.unshift(investmentAddress);
    // return createInvestmentObject(investmentDetails);
}

// export const uploadOpenLawContract = async () => {
//     console.log("inner upload");

//     //compile template
//     const templateObject = await compileOpenLawTemplate();

//     //argument template object with parameters for uploading
//     templateObject.investmentManager = "0x9D712E3b95C3816F4d923A00216ddAF99e02e644";
//     templateObject.investmentContractAddress = "0x64134384DCcAF62CDeCF1CD43790E44Efe9Fd635";
//     templateObject.investmentManagerEmail = "javaadpatel@gmail.com";

//     const html = await previewTemplate(templateObject);
//     console.log(html);

//     console.log(templateObject);
//     await uploadDraft(templateObject); 
// }

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

     //get openlaw signing status
     const signingStatus = await investment.getOpenLawContractSignedViaTransaction();
     investmentObject.openLawSigningStatus = signingStatus;

     return investmentObject;
}

export const investToContract = async (contractAddress, investmentInEther) => {
    var investmentInstance = await createInvestmentInstance(contractAddress);
    let overrides = {
        // The amount to send with the transaction (i.e. msg.value)
        value: ethers.utils.parseEther(investmentInEther)
    };
    console.log(investmentInstance)
    try{
        var investTxn = await investmentInstance.invest(overrides);
        await investTxn.wait(requiredNumberOfConfirmations);
    }catch(err){
        console.log(err);
    }
}

export const withdrawInvestmentFromContract = async (address) => {
    var investmentInstance = await createInvestmentInstance(address);
    var withdrawalTxn = await investmentInstance.withdrawInvestment();
    await withdrawalTxn.wait(requiredNumberOfConfirmations);
}

export const fetchInvestmentContributionSummaryFromContract = async (address) => {
    var investmentInstance = await createInvestmentInstance(address);
    //get investment contribution summary for the calling address
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
    await paymentTxn.wait(requiredNumberOfConfirmations);
}

export const withdrawPaymentsFromContract = async (contractAddress) => {
    var investmentInstance = await createInvestmentInstance(contractAddress);
    var paymentWithdrawalTxn = await investmentInstance.withdrawPayments();
    await paymentWithdrawalTxn.wait(requiredNumberOfConfirmations);
}

export const extractInvestmentsFromContract = async (contractAddress) => {
    var investmentInstance = await createInvestmentInstance(contractAddress);
    var extractInvestmentsTxn = await investmentInstance.transferInvestmentContributions();
    await extractInvestmentsTxn.wait(requiredNumberOfConfirmations);
}

export const extractInvestmentsFromContract_uPort = async (contractAddress) => {
    (await createUPortInvestment(contractAddress))
        .transferInvestmentContributions(
            'extractInvestmentsReq');
}

export const signOpenLawContract_uPort = async (contractAddress, html) => {
    //escape html before saving to contract
    html = _.escape(html);
    console.log(html);

    (await createUPortInvestment(contractAddress))
    .signOpenLawContract(
        html,
        'signOpenLawContractReq');
}
