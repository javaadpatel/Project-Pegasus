import {combineReducers} from 'redux';
import {reducer as formReducer} from 'redux-form';
import investmentReducer from './investmentReducer';
import investmentManagerReducer from './investmentRankingReducer';
import investmentContributionReducer from './investmentContributionReducer';
import investmentPaymentsReducer from './investPaymentsReducer';
import loadingReducer from './loadingReducer';
import errorReducer from './errorReducer';
import authReducer from './authReducer';
import ethProviderReducer from  './ethProviderReducer';

export default combineReducers({
    auth: authReducer,
    form: formReducer,
    investments: investmentReducer,
    investmentManagerDetails: investmentManagerReducer,
    investmentContributions: investmentContributionReducer,
    payments: investmentPaymentsReducer,
    loading: loadingReducer,
    ethProvider: ethProviderReducer,
    errors: errorReducer
});