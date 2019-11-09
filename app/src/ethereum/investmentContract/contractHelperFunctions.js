import moment from 'moment';
import { ethers } from 'ethers';
import {InvestmentStatusEnum, convertInvestmentStatusIntToConstant,
    convertInvestmentTransferStatusIntToConstant} from '../../constants';

export const createInvestmentObject = (investmentArray) => {
    var investmentObject = {}
    investmentObject.address = investmentArray[0];
    investmentObject.managerAddress = investmentArray[1];
    investmentObject.totalInvestmentCost = ethers.utils.formatEther(investmentArray[2]);
    investmentObject.investmentTitle = investmentArray[3];
    investmentObject.investmentRationale = investmentArray[4];
    investmentObject.createdAt = moment(investmentArray[5].toNumber() * 1000).format('L');
    investmentObject.investmentDeadlineTimestamp = moment(investmentArray[6].toNumber() * 1000).format('D/MM/YY');
    investmentObject.investmentStatus = convertInvestmentStatusIntToConstant(investmentArray[7]);
    investmentObject.commissionFee = investmentArray[8].toNumber();
    investmentObject.totalInvestmentContributed = ethers.utils.formatEther(investmentArray[9]);
    investmentObject.investorCount = investmentArray[10];
    investmentObject.investmentTransferStatus = convertInvestmentTransferStatusIntToConstant(investmentArray[11]);
    investmentObject.managerRanking = investmentArray[12];
    return investmentObject;
}

export const createInvestmentContributionSummaryObject = (contractAddress, contributionArray) => {
    var contributionObject = {};
    contributionObject.investmentContractAddress = contractAddress;
    contributionObject.amountContributedInEth = ethers.utils.formatEther(contributionArray[0]);
    contributionObject.percentageShare = (contributionArray[1].div(100000)).toNumber();
    return contributionObject;
}

export const checkFailedInvestment = async (investment, investmentObject) => {
    //check if the contract is still INPROGRESS
    if (investmentObject.investmentStatus === InvestmentStatusEnum.INPROGRESS) {
        //check if the date now is after the investement is supposed to have expired
        if (moment().isAfter(moment(investmentObject.investmentDeadlineTimestamp, 'D/MM/YY'))) {
            //await investment.checkContractStatus();
            // await investment.verboseWaitForTransaction(statussTxn);

            //hack, set status to FAILED, otherwise user will have to initiate transaction
            investmentObject.investmentStatus = InvestmentStatusEnum.FAILED;

            // await investment.verboseWaitForTransaction(statusTxn);
            // investmentObject = await fetchInvestmentFromContract(investmentObject.address);
        }
    }

    return investmentObject;
}


export const createPaymentObjectsArray = (rawPayments) => {
    var payments = rawPayments
        .map((payment) => payment.splice(-3, 3))
        .map((payment) => {
            var paymentObject = {};
            console.log("create payments object array",moment.unix(payment[0]));
            paymentObject.timestamp = moment.unix(payment[0].toNumber()).format('LLLL');
            paymentObject.amountInEther = ethers.utils.formatEther(payment[1]);
            paymentObject.address = payment[2];
            return paymentObject;
        })
    return payments;
}

// createPaymentObjectsArray = (rawPayments) =>{
//     var payments = rawPayments
//         .map((payment) => payment.splice(-3,3))
//         .map((payment) => { 
//             return {
//                 timestamp:  moment.unix(payment[0]),
//                 amountInEther:     ethers.utils.formatEther(payment[1]),
//                 address:    payment[2]
//             } 
//     })
//     return payments;
// }