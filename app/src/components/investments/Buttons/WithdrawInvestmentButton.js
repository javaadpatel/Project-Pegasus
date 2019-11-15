import React from 'react';
import {connect} from 'react-redux';
import {Button} from 'semantic-ui-react';
import {createLoadingSelector, createErrorMessageSelector} from '../../../selectors';
import {withdrawInvestment} from '../../../actions';
import {WITHDRAW_INVESTMENT} from '../../../actions/types';

class WithdrawInvestmentButton extends React.Component{

    handleWithdrawInvestment = () => {
        this.props.withdrawInvestment(this.props.investmentContractAddress);
    }

    render(){
        return(
            <Button compact negative fluid primary onClick={this.handleWithdrawInvestment} loading={this.props.isFetching}>
                Withdraw Investment
            </Button>
        )
    }
}

const loadingSelector = createLoadingSelector([WITHDRAW_INVESTMENT]);
const errorSelector = createErrorMessageSelector([WITHDRAW_INVESTMENT]);
const mapStateToProps = (state) => {
    return {
        isFetching: loadingSelector(state),
        error: errorSelector(state)
    }
}

export default connect(mapStateToProps, {
    withdrawInvestment
})(WithdrawInvestmentButton);

