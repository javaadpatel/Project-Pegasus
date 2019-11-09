import _ from 'lodash';
import  {
    CREATE_INVESTMENT,
    FETCH_INVESTMENTS,
    FETCH_INVESTMENT,
    INVEST,
    WITHDRAW_INVESTMENT,
    EXTRACT_INVESTMENTS
} from '../actions/types';

export default (state = {}, action) => {
    switch(action.type){
        case FETCH_INVESTMENTS:
            return {...state, ..._.mapKeys(action.payload, 'address')};
        case FETCH_INVESTMENT:
            return {...state, [action.payload.address]: action.payload};
        case CREATE_INVESTMENT:
            return {...state, [action.payload.address]: action.payload};
        case INVEST:
            return {...state, [action.payload.address]: action.payload};
        case WITHDRAW_INVESTMENT:
            return {...state, [action.payload.address]: action.payload};
        case EXTRACT_INVESTMENTS:
            return {...state, [action.payload.address]: action.payload};
        default:
            return state;
    }
}