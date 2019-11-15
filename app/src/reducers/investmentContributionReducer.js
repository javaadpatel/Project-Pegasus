import  {
    FETCH_INVESTMENTCONTRIBUTIONSUMMARY,
} from '../actions/types';

export default (state = {}, action) => {
    switch(action.type){
        case FETCH_INVESTMENTCONTRIBUTIONSUMMARY:
            return {...state, [action.payload.investmentContractAddress]: action.payload};
        default:
            return state;
    }
}