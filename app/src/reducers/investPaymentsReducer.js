import {
    MAKE_PAYMENT,
    FETCH_ALLPAYMENTS,
    WITHDRAW_PAYMENTS
} from '../actions/types';

export default (state = {}, action) => {
    switch(action.type){
        case MAKE_PAYMENT:
            var contractAddress = Object.keys(action.payload)[0];
            var payments = Object.values(action.payload)[0];
            return {...state ,  [contractAddress]: payments};
        case FETCH_ALLPAYMENTS:
            contractAddress = Object.keys(action.payload)[0];
            payments = Object.values(action.payload)[0];
            return {...state, [contractAddress]: payments};
        case WITHDRAW_PAYMENTS: 
            return {...state};
        default:
            return state;
    }
}