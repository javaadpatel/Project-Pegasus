const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
const ETHERSCAN_API_KEY = process.env.REACT_APP_ETHERSCAN_API_KEY;

export const ropstenProviderUrl = `https://ropsten.infura.io/${INFURA_API_KEY}`;

export const investmentFactoryContractAddress =  '0x5b88200CfDEf1508F39de1b622A3820c745026cc';//'0x64134384DCcAF62CDeCF1CD43790E44Efe9Fd635';
export const investmentRankingContractAddress = '0x15357efBD90aa7AE25098D6e878E1b1c6018dD47';//'0x1B4209E607d03B831895671a29b6d2db5e709d2e';

export const etherScanApiKey = `${ETHERSCAN_API_KEY}`;

 //create openlaw config object
export const openLawConfig = {
  server: "https://app.openlaw.io",
  templateName: process.env.REACT_APP_OPENLAW_CONTRACT_TEMPLATE_NAME || "Project Pegasus - Investment Manager Withdrawal Contract",
  userName: process.env.REACT_APP_OPENLAW_USERNAME,
  password: process.env.REACT_APP_OPENLAW_PASSWORD,
  creatorId: process.env.REACT_APP_OPENLAW_CREATORID
}