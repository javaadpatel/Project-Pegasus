import { FETCH_ETH_PROVIDER_ERROR, FETCH_ETH_PROVIDER_SUCCESS } from '../actions/types';

const initialState = {
  selectedAddress: '',
  networkVersion: ''
};

export default (state = initialState, { type, payload }) => {
    switch (type) {
        case FETCH_ETH_PROVIDER_SUCCESS:
            return { ...state, ...payload };
        case FETCH_ETH_PROVIDER_ERROR:
            return { ...state, error: true };
        default:
            return state;
    }
};