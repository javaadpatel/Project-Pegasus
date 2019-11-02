pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;
import "./SafeMath.sol";

interface InvestmentContractInterface {
    function _totalPayments () external view returns (uint256);
}

contract InvestmentRanking {
    using SafeMath for uint256;

    address public _manager; //manager address
    struct InvestmentManager {
        address[] investmentAddresses;      //array of all investments created by this InvestmentManager
        address[] proxyContractAddresses;   //array of all proxy contract addresses used for signing with uPort
        uint256 totalPaymentsFromInvestments; //total of all payments that have been made against investments created by this manager
        uint8     rank;    //InvestmentManager ranking 0-10
    }
    mapping(address => InvestmentManager) public _investmentManagers;   //mapping between address and investment manager details
    address[] private _tempAddressArray;  

    uint256 public _a; //A-coefficient of quadratic function
    uint256 public _b; //B-coefficient of quadratic function
    uint256 public _c; //C-coefficient of quadratic function

    modifier onlyManager() {
        require(msg.sender == _manager);
        _;
    }

    constructor () public
    {
        //seed ranking function constants
        _a = 50000;
        _b = 49990;
        _c = 0;
        //assign manager
        _manager = msg.sender;
    }

    function createInvestmentManagerIfNotExists (address investmentManagerAddress, address proxyContractAddress) external {
        InvestmentManager memory investmentManager = _investmentManagers[investmentManagerAddress];
        if (investmentManager.rank == 0){
            address[] memory _proxyContractTempAddressArray = new address[](1);
            _proxyContractTempAddressArray[0] = proxyContractAddress;
            InvestmentManager memory newInvestmentManager = InvestmentManager(_tempAddressArray,_proxyContractTempAddressArray,  0, 1);
            //assign to storage
            _investmentManagers[investmentManagerAddress] = newInvestmentManager;
        }
    }

    //this function's security is weak, improvement needed here so that addresses don't randomly get assigned to investmentManagers in order to arbitrarily increase their ranking
    function saveInvestment(address investmentAddress, address investmentManagerAddress) external {
        _investmentManagers[investmentManagerAddress].investmentAddresses.push(investmentAddress); 
    }

    function getProxyContractsOfAddress (address investmentManagerAddress) public view returns (address[] memory) {
        InvestmentManager memory investmentManager = _investmentManagers[investmentManagerAddress];
        return (
            investmentManager.proxyContractAddresses
        );
    }

    function getInvestmentManager(address investmentManagerAddress) public view returns(address[] memory, uint256, uint8) {
        InvestmentManager memory investmentManager = _investmentManagers[investmentManagerAddress];
        return (
            investmentManager.investmentAddresses,
            investmentManager.totalPaymentsFromInvestments,
            investmentManager.rank
        );
    } 

    function getInvestmentManagerRanking(address investmentManagerAddress) public view returns (uint8){
        InvestmentManager memory investmentManager = _investmentManagers[investmentManagerAddress];
        return (
            investmentManager.rank
        );
    }

    function setCoefficients(uint256 a, uint256 b, uint256 c) external onlyManager() {
        _a = a;
        _b = b;
        _c = c;
    }

    function calculateTotalWeiAllowed (uint8 rank) public view returns (uint256){
        //investment cost allowed calculated using a quadratic formula (base implementation, needs refining)
        uint256 a = _a.mul(rank).mul(rank);
        uint256 b = _b.mul(rank);
        uint256 totalInvestmentCostAllowedInEth = a.sub(b);

        uint256 weiConstant = 1000000000000000000;
        uint256 totalInvestmentCostInWei = totalInvestmentCostAllowedInEth.mul(weiConstant);
        return totalInvestmentCostInWei;
    }

    function isInvestmentAllowed(address investmentManagerAddress, uint256 investmentCost) public view returns (bool){
        InvestmentManager memory investmentManager = _investmentManagers[investmentManagerAddress];
        uint8 rank = investmentManager.rank;
        uint256 totalCostAllowed = calculateTotalWeiAllowed(rank);

        if (investmentCost <= totalCostAllowed){
            return true;
        }else{
            return false;
        }
    }

    function calculateInvestmentManagersTotalPayments(address investmentManagerAddress) public view returns (uint256) {
        InvestmentManager memory investmentManager = _investmentManagers[investmentManagerAddress];
        uint256 totalPayments = 0;
        for (uint256 i=0; i<investmentManager.investmentAddresses.length; i++) {
            
            InvestmentContractInterface investment =  InvestmentContractInterface(investmentManager.investmentAddresses[i]);

            uint256 investmentTotalPayments = investment._totalPayments();

            totalPayments =  totalPayments.add(investmentTotalPayments);
        }
        return totalPayments;
    }

    function isRankUpgradeAvailable(address investmentManagerAddress) public view returns (bool) {
         InvestmentManager memory investmentManager = _investmentManagers[investmentManagerAddress];

        uint256 totalInvestmentPaymentsReceived = calculateInvestmentManagersTotalPayments(investmentManagerAddress);
        uint256 currentTotalWeiAllowed = calculateTotalWeiAllowed(investmentManager.rank);

        //simple upgrade strategy, if payments received is greater than currentTotalWeiAllowed then true
        if (totalInvestmentPaymentsReceived > currentTotalWeiAllowed){
            return true;
        }else{
            return false;
        }
    }

    function calculateRankBasedOnPayments(uint256 totalPaymentsReceived) public view returns (uint8){
        uint8 rank = 1;
        uint8 maxRank = 5;
        uint256 totalWeiAllowed = 0;

        while(rank < maxRank+1 ){
            totalWeiAllowed = calculateTotalWeiAllowed(rank);
            if (totalWeiAllowed > totalPaymentsReceived){
                break;
            }
            rank++;
        }

        return rank;
    }

    function upgradeRankAndPaymentsTotal(address investmentManagerAddress) public {
        //check if rank upgrade is available
        bool rankUpgradeAvailable = isRankUpgradeAvailable(investmentManagerAddress);
        if (rankUpgradeAvailable){
            uint256 totalInvestmentPaymentsReceived = calculateInvestmentManagersTotalPayments(investmentManagerAddress);
            uint8 newRank = calculateRankBasedOnPayments(totalInvestmentPaymentsReceived); 

            InvestmentManager memory investmentManager = _investmentManagers[investmentManagerAddress];
            investmentManager.totalPaymentsFromInvestments = totalInvestmentPaymentsReceived;
            investmentManager.rank = newRank;
            _investmentManagers[investmentManagerAddress] = investmentManager;
        }
    }
}