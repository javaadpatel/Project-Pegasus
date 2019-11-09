import React from 'react';
import {connect} from 'react-redux';
import {Button} from 'semantic-ui-react';
import {createLoadingSelector, createErrorMessageSelector} from '../../../selectors';
import {upgradeInvestmentManagerRanking} from '../../../actions';
import {UPGRADE_INVESTMENTMANAGER_RANKING} from '../../../actions/types';

class UpgradeRankButton extends React.Component {

    handleRankingUpgrade = () => {
        this.props.upgradeInvestmentManagerRanking(this.props.manager.uPortAddress);
    }

    render(){
        return(
            <Button 
                floated={this.props.floated} 
                disabled={this.props.disabled} 
                primary 
                fluid
                onClick={this.handleRankingUpgrade}
                loading={this.props.isFetching}>
                Upgrade Rank
            </Button>
        )
    }
}

const loadingSelector = createLoadingSelector([UPGRADE_INVESTMENTMANAGER_RANKING]);
const errorSelector = createErrorMessageSelector([UPGRADE_INVESTMENTMANAGER_RANKING]);
const mapStateToProps = (state) => {
    return {
        manager: state.auth.user,
        isFetching: loadingSelector(state),
        error: errorSelector(state)
    }
}


export default connect(mapStateToProps, {
    upgradeInvestmentManagerRanking
})(UpgradeRankButton);
