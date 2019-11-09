import React from 'react';
import {connect} from 'react-redux';
import _ from 'lodash';
import {fetchInvestment, fetchInvestmentContributionSummary, fetchPayments} from  '../../actions';
import InvestmentForm from './Forms/InvestmentForm';
import InvestmentPaymentForm from './Forms/InvestmentPaymentForm';
import InvestmentPaymentsTable from  './Tables/InvestmentPaymentsTable';
import WithdrawPaymentsButton from './Buttons/WithdrawPaymentsButton';
import WithdrawInvestmentButton from './Buttons/WithdrawInvestmentButton';
import ExtractInvestmentsButton from './Buttons/ExtractInvestmentsButton';
import {InvestmentStatusEnum, InvestmentTransferStatusEnum} from  '../../constants';
import {Menu, Loader, Segment, Dimmer, Container, Grid,
    Image, Divider, Progress, Card, Label, Icon, Statistic} from 'semantic-ui-react';

class InvestmentShow extends React.Component {
    state = {loading:false, activeItem: 'investmentSummary' }
    handleItemClick = (e, { name }) => this.setState({ activeItem: name })

    componentDidMount(){
        const {address} = this.props.match.params;
        this.props.fetchInvestment(address);
        this.props.fetchInvestmentContributionSummary(address);
        this.props.fetchPayments(address);
    }

    renderInvestmentParticipation(){
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

    renderInvest(){
        if (this.props.investment.investmentStatus === InvestmentStatusEnum.INPROGRESS ){
            return(
                <div>
                    <InvestmentForm investmentContractAddress={this.props.investment.address} />
                </div>
            )
        }
    }

    renderWithdraw(){
        if(this.props.investment.investmentStatus === InvestmentStatusEnum.FAILED){
            return(
                <WithdrawInvestmentButton investmentContractAddress={this.props.investment.address} />
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
                <InvestmentPaymentForm investmentContractAddress={this.props.investment.address} />
                <Divider horizontal>OR</Divider>
                <WithdrawPaymentsButton investmentContractAddress={this.props.investment.address} />
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
                    <ExtractInvestmentsButton investmentContractAddress={this.props.investment.address} />
                    <Divider horizontal>OR</Divider>
                </>
            )
        }
    }

    renderActions(){
        return(
            this.renderInvest() ||
            this.renderWithdraw() ||
            this.renderPayments()
        )
    }

    renderLabels(){
        const investment = this.props.investment;
        return(
            <>
                <Statistic.Group size='small'>
                    <Statistic>
                    <Statistic.Value>
                        <Icon size='small' name='users'/>
                        {investment.investorCount}
                    </Statistic.Value>
                    <Statistic.Label>Investors</Statistic.Label>
                    </Statistic>

                    <Statistic>
                    <Statistic.Value>
                        <Icon size='small' name='dollar sign'/>{investment.totalInvestmentCost}
                    </Statistic.Value>
                    <Statistic.Label>Investment <br/> Required (ETH)</Statistic.Label>
                    </Statistic>

                    <Statistic>
                    <Statistic.Value>
                        <Icon name='calendar alternate outline' size='small' />
                        {investment.investmentDeadlineTimestamp}
                    </Statistic.Value>
                    <Statistic.Label>Deadline</Statistic.Label>
                    </Statistic>

                    <Statistic>
                    <Statistic.Value>
                        <Icon name='percent' size='small' />
                        {investment.commissionFee}
                    </Statistic.Value>
                    <Statistic.Label>Fee</Statistic.Label>
                    </Statistic>
                </Statistic.Group>
            </>
        );
    }

    renderCard_InvestmentSummary(){
        const {address,managerAddress, investmentTitle, investmentRationale} = this.props.investment;
        return(
            <>
                <Card.Header>
                    {investmentTitle}
                    {this.renderLabels()}
                </Card.Header>
                <br />
                <Card.Meta>Investment Rationale</Card.Meta>
                <Card.Description>
                    {investmentRationale}
                </Card.Description>
                <br />
                <Card.Meta>Investment Contract Address</Card.Meta>
                <Card.Description>
                    {address}
                </Card.Description>
                <br />
                <Card.Meta>Investment Manager</Card.Meta>
                <Card.Description>
                    {managerAddress}
                </Card.Description>
            </>
        );
    }

    renderCard_PaymentsSummary(){
        return(
            <InvestmentPaymentsTable payments={this.props.payments} />
        );
    }


    render(){
        if(!this.props.investment || !this.props.investmentContribution){
            return (
                <Segment padded='very'>
                    <Dimmer active inverted>
                    <Loader content='Fetching Investment Summary...' />
                    </Dimmer>
                </Segment>
            );
        };

        const { activeItem } = this.state
        const {totalInvestmentContributed, totalInvestmentCost,  investmentStatus} = this.props.investment;
        return(
            <div>
                <Container fluid>
                    <Grid>
                        <Grid.Row>
                            <Grid.Column textAlign='center'>
                                <Image 
                                    size='large'
                                    centered
                                    rounded 
                                    src="https://lh3.googleusercontent.com/WTqidDuhtjqN-wYNzavuSe6inAduOwTEE_jkWPgA1AyvMiR0ySsaUwkOa_u0vCRsWdGP=w412-h220-rw" 
                                />
                                <Divider horizontal>Investment Details</Divider>
                                <Progress 
                                    percent={(totalInvestmentContributed/totalInvestmentCost)*100} 
                                    color="blue"
                                >
                                </Progress>
                            </Grid.Column>
                        </Grid.Row>
                        <Grid.Row>
                            <Grid.Column width={12}>
                                <Card fluid>
                                    <Card.Content>
                                        <Menu tabular>
                                            <Menu.Item name='investmentSummary' active={activeItem === 'investmentSummary'} onClick={this.handleItemClick}/>
                                            <Menu.Item name='paymentsSummary' active={activeItem === 'paymentsSummary'} onClick={this.handleItemClick} disabled={investmentStatus !== InvestmentStatusEnum.COMPLETED ? true : false}/>
                                            <Menu.Menu position='right'>
                                                <Menu.Item>
                                                <Label attached='top right'>
                                                    {this.props.investment.investmentStatus === InvestmentStatusEnum.COMPLETED ? "Completed" : this.props.investment.investmentStatus === InvestmentStatusEnum.INPROGRESS ? "In Progress" : "Failed"}
                                                </Label>
                                                </Menu.Item>
                                            </Menu.Menu>
                                        </Menu>
                                        <Segment attached='bottom'>
                                            {activeItem === 'investmentSummary' ? this.renderCard_InvestmentSummary() : this.renderCard_PaymentsSummary()}
                                        </Segment>
                                    </Card.Content>
                                </Card>
                            </Grid.Column>

                            <Grid.Column width={4}>
                                {this.renderInvestmentParticipation()}
                                <br />
                                {this.renderActions()}
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Container>
            </div>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    const address = ownProps.match.params.address;
    return {
        investment: state.investments[address],
        investmentContribution: state.investmentContributions[address],
        payments: state.payments[address],
        manager: state.auth
    }
}

export default connect(mapStateToProps, {
    fetchInvestment,
    fetchInvestmentContributionSummary,
    fetchPayments
})(InvestmentShow);