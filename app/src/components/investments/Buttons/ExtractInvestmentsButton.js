import React from 'react';
import {connect} from 'react-redux';
import {Button} from 'semantic-ui-react';
import {createLoadingSelector, createErrorMessageSelector} from '../../../selectors';
import {extractInvestments} from '../../../actions';
import {EXTRACT_INVESTMENTS} from '../../../actions/types';

class ExtractInvestmentsButton extends React.Component{
    handleExtractInvestments = () => {
        this.props.extractInvestments(this.props.investmentContractAddress);
    };

    render() {
        return(
            <Button compact fluid
                onClick={this.handleExtractInvestments}
                loading={this.props.isFetching} 
                color='violet'
                >
                    Extract Investments
            </Button>
        )
    }
}

const loadingSelector = createLoadingSelector([EXTRACT_INVESTMENTS]);
const errorSelector = createErrorMessageSelector([EXTRACT_INVESTMENTS]);
const mapStateToProps = (state) => {
    return {
        isFetching: loadingSelector(state),
        error: errorSelector(state)
    }
}


export default connect(mapStateToProps, {
    extractInvestments
})(ExtractInvestmentsButton);