pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;
import "./SafeMath.sol";

interface InvestmentRankingInterface {
    function createInvestmentManagerIfNotExists (address investmentManagerAddress, address proxyContractAddress) external;
    function saveInvestment(address investmentAddress, address investmentManagerAddress) external;
    function isInvestmentAllowed(address investmentManagerAddress, uint256 investmentCost) external returns(bool);
    function getInvestmentManagerRanking(address investmentManagerAddress) external returns (uint8);
    function getProxyContractsOfAddress (address investmentManagerAddress) external returns (address[] memory);
}

contract InvestmentFactory {
    address public _manager;                        //creator of the investment factory
    event InvestmentCreated (address indexed managerAddress, address indexed investmentContractAddress);
    Investment[] public deployedInvestments;
    InvestmentRankingInterface public investmentRankingContract;
    address public _investmentRankingContractAddress;

    modifier onlyManager() {
        require(msg.sender == _manager, "only owner");
        _;
    }

    constructor(address investmentRankingContractAddress) public{
        investmentRankingContract = InvestmentRankingInterface(investmentRankingContractAddress);
        _investmentRankingContractAddress = investmentRankingContractAddress;
        _manager = msg.sender;
    }

    function updateInvestmentRankingContractAddress (address contractAddress) external onlyManager() {
        investmentRankingContract = InvestmentRankingInterface(contractAddress);
        _investmentRankingContractAddress = contractAddress;
    }

    function createInvestment(address manager, uint256 totalInvestmentCost, string memory investmentTitle, string memory investmentRationale,
        uint256 createdAt, uint256 investmentDeadlineTimestamp, uint256 commissionFee) public{

        //create this investment manager if they do not exist
        //msg.sender corresponds to the proxy contract using uPort
        investmentRankingContract.createInvestmentManagerIfNotExists(manager, msg.sender);

        //check that investment manager is allowed to create this investment based on their ranking
        require(investmentRankingContract.isInvestmentAllowed(manager, totalInvestmentCost) == true, "investment cost exceeds ranking cap");

        //get manager's ranking
        uint8 managerRanking = investmentRankingContract.getInvestmentManagerRanking(manager);
        
        Investment newInvestment = new Investment(
            manager,
            totalInvestmentCost,
            investmentTitle,
            investmentRationale,
            createdAt,
            investmentDeadlineTimestamp,
            commissionFee,
            managerRanking,
            _investmentRankingContractAddress
        );

        //store investment
        deployedInvestments.push(newInvestment);
        //emit event
        emit InvestmentCreated(manager, address(newInvestment));

        //update investmentManagers details in ranking contract
        investmentRankingContract.saveInvestment(address(newInvestment), manager);
    }

    function contractBalance() public view returns(uint256){
        return address(this).balance;
    }

    function getBlockTimestamp() public view returns (uint){
        return block.timestamp;
    }

    function getDeployedInvestments() public view returns (Investment[] memory){
        return deployedInvestments;
    }
}

contract Investment {
    using SafeMath for uint256;
    
    address public _manager;                        //creator of the investment
    uint8 public _managerRanking;                   //investment ranking of the creator of the investment
    mapping(address => uint256) public _investments;//mapping of all the addresses that have invested and their investment amounts
    mapping(address => uint256) public _percentageShares; //mapping of all the percentages that investors are entitled to based on their investment contribution
    uint256 public _totalInvestmentCost;            //investment goal to be funded
    uint256 public _totalInvestmentContributed;     //total investment amount contributed
    string public _investmentTitle;                 //investment title
    string public _investmentRationale;             //investment rationale
    string public _openLawContract = "";             //OpenLaw contract
    bool private _openLawContractSignedViaTransaction = false; //indicates that manager has signed the openlaw contract using metamask/uport (marked private so that only internal calls can alter value)
    uint256 public _commissionFee;                  //fee charged by investment creator
    uint8   public _investorCount;                  //number of investors
    uint    public _createdAt;                      //unix timestamp indicating Investment creation
    uint    public _investmentDeadlineTimestamp;    //deadline for funding this investment
    uint256 public _precision = 10 ** 8;

    enum InvestmentStatus {INPROGRESS, COMPLETED, FAILED}   //status of investment
    InvestmentStatus public _investmentStatus;              //current status of investment

    //keeps track of whether manager has already withdrawn the investments (once investment is in COMPLETED InvestmentStatus state)
    enum InvestmentTransferStatus {INCOMPLETE, COMPLETED}
    InvestmentTransferStatus public _investmentTransferStatus;

    struct Payment {
        uint256 timestamp;
        uint256 amount;
        address payerAddress;
    }
    mapping(address => Payment[]) public _paymentsFromAddress;  //mapping of all payments made to this contract
    Payment[] public _allPayments; //all payments made to this investment contract (regardless of sender)
    uint256 public _totalPayments; //sum of all payments made to this investment contract (regardless of sender)
    mapping (address => uint256) _paymentIndexWithdrawnByAddress; //mapping containing the payments index withdrawn by a particular investor

    InvestmentRankingInterface public _investmentRankingContract; //instance of investment ranking contract

    constructor(address manager, uint256 totalInvestmentCost, string memory investmentTitle, string memory investmentRationale,
        uint256 createdAt, uint256 investmentDeadlineTimestamp, uint256 commissionFee, 
        uint8 managerRanking, address investmentRankingContractAddress) public payable{
        _manager = manager;
        _totalInvestmentCost = totalInvestmentCost;
        _investmentTitle = investmentTitle;
        _investmentRationale = investmentRationale;
        _createdAt = createdAt;
        _investmentDeadlineTimestamp = investmentDeadlineTimestamp;
        _investmentStatus = InvestmentStatus.INPROGRESS;
        _investmentTransferStatus = InvestmentTransferStatus.INCOMPLETE;
        _commissionFee = commissionFee;
        _managerRanking = managerRanking;

        _investmentRankingContract = InvestmentRankingInterface(investmentRankingContractAddress);
    }

    modifier onlyManager() {
        require(msg.sender == _manager, "only owner");
        _;
    }

    function invest() external payable {

        //check the status of the contract, investments are only allowed into investments which are still in progress
        checkContractStatus();
        if (_investmentStatus == InvestmentStatus.FAILED || _investmentStatus == InvestmentStatus.COMPLETED){
            msg.sender.transfer(msg.value);
            return;
        }

        //increment the number of investors, only if its a new investor
        if (_investments[msg.sender] == 0) {
            _investorCount++;
        }
       
        //ensure that investors cannot overinvest (precaution)
        uint256 currentInvestmentContribution = msg.value;
        uint256 totalInvestmentWithCurrentContribution = _totalInvestmentContributed + currentInvestmentContribution;
        if (totalInvestmentWithCurrentContribution > _totalInvestmentCost) {
            uint256 refund = totalInvestmentWithCurrentContribution - _totalInvestmentCost;
            msg.sender.transfer(refund);
            currentInvestmentContribution = currentInvestmentContribution - refund;
        }

        //record the investors investment
        _investments[msg.sender] = _investments[msg.sender] + currentInvestmentContribution;

        //calculate percentage share
        calculatePercentageShare(_investments[msg.sender]);

        //update total investment made
        _totalInvestmentContributed += currentInvestmentContribution;

        //mark investment as completed if totalInvestmentCost has been contributed
        if(_totalInvestmentContributed >= _totalInvestmentCost){
            _investmentStatus = InvestmentStatus.COMPLETED;
        }
    }

    function hashCompareWithLengthCheck(string memory a, string memory b) internal pure returns (bool) {
        if(bytes(a).length != bytes(b).length) {
            return false;
        } else {
            return keccak256(bytes(a)) == keccak256(bytes(b));
        }
    }

    function getOpenLawContractSignedViaTransaction() public view returns(bool) {
        return _openLawContractSignedViaTransaction;
    }

    function signOpenLawContract(string memory openLawContract) public {
        //check that contract hasn't already been signed, security against changing agreement
        require(_openLawContractSignedViaTransaction == false, "open law contract already signed");

        //assert that contract being signed is the exact contract assigned to this contract at creation time
        // require(hashCompareWithLengthCheck(_openLawContractHash, openLawContractHash), "incorrect openlaw contract being signed");

        //get manager's proxy contracts
        address[] memory proxyContracts = _investmentRankingContract.getProxyContractsOfAddress(_manager);

        //there should not be a significant amount of proxy contracts (if this changes, then consider a mapping rather)
        bool isProxyContract = false;
        for(uint i = 0; i < proxyContracts.length; i++){
            if (proxyContracts[i] == msg.sender){
                isProxyContract = true;
            }
        }
        require(isProxyContract, "error: must be proxy contract");

        //set contract signed
        _openLawContract = openLawContract;
        _openLawContractSignedViaTransaction = true;
    }

    function transferInvestmentContributions() external {
        //check that the manager has signed an openlaw contract
        require(_openLawContractSignedViaTransaction, "openlaw contract must be signed before releasing funds");

        //check that investment is complete and that transfer has not already been done before allowing manager to withdraw funds
        checkContractStatus();

        if (_investmentStatus != InvestmentStatus.COMPLETED || _investmentTransferStatus == InvestmentTransferStatus.COMPLETED){
            return;
        }

        //get manager's proxy contracts
        address[] memory proxyContracts = _investmentRankingContract.getProxyContractsOfAddress(_manager);

        //there should not be a significant amount of proxy contracts (if this changes, then consider a mapping rather)
        bool isProxyContract = false;
        for(uint i = 0; i < proxyContracts.length; i++){
            if (proxyContracts[i] == msg.sender){
                isProxyContract = true;
            }
        }
        require(isProxyContract, "error: must be proxy contract");

        //transfer investment contributions to manager
        msg.sender.transfer(_totalInvestmentCost);

        //set InvestmentTransferStatus to COMPLETED
        _investmentTransferStatus = InvestmentTransferStatus.COMPLETED;
    }

    function pay() external payable {
        //check the status of the contract, payments are only allowed if invesment is completely funded (COMPLETED)
        checkContractStatus();
        if (_investmentStatus != InvestmentStatus.COMPLETED){
            msg.sender.transfer(msg.value);
            return;
        }

        //create payment record
        Payment memory payment = Payment(block.timestamp, msg.value, msg.sender);
        _paymentsFromAddress[msg.sender].push(payment);
        _allPayments.push(payment);
        _totalPayments = _totalPayments.add(msg.value);
    }

    function getPaymentRecords(address payerAddress) public view returns (Payment[] memory) {
        return _paymentsFromAddress[payerAddress];
    }

    function getAllPaymentRecords() public view returns (Payment[] memory){
        return _allPayments;
    }

    function calculatePercentageShare(uint256 contribution) internal {
        uint numerator = contribution.mul(_precision);
        uint temp = numerator.div(_totalInvestmentCost).add(5); // proper rounding up
        _percentageShares[msg.sender] = temp.div(10);
    }    

    function calculatePercentage(uint percentage) internal view returns (uint256) {
        return percentage.mul(_precision).div(10 ** 4);
    }

    function withdrawPayments () external {
        //ensure that caller is actually an investor
        if (_investments[msg.sender] == 0){
            return;
        }
        
        //get contributer's percentage share
        uint256 percentageShare = _percentageShares[msg.sender];

        //get payment index
        uint256 paymentIndex = _paymentIndexWithdrawnByAddress[msg.sender];

        //loop through payments not yet withdrawn and calculate amount owed to investor (after fee's)
        uint256 numberOfPayments = _allPayments.length;

        //assert that there are payments to withdraw
        if (paymentIndex >= numberOfPayments){
            return;
        }

        uint totalPaymentShare = 0;
        for(uint i = paymentIndex; i < numberOfPayments; i++){
            //calculate percentage
            uint paymentAmount = _allPayments[i].amount;
            //manager fee 10% => 10 000 00
            uint oneHundredPercent = calculatePercentage(100);
            uint managerFee = calculatePercentage(_commissionFee);
            uint feePercentage = oneHundredPercent.sub(managerFee);
            
            uint baseAmountSubtractingFees = paymentAmount.mul(feePercentage).div(10 ** 7);
            uint paymentShare = baseAmountSubtractingFees.mul(percentageShare).div(10 ** 7);
            totalPaymentShare += paymentShare.mul(10 ** 1);
            paymentIndex++;
        }
        //update payments that have been withdrawn for this address
        _paymentIndexWithdrawnByAddress[msg.sender] = paymentIndex;

        //transfer money
        msg.sender.transfer(totalPaymentShare);
    }

    function withdrawPaymentsAsManager () external onlyManager(){
         //get payment index
        uint256 paymentIndex = _paymentIndexWithdrawnByAddress[msg.sender];

        //loop through payments not yet withdrawn and calculate amount owed to investor (after fee's)
        uint256 numberOfPayments = _allPayments.length;

        //assert that there are payments to withdraw
        if (paymentIndex >= numberOfPayments){
            return;
        }

        uint totalPaymentShare = 0;
        for(uint i = paymentIndex; i < numberOfPayments; i++){
            //calculate percentage
            uint paymentAmount = _allPayments[i].amount;
            uint managerFee = calculatePercentage(_commissionFee);

            uint paymentShare = paymentAmount.mul(managerFee).div(10 ** 7);
            totalPaymentShare += paymentShare.mul(10 ** 1);
            paymentIndex++;
        }
        //update payments that have been withdrawn for this address
        _paymentIndexWithdrawnByAddress[msg.sender] = paymentIndex;

        //transfer money
        msg.sender.transfer(totalPaymentShare);
    }

    //returns the investment contribution of an address
    function getInvestmentContribution (address contributerAddress) public view returns (uint256){
        return _investments[contributerAddress];
    }

    //returns the percentage share of this investment associated with the calling address
    function getPercentageShare (address contributerAddress) public view returns (uint256){
        return _percentageShares[contributerAddress];
    }

    function getBlockTimestamp() public view returns (uint){
        return block.timestamp;
    }

    function getInvestmentContributionSummary() public view returns (uint256, uint256) {
        uint256 investmentContribution = _investments[msg.sender];
        uint256 investmentPercentageShare = _percentageShares[msg.sender];
        return (
            investmentContribution,
            investmentPercentageShare
        );
    }

    function checkContractStatus() public {
        if (_investmentStatus != InvestmentStatus.COMPLETED && block.timestamp > _investmentDeadlineTimestamp)
        {
            _investmentStatus = InvestmentStatus.FAILED;
        }
    }

    function withdrawInvestment() external {
        //ensure that caller is actually an investor
        if (_investments[msg.sender] == 0){
            return;
        }

        checkContractStatus();
        if (_investmentStatus == InvestmentStatus.FAILED){
            //transfer money back to investor
            msg.sender.transfer(_investments[msg.sender]);
            //reset investment contribution
            _investments[msg.sender] = 0;
        }
    }

    function getInvestmentSummary() public view returns (address, uint256, string memory, string memory, 
    uint256, uint256, InvestmentStatus, uint256, uint256, uint8, InvestmentTransferStatus, uint8) {

        return (
            _manager,
            _totalInvestmentCost,
            _investmentTitle,
            _investmentRationale,
            _createdAt,
            _investmentDeadlineTimestamp,
            _investmentStatus,
            _commissionFee,
            _totalInvestmentContributed,
            _investorCount,
            _investmentTransferStatus,
            _managerRanking
        );
    }
 
}