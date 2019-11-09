import {ethers} from 'ethers';
import {
    createInvestmentRanking as createInvestmentRankingInstance,
    createUPortInvestmentRanking
} from '../investmentRanking';


const createInvestmentManagerObject = async (managerAddress, rawInvestmentManager) => {
    var managerRank = rawInvestmentManager[2];
    if (managerRank === 0)
        managerRank = 1;
    const allowedInvestmentInEth = await calculateAllowedInvestmentInEthFromContract(managerRank);
    const isRankUpgradeAvailable = await isRankUpgradeAvailableFromContract(managerAddress);
    return {
        managerAddress: managerAddress,
        investmentAddresses: rawInvestmentManager[0],
        totalPaymentsFromInvestments: ethers.utils.formatEther(rawInvestmentManager[1]),
        rank: managerRank,
        allowedInvestmentInEth: allowedInvestmentInEth,
        isRankUpgradeAvailable: isRankUpgradeAvailable
    }
}
const isRankUpgradeAvailableFromContract = async (managerAddress) => {
    const investmentRankingInstance = await createInvestmentRankingInstance();
    return await investmentRankingInstance.isRankUpgradeAvailable(managerAddress);
}

const calculateAllowedInvestmentInEthFromContract = async (rank) => {
    const investmentRankingInstance = await createInvestmentRankingInstance();
    return ethers.utils.formatEther(await investmentRankingInstance.calculateTotalWeiAllowed(rank));
}


export const fetchInvestmentManagerFromContract = async (managerAddress) => {
    const investmentRankingInstance = await createInvestmentRankingInstance();

    //get the user currently browsing, since you have to login with uPort we can get the uPort address here
    const rawInvestmentManager = await investmentRankingInstance.getInvestmentManager(managerAddress);
    const investmentManager = await createInvestmentManagerObject(managerAddress, rawInvestmentManager);

    return investmentManager;
}

export const upgradeRankFromContract = async (managerAddress) => {
    (await createUPortInvestmentRanking())
        .upgradeRankAndPaymentsTotal(
            managerAddress,
        'upgradeRankReq');
}
