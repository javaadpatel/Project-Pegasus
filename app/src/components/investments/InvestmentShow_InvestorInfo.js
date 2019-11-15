import React from 'react';
import {connect} from 'react-redux';
import _ from 'lodash';
import {Statistic, Icon, Segment, Dimmer, Loader, Divider} from 'semantic-ui-react';
import WithdrawInvestmentButton from './Buttons/WithdrawInvestmentButton';
import WithdrawPaymentsButton from './Buttons/WithdrawPaymentsButton';
import ExtractInvestmentsButton from './Buttons/ExtractInvestmentsButton';
import {InvestmentStatusEnum, InvestmentTransferStatusEnum} from  '../../constants';
import InvestmentPaymentForm from './Forms/InvestmentPaymentForm';
import InvestmentForm from './Forms/InvestmentForm';
import {fetchInvestmentContributionSummary} from  '../../actions';

class InvestmentShow_InvestorInfo extends React.Component {

    componentDidMount(){
        const address = this.props.investmentAddress;
        this.props.fetchInvestmentContributionSummary(address);
    }

    renderInvestmentParticipation(){
        console.log(this.props.investmentContribution);
        if (this.props.investmentContribution.amountContributedInEth === "0.0"){
            return(
                <div>
                    You are not an investor.
                </div>
            );
        }

        const {amountContributedInEth, percentageShare} = this.props.investmentContribution;
        return(
            <div>
                <h4>Your investment Contribution:</h4>
                 <Statistic.Group>
                    <Statistic size='tiny'>
                    <Statistic.Value>
                        <Icon size='tiny' name='dollar sign'/>{amountContributedInEth}
                    </Statistic.Value>
                    <Statistic.Label>Invested <br/> (ETH)</Statistic.Label>
                    </Statistic>

                    <Statistic size='tiny'>
                    <Statistic.Value>
                        <Icon name='percent' size='tiny'/>
                        {percentageShare}
                    </Statistic.Value>
                    <Statistic.Label>Return</Statistic.Label>
                    </Statistic>

                </Statistic.Group>
            </div>
        );
    };

    renderActions(){
        return(
            this.renderInvest() ||
            this.renderWithdraw() ||
            this.renderPayments()
        )
    }

    renderWithdraw(){
        if(this.props.investment.investmentStatus === InvestmentStatusEnum.FAILED){
            return(
                <WithdrawInvestmentButton investmentContractAddress={this.investmentAddress} />
            )
        }
    }

    renderPayments(){
        if(this.props.investment.investmentStatus === InvestmentStatusEnum.COMPLETED){
            return(
                <div>
                    {this.renderPaymentButtons()}
                </div>
            )
        }
    }

    renderPaymentButtons(){
        return (
            <>
                {this.renderTranferButton()}
                <InvestmentPaymentForm investmentContractAddress={this.props.investmentAddress} />
                <Divider horizontal>OR</Divider>
                <WithdrawPaymentsButton investmentContractAddress={this.props.investmentAddress} />
            </>
        )
    }

    renderTranferButton(){
        var uPortAddress = _.get(this.props.manager, 'user.uPortAddress');
        const {managerAddress, investmentTransferStatus} = this.props.investment;
        if (investmentTransferStatus === InvestmentTransferStatusEnum.INCOMPLETE &&
            uPortAddress === managerAddress.toLowerCase()){
            return  (
                <>
                    <ExtractInvestmentsButton investmentContractAddress={this.props.investmentAddress} />
                    <Divider horizontal>OR</Divider>
                </>
            )
        }
    }

    renderInvest(){
        if (this.props.investment.investmentStatus === InvestmentStatusEnum.INPROGRESS ){
            return(
                <div>
                    <InvestmentForm investmentContractAddress={this.props.investment.address} />
                </div>
            )
        }
    }


    render(){

        if(!this.props.investmentContribution){
            return (
                <Segment padded='very'>
                    <Dimmer active inverted>
                        <Loader content='Fetching investor details...' />
                    </Dimmer>
                </Segment>
            )
        }

        return(
            <>
                {this.renderInvestmentParticipation()}
                <br />
                {this.renderActions()}
            </>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        investmentContribution: state.investmentContributions[ownProps.investmentAddress]
    }
};


export default connect(mapStateToProps, {
    fetchInvestmentContributionSummary
})(InvestmentShow_InvestorInfo);