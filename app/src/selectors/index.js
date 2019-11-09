import _ from 'lodash';

export const createLoadingSelector = (actions) => (state) => {
    //returns true only when all actions is not loading
    var isLoading =  _(actions).some((action) => {
        return _.get(state, `loading.${action}`)
    })
    
    return isLoading;
}

export const createErrorMessageSelector = (actions) => (state) => {
    // returns the first error messages for actions
    // * We assume when any request fails on a page that
    // requires multiple API calls, we show the first error
    return _(actions)
        .map((action) => _.get(state, `errors.${action}`))
        .compact()
        .first() || '';
}