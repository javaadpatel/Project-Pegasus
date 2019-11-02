const ethers = require('ethers');
const truffleAssert = require('truffle-assertions');
const InvestmentFactory = artifacts.require("InvestmentFactory");
const InvestmentRanking = artifacts.require("InvestmentRanking");
const Investment = artifacts.require("Investment");
const moment = require('moment');
const timeTravelHelper = require("./helpers/truffleTestHelpers");

//chai assertions: https://www.chaijs.com/api/assert/

let investorOne;//= accounts[1];
let investorTwo;// = accounts[2];
let investorThree;// = accounts[3];
let renterOne;// = accounts[4];
let managerAccountAddress;// = accounts[0].signer.address;
let investmentFactoryInstance;
const INVESTMENTSTATUS_INPROGRESS = "0";
const INVESTMENTSTATUS_COMPLETED = "1";
const INVESTMENTSTATUS_FAILED = "2";
const INVESTMENTTRANSFERSTATUS_INCOMPLETE = "0";
const INVESTMENTTRANSFERSTATUS_COMPLETED = "1";

//precision used for calculating percentages
const precision = Math.pow(10, 8);

const investmentDetails = {
    totalInvestmentCost: '10.0', //amount of ETH
    title: "Investment Title",
    rationale: "This is a great investment, here's why.",
    createdAt: moment().unix(),
    deadline: moment().add(30, 'd').endOf('day').unix(),
    commissionFee: 10 //fee in percentage
};

const investmentRankingDefaultParameters = {
    a : 50000,
    b : 49990,
    c: 0
};

createInvestmentInstance = async (contractAddress) => {
    return await Investment.at(contractAddress);
}

//Transaction waiting helpers
const toTxHash = (value) => {
    if (typeof value === "string") {
      // this is probably a tx hash already
      return value;
    } else if (typeof value.receipt === "object") {
      // this is probably a tx object
      return value.receipt.transactionHash;
    } else {
      throw "Unsupported tx type: " + value;
    }
  }
  
const mineTx = (promiseOrTx, interval) => {
return Promise.resolve(promiseOrTx)
    .then(tx => {
    const txHash = toTxHash(tx);

    return new Promise((resolve, reject) => {
        const getReceipt = () => {
        web3.eth.getTransactionReceipt(txHash, (error, receipt) => {
            if (error) {
            reject(error);
            } else if (receipt) {
            resolve(receipt);
            } else {
            setTimeout(getReceipt, interval || 500);
            }
        })
        }

        getReceipt();
    })
    });
}

//Blockchain fast forwarding helpers

createInvestment = async (totalInvestmentCost) => {
    //this must be done because ganache is global so whenever we fast forward in a test then we must adjust the investment deadline 
    //before the next test starts so that it remains accuract
    const currentGanacheUnixTimestamp = (await investmentFactoryInstance.getBlockTimestamp()).toNumber();
    const investmentDeadlineUnixTimestamp = moment.unix(currentGanacheUnixTimestamp).add(30, 'd').endOf('day').unix();

    //set investment deadline
    investmentDetails.deadline = investmentDeadlineUnixTimestamp;
    return await investmentFactoryInstance
    .createInvestment(
        managerAccountAddress,
        ethers.utils.parseEther(totalInvestmentCost === undefined ? investmentDetails.totalInvestmentCost : totalInvestmentCost),
        investmentDetails.title,
        investmentDetails.rationale,
        investmentDetails.createdAt,
        investmentDetails.deadline,
        investmentDetails.commissionFee,
        {
            from: managerAccountAddress
        }
    );
}

setGanacheToFutureDate = async() => {
    //time elapses and now the investment is FAILED
    var secondsMargin = 900; //this margin is because miners can edit the timestamp by 900 seconds

    var timeToAdvanceInSeconds = moment.duration(
        moment.unix(investmentDetails.deadline).diff(moment())
    ).asSeconds() + secondsMargin;
    timeToAdvanceInSeconds = parseInt(timeToAdvanceInSeconds);

    await timeTravelHelper.advanceTimeAndBlock(timeToAdvanceInSeconds);
}

createInvestmentSummaryObject = (rawInvestmentSummary) => {
    return {
        investmentManager: rawInvestmentSummary['0'],
        totalInvestmentCost: rawInvestmentSummary['1'],
        investmentTitle: rawInvestmentSummary['2'],
        investmentRationale: rawInvestmentSummary['3'],
        createdAt: rawInvestmentSummary['4'],
        investmentDeadline: rawInvestmentSummary['5'],
        investmentStatus: rawInvestmentSummary['6'],
        commissionFee: rawInvestmentSummary['7'],
        totalInvestmentContributed: rawInvestmentSummary['8'],
        investorCount: rawInvestmentSummary['9'],
        investmentTransferStatus: rawInvestmentSummary['10'],
        managerRanking: rawInvestmentSummary['11']
    }
}

createPaymentObjectsArray = (rawPayments) =>{
    var payments = rawPayments
        .map((payment) => payment.splice(-3,3))
        .map((payment) => { 
            return {
                timestamp:  moment.unix(payment[0]),
                amountInEther:     ethers.utils.formatEther(payment[1]),
                address:    payment[2]
            } 
    })
    return payments;
}

createInvestmentManagerObject = (rawInvestmentManager) => {
    return {
        investmentAddresses: rawInvestmentManager[0],
        totalPaymentsFromInvestments: rawInvestmentManager[1],
        rank: rawInvestmentManager[2]
    }
}

calculatePercentageContributionRaw = (totalCost, contribution) => {
    //var precision = 100000000;
    var numerator = contribution * precision;
    var temp = numerator / totalCost + 5; // proper rounding up
    var percentageRaw = Math.floor(temp / 10);
    return percentageRaw;
}

calculatePercentageContributionFormatted = (percentageContribution) => {
    return percentageContribution * precision / Math.pow(10, 1);
}

getEtherBalanceOfAddress = async (address) => {
    var balanceInWei = await web3.eth.getBalance(address);
    return web3.utils.fromWei(balanceInWei, 'ether');
}

const shouldRunTimeTravelTests = true;
const shouldRunInvestmentContractTests = true;
const shouldRunInvestmentRankingTests = true;

(shouldRunInvestmentContractTests ? describe : describe.skip)('Investment Contract', () => {
    contract("InvestmentFactory", accounts => {
        managerAccountAddress = accounts[0];
        investorOne = accounts[1];
        investorTwo = accounts[2];
        investorThree = accounts[3];
        renterOne = accounts[4];
    
        beforeEach(async () => {
            investmentRankingInstance = await InvestmentRanking.new();
            investmentFactoryInstance = await InvestmentFactory.new(investmentRankingInstance.address);// deployer.deploy(InvestmentFactory, false, investmentRankingInstance.contractAddress);
        });
    
        it('should be a valid address', async() => {
            web3.utils.isAddress(investmentFactoryInstance.address, "The contract was not deployed");
        });
    
        it('should have no deployed contracts when initialized', async() => {
            const deployedInvestments = await investmentFactoryInstance.getDeployedInvestments();
            assert.isEmpty(deployedInvestments, "No investments should be deployed on initialization");
        });
    
        it('should create an investment', async() => {
            await createInvestment();
            const deployedInvestments = await investmentFactoryInstance.getDeployedInvestments();
            //assert investment is created and pushed to array
            assert.isNotEmpty(deployedInvestments, "Investment should be created");
            //asert investment itself is a contract
            web3.utils.isAddress(deployedInvestments[0], "Investment should be contract");
    
            //assert investment details
            const investmentInstance = await createInvestmentInstance(deployedInvestments[0]);
            //destructure array, note that ordering of parameters is important
            const investmentSummary = createInvestmentSummaryObject(await investmentInstance.getInvestmentSummary());
            assert.equal(investmentSummary.investmentManager, managerAccountAddress, "Creator of investment should be manager");
            assert.equal(web3.utils.fromWei(investmentSummary.totalInvestmentCost, 'ether'), parseFloat(investmentDetails.totalInvestmentCost), "Total cost should be total cost specified when creating investment");
            assert.equal(investmentSummary.investmentTitle, investmentDetails.title, "Investment title should be title specified when creating investment");
            assert.equal(investmentSummary.investmentRationale, investmentDetails.rationale, "Investment rationale should be rationale specified when creating investment");
            assert.equal(investmentSummary.createdAt, investmentDetails.createdAt, "Investment createdAt should be the unix time specified when creating the investment");
            assert.equal(investmentSummary.investmentDeadline, investmentDetails.deadline, "Investment deadline should be deadline specified when creating investment");
            assert.equal(investmentSummary.investmentStatus, INVESTMENTSTATUS_INPROGRESS, "Investment should be 0 (INPROGRESS) after creation");
            assert.equal(investmentSummary.commissionFee, investmentDetails.commissionFee, "Commission fee should be commissionFee specified when creating investment");
            assert.equal(investmentSummary.investmentTransferStatus, INVESTMENTTRANSFERSTATUS_INCOMPLETE, "InvestmentTransferStatus should be 0 (UNCOMPLETED) after creation");
            assert.equal(investmentSummary.managerRanking, 1, "New investment manager therefore investment should have corresponding ranking");
        });
    
        it('should show the correct investment status', async() =>{
            await createInvestment();
    
            const deployedInvestments = await investmentFactoryInstance.getDeployedInvestments();
            
            //assert investment details
            const investmentInstance = await createInvestmentInstance(deployedInvestments[0]);
    
            await investmentInstance.checkContractStatus();
    
             //destructure array, note that ordering of parameters is important
             const investmentSummary = createInvestmentSummaryObject(await investmentInstance.getInvestmentSummary());
             assert.equal(investmentSummary.investmentStatus, INVESTMENTSTATUS_INPROGRESS, "Investment should be 0 (INPROGRESS) after creation");
        });
    
        it('should emit an investment created event (investment factory)', async() =>{
            let expectedEvent = 'InvestmentCreated';
            const createTransaction =   await createInvestment();
            //wait for transaction
            await mineTx(createTransaction);
            //check for event
            truffleAssert.eventEmitted(createTransaction, expectedEvent);
        });
    
        it('should accept money when investing in an investment', async() => {
            const initialInvestmentEther = '1.5';
            const initialInvestmentWei = ethers.utils.parseEther(initialInvestmentEther);
            // create investment contract
            await createInvestment();
    
            //assign invesmentInstance
            const deployedInvestments = await investmentFactoryInstance.getDeployedInvestments();
            const investmentInstance = await createInvestmentInstance(deployedInvestments[0]);
    
            await investmentInstance.invest({value: initialInvestmentWei});
    
            //assert investment contract balance is updated to reflect the investment made
            const balance = web3.utils.fromWei(await web3.eth.getBalance(investmentInstance.address), 'ether');
            assert.equal(balance, parseFloat(initialInvestmentEther), 
                "The amount invested must be the balance of the contract");
    
            //asert that the investors contribution is registered
            const investorsContribution = await investmentInstance.getInvestmentContribution(managerAccountAddress);
            assert.equal(web3.utils.fromWei(investorsContribution,'ether'), parseFloat(initialInvestmentEther), 
                "investors contribution is registered");
    
            //assert number of investors is now set to 1
            const numberOfInvestors = await investmentInstance._investorCount();
            assert.equal(1, numberOfInvestors, "there should only be 1 investor after 1 investor has invested");
        });
    
        it('should only increment the number of investors if the contribution is from a new investor', async () => {
            const initialInvestmentEther = '1.5';
            const initialInvestmentWei = ethers.utils.parseEther(initialInvestmentEther);
            // create investment contract
            await createInvestment();
    
            //assign invesmentInstance
            const deployedInvestments = await investmentFactoryInstance.getDeployedInvestments();
            const investmentInstance = await createInvestmentInstance(deployedInvestments[0]);
    
            //first investment
            await investmentInstance.invest({value: initialInvestmentWei});
            //second investment
            await investmentInstance.invest({value: initialInvestmentWei});
    
            //assert number of investors is now set to 1
            const numberOfInvestors = await investmentInstance._investorCount();
            assert.equal(1, numberOfInvestors, "there should only be 1 investor after 1 investor has invested twice");
        });
    
        it('should record multiple investments made by an investor', async () => {
            const initialInvestmentEther = '1.5';
            const totalInvestmentEther = '3.0';
            const initialInvestmentWei = ethers.utils.parseEther(initialInvestmentEther);
            const totalInvestmentWei = ethers.utils.parseEther('3.0');
            // create investment contract
            await createInvestment();
    
            //assign invesmentInstance
            const deployedInvestments = await investmentFactoryInstance.getDeployedInvestments();
            const investmentInstance = await createInvestmentInstance(deployedInvestments[0]);
    
            //first investment
            await investmentInstance.invest({value: initialInvestmentWei});
            //second investment
            await investmentInstance.invest({value: initialInvestmentWei});
            const totalBalance = await web3.eth.getBalance(investmentInstance.address);
            //assert investment contract balance is updated to reflect the investment made
            assert.equal(totalBalance, totalInvestmentWei, 
                "The amount invested must be the balance of the contract, must have both investment contributions");
    
            //asert that the investors contribution is registered
            const investorsContribution = web3.utils.fromWei(await investmentInstance.getInvestmentContribution(managerAccountAddress), 'ether');
            assert.equal(investorsContribution,  parseFloat(totalInvestmentEther), 
                "investors subsequent investments are registered");
        });
    
        it('should update the total investment made after investment contribution has been made', async () => {
            const initialInvestmentEther = '1.5';
            const initialInvestmentWei = ethers.utils.parseEther(initialInvestmentEther);
            // create investment contract
            await createInvestment();
    
            //assign invesmentInstance
            const deployedInvestments = await investmentFactoryInstance.getDeployedInvestments();
            const investmentInstance = await createInvestmentInstance(deployedInvestments[0]);
    
            //initial balance
            //first investment
            await investmentInstance.invest({value: initialInvestmentWei});
    
            //destructure array, note that ordering of parameters is important
            const investmentSummary = createInvestmentSummaryObject(await investmentInstance.getInvestmentSummary());
            assert.equal(web3.utils.fromWei(investmentSummary.totalInvestmentContributed), ethers.utils.formatEther(initialInvestmentWei),
                "the total investment should be updated after investment contributed");
        });
    
        it('should mark investment as complete when enough investment contributions have been made', async () => {
            const initialInvestmentEther = '10';
            const initialInvestmentWei = ethers.utils.parseEther(initialInvestmentEther);
            // create investment contract
            await createInvestment();
    
            //assign invesmentInstance
            const deployedInvestments = await investmentFactoryInstance.getDeployedInvestments();
            const investmentInstance = await createInvestmentInstance(deployedInvestments[0]);
    
            //invest complete investment amount
            await investmentInstance.invest({value: initialInvestmentWei});
    
            const investmentStatus = await investmentInstance._investmentStatus();
            assert.equal(investmentStatus, INVESTMENTSTATUS_COMPLETED, "total investment required has been invested");
        });
    
        it('should refund ethers when investment greater than the required investment is made', async () => {
            const initialInvestmentEther = '12';
            const initialInvestmentWei = ethers.utils.parseEther(initialInvestmentEther);
            // create investment contract
            await createInvestment();
    
            //assign invesmentInstance
            const deployedInvestments = await investmentFactoryInstance.getDeployedInvestments();
            const investmentInstance = await createInvestmentInstance(deployedInvestments[0]);
    
             //initial balance
             const walletBalanceBeforeInvestment = await getEtherBalanceOfAddress(managerAccountAddress);// await web3.eth.getBalance(managerAccountAddress);
    
             //invest complete investment amount
            await investmentInstance.invest({value: initialInvestmentWei});
    
            //balance after investment
            const walletBalanceAfterInvestment = await getEtherBalanceOfAddress(managerAccountAddress);
            //difference in balance
            const diffInWalletBalanceInEther = walletBalanceBeforeInvestment - walletBalanceAfterInvestment;
    
            //assert that only 10 ethers (+gas are taken) and the rest is refunded
            assert.isBelow(parseFloat(diffInWalletBalanceInEther), 10.1, 
                "only 10 ethers should be taken from the account and 2 ethers should be refunded");
     
            const investmentStatus = await investmentInstance._investmentStatus();
            assert.equal(investmentStatus, INVESTMENTSTATUS_COMPLETED, "total investment required has been invested");
        });
    
        it('should let manager withdraw funds when investement fully funded (COMPLETED)', async() => {
            const initialInvestmentEther = '10';
            const initialInvestmentWei = ethers.utils.parseEther(initialInvestmentEther);
            // create investment contract
            await createInvestment();
    
            //assign invesmentInstance
            const deployedInvestments = await investmentFactoryInstance.getDeployedInvestments();
            const investmentInstance = await createInvestmentInstance(deployedInvestments[0]);
    
            //invest complete investment amount (from account that is not manager)
            await investmentInstance.invest({from: investorOne, value: initialInvestmentWei});
            
            //initial manager account balance
            const walletBalanceInEtherBeforeWithdrawal = await getEtherBalanceOfAddress(managerAccountAddress);
    
            //withdraw investment contributions
            await investmentInstance.transferInvestmentContributions();
    
            //balance after withdrawing investment contributions
            const walletBalanceInEtherAfterWithdrawal =  await getEtherBalanceOfAddress(managerAccountAddress);
    
            //difference in balance
            const diffInWalletBalanceInEther =  walletBalanceInEtherAfterWithdrawal - walletBalanceInEtherBeforeWithdrawal;
    
            assert.closeTo(parseFloat(diffInWalletBalanceInEther), 10.0, 0.001, "manager account should receive entire investment contribution amount")
        });
    
        it('should set InvestmentTransferStatus to INVESTMENTTRANSFER_COMPLETED', async () => {
            const initialInvestmentEther = '10';
            const initialInvestmentWei = ethers.utils.parseEther(initialInvestmentEther);
            // create investment contract
            await createInvestment();
    
            //assign invesmentInstance
            const deployedInvestments = await investmentFactoryInstance.getDeployedInvestments();
            const investmentInstance = await createInvestmentInstance(deployedInvestments[0]);
    
            //invest complete investment amount (from account that is not manager)
            await investmentInstance.invest({from: investorOne, value: initialInvestmentWei});
    
            //withdraw investment contributions
            await investmentInstance.transferInvestmentContributions();
    
            //asert InvestmentTransferStatus
            const investmentSummary = createInvestmentSummaryObject(await investmentInstance.getInvestmentSummary());
            assert.equal(investmentSummary.investmentTransferStatus, INVESTMENTTRANSFERSTATUS_COMPLETED,
                "InvestmentTransferStatus should be 1 (COMPLETED) after transferring funds to manager");
        });
    
        it('should return the percentage share an investor can expect from the investment', async () => {
            const initialInvestmentEther = '3.6789';
            const initialInvestmentWei = ethers.utils.parseEther(initialInvestmentEther);
            // create investment contract
            await createInvestment();
    
            //assign invesmentInstance
            const deployedInvestments = await investmentFactoryInstance.getDeployedInvestments();
            const investmentInstance = await createInvestmentInstance(deployedInvestments[0]);
    
            //invest complete investment amount
            await investmentInstance.invest({value: initialInvestmentWei});
    
            const percentageShare = await investmentInstance.getPercentageShare(managerAccountAddress);
            // console.log("percentage share: ", percentageShare.toNumber());
            //assert percentage share is according to investment contributed
            const precision = 100000000 / 10;
            assert.equal(percentageShare, parseFloat(initialInvestmentEther/10) * precision, "the investors percentage should be correct");
        });
    
        it('should let payment to investment be made', async() => {
            //setup investment with completed investment
            const initialInvestmentEther = '10';
            const initialInvestmentWei = ethers.utils.parseEther(initialInvestmentEther);
            // create investment contract
            await createInvestment();
    
            //assign invesmentInstance
            const deployedInvestments = await investmentFactoryInstance.getDeployedInvestments();
            const investmentInstance = await createInvestmentInstance(deployedInvestments[0]);
    
            //invest complete investment amount
            await investmentInstance.invest({value: initialInvestmentWei});
    
            //let manager withdraw investment (contract should now have no balance)
            await investmentInstance.transferInvestmentContributions();
    
            //send payment of 1 ETH into investment contract
            const paymentInWei = ethers.utils.parseEther('1');
            await investmentInstance.pay({from: renterOne, value: paymentInWei});
    
            //assert that money has been received in contract
            const contractBalanceInEther = await getEtherBalanceOfAddress(investmentInstance.address);
            assert.equal(parseFloat(contractBalanceInEther), ethers.utils.formatEther(paymentInWei), 
                "The contract balance should be the amount that was payed into the contract");
    
            //assert that payment has been recorded in the contract
            const paymentsMadeByRenterOne = await investmentInstance.getPaymentRecords(renterOne);
    
            //map over payments
            var payments = createPaymentObjectsArray(paymentsMadeByRenterOne);
    
            assert.isNotEmpty(payments, "a payment record for renterOne's payment should exist");
            assert.equal(payments[0].amountInEther, "1.0", "the payment record should reflect the amount paid into contract");
            assert.equal(payments[0].address, renterOne , "the payment record should reflect the address who paid into contract");
        });
    
        it('should pay investment creator their fee and investors based on their contribution (percentage share)', async() => {
            const investmentTotalCost = 10;
    
            // create investment contract
            await createInvestment();
    
            //assign invesmentInstance
            const deployedInvestments = await investmentFactoryInstance.getDeployedInvestments();
            const investmentInstance = await createInvestmentInstance(deployedInvestments[0]);
    
            //invest complete investment amount
            const investorInvestments = [
                {investor: investorOne, address: investorOne, amount: '2.1'},
                {investor: investorTwo, address: investorTwo, amount: '2.8'},
                {investor: investorThree, address: investorThree, amount: '5.1'}
            ];
            //investment contributions should be greater than total required investment
            assert.isAtLeast(
                investorInvestments.reduce((total, current) => total + parseFloat(current.amount), 0),
                investmentTotalCost,
                "investors contribution should be equal or greater than totalInvestmentCost");
    
            await Promise.all(investorInvestments.map(async (investment) => {
                await investmentInstance.invest({from: investment.investor, value: ethers.utils.parseEther(investment.amount)});
            }));
    
            //validate that investment is COMPLETED
            var investmentStatus = await investmentInstance._investmentStatus();
    
            // console.log("totalInvestmentContribution: ", ethers.utils.formatEther(await investmentInstance._totalInvestmentContributed()));
            // console.log("totalInvestmentCost: ", ethers.utils.formatEther(await investmentInstance._totalInvestmentCost()));
            assert.equal(investmentStatus, INVESTMENTSTATUS_COMPLETED, "investment should be completed");
    
            //let manager withdraw investment (contract should now have no balance)
            await investmentInstance.transferInvestmentContributions();
    
            // //send payment of 1 ETH into investment contract
            const paymentInWei = ethers.utils.parseEther('1.0');
            await investmentInstance.pay({from: renterOne, value: paymentInWei});
    
            // //assert that payment has been recorded in the contract
            const paymentsMadeByRenterOne = await investmentInstance.getPaymentRecords(renterOne);
            // //create payments
            var payments = createPaymentObjectsArray(paymentsMadeByRenterOne);
            var totalPayment = ethers.utils.formatEther(paymentsMadeByRenterOne[0].amount);
            assert.isNotEmpty(payments, "a payment record for renterOne's payment should exist");
    
            //see all payments
            //console.log("all payments: ", await investmentInstance.getAllPaymentRecords());
    
            //assert percentage shares of investors total 100%
            await Promise.all(investorInvestments.map(async (investment) => {
                const percentageShare = await investmentInstance.getPercentageShare(investment.address);
                // console.log("percentage share (unconverted): ", percentageShare.toNumber(), "percentage");
                //console.log("percentage share (converted): ", (percentageShare.toNumber()/100000));
                //assert each investors percentage share is correct
                assert.equal(percentageShare, calculatePercentageContributionRaw(investmentTotalCost, investment.amount), 
                    "the investors percentage should be correct");
                //add a percentage share property to each investment
                investment.percentageShare = percentageShare;
            }));
    
            //assert total investment percentage share is correct
            assert.equal(
                investorInvestments.reduce((total, current) => total + parseInt(current.percentageShare), 0),
                calculatePercentageContributionRaw(investmentTotalCost, investmentTotalCost),
                "investors percentage shares should total 100% (in precision format)");
    
            // console.log("Investor's percentages calcualted and confirmed successfully");
    
            //check that investors get their share
            await Promise.all(investorInvestments.map(async (investment) => {
                const walletBalanceInEtherBeforeWithdrawingPayments = await getEtherBalanceOfAddress(investment.address);
                await investmentInstance.withdrawPayments({from: investment.address});
                const walletBalanceInEtherAfterWithdrawingPayments =  await getEtherBalanceOfAddress(investment.address);
                const diffInWalletBalanceInEther = walletBalanceInEtherAfterWithdrawingPayments - walletBalanceInEtherBeforeWithdrawingPayments;// ethers.utils.formatEther(diffInWalletBalance);
    
                var oneHundredPercentWithPrecision = calculatePercentageContributionFormatted(100);
                var managerFee = calculatePercentageContributionFormatted(10);
                var baseAmountSubtractingFees = paymentInWei.mul(oneHundredPercentWithPrecision - managerFee).div(precision);
                var percentageShareBigNumber = ethers.utils.bigNumberify(investment.percentageShare.toString());
    
                var expectedAmountWithFees = baseAmountSubtractingFees.mul(percentageShareBigNumber).div(precision);
                var expectedAmountInEtherWithFees = ethers.utils.formatEther(expectedAmountWithFees);
                // console.log("Expected amount with fees: ", expectedAmountInEtherWithFees);
        
                assert.closeTo(parseFloat(diffInWalletBalanceInEther), 
                    parseFloat(expectedAmountInEtherWithFees), 
                    0.01,
                    "because the investor should receive a percentage of the payment proportional to their initial investment")
    
                investment.paymentWithdrawnInEther = diffInWalletBalanceInEther
            }))
    
            //assert payments withdrawn total payment paid minus fees
            assert.closeTo(
                investorInvestments.reduce((total, current) => total + parseFloat(current.paymentWithdrawnInEther), 0),
                parseFloat(totalPayment) * (100 - investmentDetails.commissionFee) / (100),
                0.01,
                "Validated all investors payments share received is correct");
    
            //check that investors can't withdraw twice
            await Promise.all(investorInvestments.map(async (investment) => {
                const walletBalanceInEtherBeforeWithdrawingPayments = await getEtherBalanceOfAddress(investment.address);
                await investmentInstance.withdrawPayments({from: investment.address});
                const walletBalanceInEtherAfterWithdrawingPayments = await getEtherBalanceOfAddress(investment.address);
                const diffInWalletBalanceInEther = walletBalanceInEtherAfterWithdrawingPayments - walletBalanceInEtherBeforeWithdrawingPayments;
    
                assert.closeTo(parseFloat(diffInWalletBalanceInEther), 
                    parseFloat(0), 
                    0.01,
                    "because the investor should not be able to withdraw any more payments")
            }))
    
            //check that manager can withdraw fees
            const managerWalletBalanceInEtherBeforeWithdrawingPayments = await getEtherBalanceOfAddress(managerAccountAddress);
            await investmentInstance.withdrawPaymentsAsManager({from: managerAccountAddress});
            const managerWalletBalanceInEtherAfterWithdrawingPayments = await getEtherBalanceOfAddress(managerAccountAddress);
            const diffInManagerWalletBalanceInEther = managerWalletBalanceInEtherAfterWithdrawingPayments - managerWalletBalanceInEtherBeforeWithdrawingPayments;
            console.log("manager withdrawn payment amount (in Ether): ", diffInManagerWalletBalanceInEther);
    
            var expectedAmountFee = paymentInWei.mul(calculatePercentageContributionFormatted(investmentDetails.commissionFee)).div(precision).div(10);
            var expectedAmountFeeInEther = ethers.utils.formatEther(expectedAmountFee);
            console.log("expected fee in ether: ", expectedAmountFeeInEther);
    
            assert.closeTo(parseFloat(diffInManagerWalletBalanceInEther), 
            parseFloat(expectedAmountFeeInEther), 
            0.01,
            "because the manager should recieve a fee from the payment")
    
            //check that investment contract now has no funds (since investment funds were withdrawn and all payments were withdrawn)
             const contractBalanceInEther = await getEtherBalanceOfAddress(investmentInstance.address);
             console.log("contract balance: ", parseFloat(contractBalanceInEther));
             assert.closeTo(parseFloat(contractBalanceInEther), 0.00, 0.0001,
                 "The contract balance should be zero since all investments and payments have been withdrawn");
        });
    
    });
});

(shouldRunInvestmentRankingTests ? describe : describe.skip)('Investment Ranking Contract', () =>{
    contract("Investment Ranking", accounts => {
        managerAccountAddress = accounts[0];
        investorOne = accounts[1];
        investorTwo = accounts[2];
        investorThree = accounts[3];
        renterOne = accounts[4];
    
        beforeEach(async () => {
            investmentRankingInstance = await InvestmentRanking.new();
            investmentFactoryInstance = await InvestmentFactory.new(investmentRankingInstance.address);
        });
    
        it('should reflect the correct investment ranking contract address', async () =>{
            //create investment and wait for transaction
            const createTransaction =   await createInvestment();
            await mineTx(createTransaction);
    
            //get investment ranking contract address
            const investmentRankingContractAddress = await investmentFactoryInstance.investmentRankingContract();
    
            //assert investment details
            assert.equal(investmentRankingContractAddress, investmentRankingInstance.address, "Should set the correct contract address upon contract creation");
        });
    
        it('should update the contract address', async () => {
            const createTransaction =   await createInvestment();
            await mineTx(createTransaction);
    
            //update contract address
            let newAddress = "0xd115bffabbdd893a6f7cea402e7338643ced44a6";
    
            await investmentFactoryInstance.updateInvestmentRankingContractAddress(ethers.utils.getAddress(newAddress));
    
            const investmentRankingContractAddress = await investmentFactoryInstance.investmentRankingContract();
    
            //assert investment details
            assert.equal(investmentRankingContractAddress.toUpperCase(), newAddress.toUpperCase(), "Should update contract address");
        });
    
        it('should only let manager update contract address', async() => {
            const createTransaction =   await createInvestment();
            await mineTx(createTransaction);
    
            //update contract address
            let newAddress = "0xd115bffabbdd893a6f7cea402e7338643ced44a6";
    
            await truffleAssert.reverts(
                investmentFactoryInstance
                    .updateInvestmentRankingContractAddress(ethers.utils.getAddress(newAddress), {from: accounts[1]}),
                     "only owner"
            );
        });
    
        it('should set the correct defaults when creating InvestmentRanking contract', async () => {
            const a = (await investmentRankingInstance._a()).toNumber();
            const b = (await investmentRankingInstance._b()).toNumber();
            const c = (await investmentRankingInstance._c()).toNumber();
    
            assert.equal(a, investmentRankingDefaultParameters.a, 'a-coefficient should be set on contract creation');
            assert.equal(b, investmentRankingDefaultParameters.b, 'b-coefficient should be set on contract creation');
            assert.equal(c, investmentRankingDefaultParameters.c, 'c-coefficient should be set on contract creation');
        });
    
        function calculateTotalEthAllowed(investorRank){
            var a = Math.imul(investmentRankingDefaultParameters.a, Math.pow(investorRank, 2));
            var b = Math.imul(investmentRankingDefaultParameters.b, investorRank);
            var allowedEth =  a - b + investmentRankingDefaultParameters.c;
            return allowedEth;
        }
    
        it('should calculate the correct maximum investment ether cap based on rank', async () => {
            const investorRanks = _.range(1, 6);
    
            //assert allowed investment based on rank is calculated correctly
            await Promise.all(investorRanks.map(async (investorRank) => {
                const allowedEtherInvestment = web3.utils.fromWei(await investmentRankingInstance.calculateTotalWeiAllowed(investorRank), 'ether');
        
                const correctAllowedEth = calculateTotalEthAllowed(investorRank);
        
                assert.equal(allowedEtherInvestment, correctAllowedEth, 'calculated ether should be cap should be correct');
            }));
        });
    
        it('should add investment to InvestmentManager summary', async() => {
            //create investment
            const createTransaction =   await createInvestment();
            await mineTx(createTransaction);
    
            //check that investment gets created
            const deployedInvestments = await investmentFactoryInstance.getDeployedInvestments();
    
            const rawInvestmentManagerDetails = await investmentRankingInstance.getInvestmentManager(managerAccountAddress);
            var investmentManagerDetails = createInvestmentManagerObject(rawInvestmentManagerDetails);
    
            //assert investment details
            assert.isNotEmpty(investmentManagerDetails.investmentAddresses);
            assert.equal(investmentManagerDetails.rank, 1, "New investor should have a rank of 1");
        });
    
        it('should contain two investments to InvestmentManager summary after creating two investments', async() => {
            var createTransaction = await createInvestment();
            await mineTx(createTransaction);
            createTransaction = await createInvestment();
            await mineTx(createTransaction);
    
            const rawInvestmentManagerDetails = await investmentRankingInstance.getInvestmentManager(managerAccountAddress);
            var investmentManagerDetails = createInvestmentManagerObject(rawInvestmentManagerDetails);
    
            //assert investment details
            assert.equal(investmentManagerDetails.investmentAddresses.length, 2, 'it should contain two investment contract addresses');
            assert.equal(investmentManagerDetails.rank, 1, "New investor should have a rank of 1");
        });
    
        it('should restrict (revert) investment manager from creating investments based on their ranking', async () => {
            await truffleAssert.reverts(
                createInvestment("100"),
                     "investment cost exceeds ranking cap"
            );
        });
    
        it('should calculate the correct total payment across one InvestmentManagers investment', async () => {
            //setup investment with completed investment
            const initialInvestmentEther = '10';
            const initialInvestmentWei = ethers.utils.parseEther(initialInvestmentEther);
            // create investment contract
            await createInvestment();
    
            //assign invesmentInstance
            const deployedInvestments = await investmentFactoryInstance.getDeployedInvestments();
            const investmentInstance = await createInvestmentInstance(deployedInvestments[0]);
    
            //invest complete investment amount
            await investmentInstance.invest({value: initialInvestmentWei});
    
            //send payment of 1 ETH into investment contract
            const paymentInWei = ethers.utils.parseEther('1');
            var paymentTxn = await investmentInstance.pay({from: renterOne, value: paymentInWei});
            await mineTx(paymentTxn);
    
            //check that totalPayment has been updated
            const investmentTotalPayment = await investmentInstance._totalPayments();
            const totalPayments = await investmentRankingInstance.calculateInvestmentManagersTotalPayments(managerAccountAddress);
    
            //assert that money has been received in contract
            assert.equal(investmentTotalPayment.toString(), totalPayments.toString(), 
                "Payment amount should be equal to total payment in investment");
        });
    
        it('should return true when rank upgrade is available', async () => {
            //setup investment with completed investment
            const initialInvestmentEther = '10';
            const initialInvestmentWei = ethers.utils.parseEther(initialInvestmentEther);
            // create investment contract
            await createInvestment();
    
            //assign invesmentInstance
            const deployedInvestments = await investmentFactoryInstance.getDeployedInvestments();
            const investmentInstance = await createInvestmentInstance(deployedInvestments[0]);
    
            //invest complete investment amount
            await investmentInstance.invest({value: initialInvestmentWei});
    
            //send payment of 1 ETH into investment contract
            const paymentInWei = ethers.utils.parseEther('15');
            var paymentTxn = await investmentInstance.pay({from: renterOne, value: paymentInWei});
            await mineTx(paymentTxn);
    
            const rankUpgradeAvailable = await investmentRankingInstance.isRankUpgradeAvailable(managerAccountAddress);
    
            //rank upgrade should be available
            assert.equal(rankUpgradeAvailable, true, 'a rank upgrade should be available');
        });
    
        it('should return false when rank upgrade is not available', async () => {
            //setup investment with completed investment
            const initialInvestmentEther = '10';
            const initialInvestmentWei = ethers.utils.parseEther(initialInvestmentEther);
            // create investment contract
            await createInvestment();
    
            //assign invesmentInstance
            const deployedInvestments = await investmentFactoryInstance.getDeployedInvestments();
            const investmentInstance = await createInvestmentInstance(deployedInvestments[0]);
    
            //invest complete investment amount
            await investmentInstance.invest({value: initialInvestmentWei});
    
            //send payment of 1 ETH into investment contract
            const paymentInWei = ethers.utils.parseEther('1');
            var paymentTxn = await investmentInstance.pay({from: renterOne, value: paymentInWei});
            await mineTx(paymentTxn);
    
            const rankUpgradeAvailable = await investmentRankingInstance.isRankUpgradeAvailable(managerAccountAddress);
    
            //rank upgrade should be available
            assert.equal(rankUpgradeAvailable, false, 'a rank upgrade should not be available');
        });
    
        it('should upgrade rank when enough payments have been received', async () => {
            //setup investment with completed investment
            const initialInvestmentEther = '10';
            const initialInvestmentWei = ethers.utils.parseEther(initialInvestmentEther);
            // create investment contract
            await createInvestment();
    
            //assign invesmentInstance
            const deployedInvestments = await investmentFactoryInstance.getDeployedInvestments();
            const investmentInstance = await createInvestmentInstance(deployedInvestments[0]);
    
            //invest complete investment amount
            await investmentInstance.invest({value: initialInvestmentWei});
    
            //send payment of 1 ETH into investment contract
            const paymentInWei = ethers.utils.parseEther('15');
            var paymentTxn = await investmentInstance.pay({from: renterOne, value: paymentInWei});
            await mineTx(paymentTxn);
    
            const rankUpgradeTxn = await investmentRankingInstance.upgradeRankAndPaymentsTotal(managerAccountAddress);
            await mineTx(rankUpgradeTxn);
    
            const rawInvestmentManagerDetails = await investmentRankingInstance.getInvestmentManager(managerAccountAddress);
            var investmentManagerDetails = createInvestmentManagerObject(rawInvestmentManagerDetails);
    
            //rank should be upgraded
            assert.equal(investmentManagerDetails.rank, 2, 'rank should be upgraded to 2');
       });
    });
});

(shouldRunTimeTravelTests ? describe : describe.skip)('Investment Contract (Time-Travel Tests)', () => {
    contract("Investment (Time-Travel)", accounts => {
        managerAccountAddress = accounts[0];
        investorOne = accounts[1];
        investorTwo = accounts[2];
        investorThree = accounts[3];
        renterOne = accounts[4];

        beforeEach(async () => {
            investmentRankingInstance = await InvestmentRanking.new();
            investmentFactoryInstance = await InvestmentFactory.new(investmentRankingInstance.address);
        });

        it('should set investment status to 2 (INVESTMENT FAILED) if deadline expires', async() => {
            //create invesment
            await createInvestment();

            //assign invesmentInstance
            const deployedInvestments = await investmentFactoryInstance.getDeployedInvestments();
            const investmentInstance = await createInvestmentInstance(deployedInvestments[0]);

            //fast forward time
            setGanacheToFutureDate();

            await investmentInstance.checkContractStatus();
            const investmentSummary = createInvestmentSummaryObject(await investmentInstance.getInvestmentSummary());

            //check investmentStatus
            assert.equal(investmentSummary.investmentStatus, INVESTMENTSTATUS_FAILED, "Investment should be in FAILED status because it expired");
        });

        it('should refund investors investment if the investment has failed (deadline expired)', async() => {
            const initialInvestmentEther = '1.5';
            const initialInvestmentWei = ethers.utils.parseEther(initialInvestmentEther);
            // create investment contract
            await createInvestment();

            //assign invesmentInstance
            const deployedInvestments = await investmentFactoryInstance.getDeployedInvestments();
            const investmentInstance = await createInvestmentInstance(deployedInvestments[0]);

            //initial balance
            const walletBalanceInEtherBeforeInvestment = await getEtherBalanceOfAddress(managerAccountAddress);

            //fast forward time
            await setGanacheToFutureDate();

            //first investment
            await investmentInstance.invest({value: initialInvestmentWei});
            //balance after investment
            const walletBalanceInEtherAfterInvestment = await getEtherBalanceOfAddress(managerAccountAddress);
            //difference in balance
            const diffInWalletBalanceInEther = walletBalanceInEtherBeforeInvestment - walletBalanceInEtherAfterInvestment;

            //assert that only the gas cost is lost, since the investment must be refunded
            assert.isBelow(parseFloat(diffInWalletBalanceInEther), 1, "investment contribution should be refunded");

            //totalInvestmentContribution should be 0 since the investment failed
            const investmentSummary = createInvestmentSummaryObject(await investmentInstance.getInvestmentSummary());
            assert.equal(investmentSummary.totalInvestmentContributed.toString(), 0,
                "the total investment should be zero since the investment was unsuccessful");

            //assert number of investors is zero
            assert.equal(investmentSummary.investorCount, 0, "there should be no investors since the investment failed");
        });

        it('should let investor withdraw investment if the investment is in status (FAILED)', async () => {
            const initialInvestmentEther = '1.5';
            const initialInvestmentWei = ethers.utils.parseEther(initialInvestmentEther);
            // create investment contract
            await createInvestment();

            //assign invesmentInstance
            const deployedInvestments = await investmentFactoryInstance.getDeployedInvestments();
            const investmentInstance = await createInvestmentInstance(deployedInvestments[0]);

            //initial balance
            const walletBalanceInEtherBeforeInvestment = await getEtherBalanceOfAddress(managerAccountAddress);

            //first investment
            await investmentInstance.invest({value: initialInvestmentWei});

            //fast forward blockchain
            setGanacheToFutureDate();

            //withdraw investment
            await investmentInstance.withdrawInvestment();

            //balance after investment
            const walletBalanceInEtherAfterInvestment = await getEtherBalanceOfAddress(managerAccountAddress);

            //difference in balance
            const diffInWalletBalanceInEther = walletBalanceInEtherBeforeInvestment - walletBalanceInEtherAfterInvestment;

            //assert that only the gas cost is lost, since the investment must be refunded
            assert.isBelow(parseFloat(diffInWalletBalanceInEther), 1, "investment contribution should be withdrawn");
        });

        it('should not let someone who did not invest, withdraw investment', async() => {
            // create investment contract
            await createInvestment();

            //assign invesmentInstance
            const deployedInvestments = await investmentFactoryInstance.getDeployedInvestments();
            const investmentInstance = await createInvestmentInstance(deployedInvestments[0]);

            //initial balance
            const walletBalanceBeforeInEtherInvestment = await getEtherBalanceOfAddress(managerAccountAddress);

            //time elapses and now the investment is FAILED
            setGanacheToFutureDate();

            //withdraw investment
            await investmentInstance.withdrawInvestment();
    
            //balance after investment
            const walletBalanceInEtherAfterInvestment = await getEtherBalanceOfAddress(managerAccountAddress);
    
            //difference in balance
            const diffInWalletBalanceInEther = walletBalanceBeforeInEtherInvestment -  walletBalanceInEtherAfterInvestment;
    
            //assert that only the gas cost is lost, since the investment must be refunded
            assert.isBelow(parseFloat(diffInWalletBalanceInEther), 1, "investment contribution should not be withdrawn, since person did not invest");
        });

    });

});


