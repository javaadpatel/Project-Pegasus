import {
    FETCH_INVESTMENTMANAGER
} from '../actions/types';

export default (state = {}, action) => {
    switch(action.type){
        case FETCH_INVESTMENTMANAGER:
            return {...state, ...action.payload};
        default:
            return state;
    }
}