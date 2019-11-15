export const InvestmentStatusEnum = {
    INPROGRESS : 0, 
    COMPLETED : 1, 
    FAILED : 2,
    properties: {
      1: {name: "In Progress", value: 0, code: "I"},
      2: {name: "Completed", value: 1, code: "C"},
      3: {name: "Failed", value: 2, code: "F"}
    }
};

export const convertInvestmentStatusIntToConstant = (investmentStatus) =>{
    if (investmentStatus === 0)
        return InvestmentStatusEnum.INPROGRESS;
    else if (investmentStatus === 1)
        return InvestmentStatusEnum.COMPLETED;
    else if (investmentStatus === 2)
        return InvestmentStatusEnum.FAILED;
}

export const InvestmentTransferStatusEnum = {
    INCOMPLETE : 0, 
    COMPLETED : 1, 
    properties: {
      1: {name: "InComplete", value: 0, code: "U"},
      2: {name: "Completed", value: 1, code: "C"}
    }
};

export const convertInvestmentTransferStatusIntToConstant = (investmentTransferStatus) =>{
    if (investmentTransferStatus === 0)
        return InvestmentTransferStatusEnum.INCOMPLETE;
    else if (investmentTransferStatus === 1)
        return InvestmentTransferStatusEnum.COMPLETED;
}

/*UPort Credentials*/
export const PegasusInvestments_RegistrationCredential = 'PegasusInvestments_RegistrationCredential';