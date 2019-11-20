const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
const ETHERSCAN_API_KEY = process.env.REACT_APP_ETHERSCAN_API_KEY;

export const ropstenProviderUrl = `https://ropsten.infura.io/${INFURA_API_KEY}`;

export const investmentFactoryContractAddress =  '0x256F27B2912BB909F0d4fE38B74C4437829C15F7';
export const investmentRankingContractAddress = '0xB2e0F935d77b6df67ecDB2dcDD71D0F9aED70719';

export const etherScanApiKey = `${ETHERSCAN_API_KEY}`;

 //create openlaw config object
export const openLawConfig = {
  server: "https://app.openlaw.io",
  templateName: process.env.REACT_APP_OPENLAW_CONTRACT_TEMPLATE_NAME || "Project Pegasus - Investment Manager Withdrawal Contract",
  userName: process.env.REACT_APP_OPENLAW_USERNAME,
  password: process.env.REACT_APP_OPENLAW_PASSWORD,
  creatorId: process.env.REACT_APP_OPENLAW_CREATORID
}