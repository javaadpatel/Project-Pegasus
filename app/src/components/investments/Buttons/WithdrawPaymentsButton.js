import React from 'react';
import {connect} from 'react-redux';
import {Button} from 'semantic-ui-react';
import {createLoadingSelector, createErrorMessageSelector} from '../../../selectors';
import {withdrawPayments} from '../../../actions';
import {WITHDRAW_PAYMENTS} from '../../../actions/types';

class WithdrawPaymentsButton extends React.Component{

    handleWithdrawPayments = () => {
        this.props.withdrawPayments(this.props.investmentContractAddress);
    }

    render(){
        return(
            <Button compact fluid primary 
                onClick={this.handleWithdrawPayments} 
                loading={this.props.isFetching}>
                Withdraw Payments
            </Button>
        )
    }
}

const loadingSelector = createLoadingSelector([WITHDRAW_PAYMENTS]);
const errorSelector = createErrorMessageSelector([WITHDRAW_PAYMENTS]);
const mapStateToProps = (state) => {
    return {
        isFetching: loadingSelector(state),
        error: errorSelector(state)
    }
}


export default connect(mapStateToProps, {
    withdrawPayments
})(WithdrawPaymentsButton);

