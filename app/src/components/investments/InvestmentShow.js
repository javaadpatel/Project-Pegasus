import React from 'react';
import {connect} from 'react-redux';
import {fetchInvestment, fetchPayments} from  '../../actions';
import InvestmentPaymentsTable from  './Tables/InvestmentPaymentsTable';
import {InvestmentStatusEnum} from  '../../constants';
import {Menu, Loader, Segment, Dimmer, Container, Grid,
    Image, Divider, Progress, Card, Label, Icon, Statistic} from 'semantic-ui-react';
import InvestmentShow_InvestorInfo from './InvestmentShow_InvestorInfo';

class InvestmentShow extends React.Component {
    state = {loading:false, activeItem: 'investmentSummary' }
    handleItemClick = (e, { name }) => this.setState({ activeItem: name })

    componentDidMount(){
        const {address} = this.props.match.params;
        this.props.fetchInvestment(address);
        this.props.fetchPayments(address);
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
            <InvestmentPaymentsTable payments={this.props.payments} key={this.props.payments}/>
        );
    }

    renderInvestmentCompletionStatus(){
        const investmentStatus =  this.props.investment.investmentStatus === InvestmentStatusEnum.COMPLETED ? "Completed" : this.props.investment.investmentStatus === InvestmentStatusEnum.INPROGRESS ? "In Progress" : "Failed";
        const investmentStatusColor = this.props.investment.investmentStatus === InvestmentStatusEnum.COMPLETED ? "violet" : this.props.investment.investmentStatus === InvestmentStatusEnum.INPROGRESS ? "blue" : "red";
        return (
            <Label ribbon as='a' color={investmentStatusColor}>
                {investmentStatus}
            </Label>
        )
    }

    renderOpenlawSigningStatus(){
        const signingStatus = this.props.investment.openLawSigningStatus === true ? "OpenLaw Contract Signed" : "OpenLaw Contract Unsigned";
        const signingStatusColor = this.props.investment.openLawSigningStatus === true ? "violet" : "red"
        return (
            <Label color={signingStatusColor} size='medium'>
                {signingStatus}
            </Label>
        )
    }


    render(){
        if(!this.props.investment){
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
                                    src={require('../../images/house.png')} 
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
                                        {this.renderInvestmentCompletionStatus()}
                                        <Menu tabular>
                                            <Menu.Item name='investmentSummary' active={activeItem === 'investmentSummary'} onClick={this.handleItemClick}/>
                                            <Menu.Item name='paymentsSummary' active={activeItem === 'paymentsSummary'} onClick={this.handleItemClick} disabled={investmentStatus !== InvestmentStatusEnum.COMPLETED ? true : false}/>
                                            <Menu.Menu position='right'>
                                                <Menu.Item>
                                                    {this.renderOpenlawSigningStatus()}
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
                                <InvestmentShow_InvestorInfo 
                                    investmentAddress={this.props.investment.address} 
                                    ethereumAddress={this.props.ethereumAddress}
                                    manager={this.props.manager}
                                    investment={this.props.investment}
                                    key={this.props.ethereumAddress}/>
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
        manager: state.auth,
        ethereumAddress: state.ethProvider.selectedAddress
    }
}

export default connect(mapStateToProps, {
    fetchInvestment,
    fetchPayments
})(InvestmentShow);