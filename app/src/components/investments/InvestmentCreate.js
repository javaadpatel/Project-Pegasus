import React from 'react';
import _ from 'lodash';
import {connect} from 'react-redux';
import  {createInvestment, fetchInvestmentManager} from '../../actions';
import InvestmentCreationForm from './Forms/InvestmentCreationForm';
import UpgradeRankButton from './Buttons/UpgradeRankButton';
import {Dimmer, Loader, Segment, Container, Grid, Card} from 'semantic-ui-react';

class InvestmentCreate extends React.Component{
    state = { isLoading: false, fetchManagerDetails: false };

    componentDidMount(){
        this.props.fetchInvestmentManager();
    }

    renderInvestmentManagerDetails = () =>{
        const totalInvestments = _.get(this.props.managerDetails, 'investmentAddresses')
        return (
            <div className="center text-center">
                <Card>
                    <Card.Content>
                        <Card.Header>Manager Details</Card.Header>
                        <Card.Description>Address: {this.props.managerDetails.managerAddress}</Card.Description>
                        <Card.Description>Investment Rank: {this.props.managerDetails.rank}</Card.Description>
                        <Card.Description>Total Investment Created: {totalInvestments == null ? 0 : totalInvestments.length}</Card.Description>
                        <Card.Description>Total Investment Payments: {this.props.managerDetails.totalPaymentsFromInvestments} (ETH)</Card.Description>
                        <Card.Description>Allowed Investment: {this.props.managerDetails.allowedInvestmentInEth} (ETH)</Card.Description>
                    </Card.Content>
                    <Card.Content extra>
                        <UpgradeRankButton  disabled={!this.props.managerDetails.isRankUpgradeAvailable} />
                    </Card.Content>
                </Card>
            </div>
        );
    }

    onSubmit = (formValues) => {
        this.setState({isLoading: true});
        this.props.createInvestment(this.props.manager.uPortAddress, formValues);
    }

    render(){
        if(!this.props.manager){
            return (
                <Segment padded='very'>
                    <Dimmer active inverted>
                    <Loader content='Fetching Manager Details...' />
                    </Dimmer>
                </Segment>
            ); 
        }

        return(
            <div>
                <Container fluid>
                    <Dimmer active={this.state.isLoading}>
                        <Loader>Creating investment...</Loader>
                    </Dimmer>
                    <Grid>
                        <Grid.Row>
                            <Grid.Column width={11}>
                                <h3>Create an Investment</h3>
                                <InvestmentCreationForm onSubmit={this.onSubmit} totalInvestmentMax={parseFloat(this.props.managerDetails.allowedInvestmentInEth)} />
                            </Grid.Column>
                            <Grid.Column width={5} style={{paddingTop:'60px'}}>
                                {this.renderInvestmentManagerDetails()}
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Container>
            </div>
        )
    }
};

const mapStateToProps = (state) => {
    return {
        manager: state.auth.user,
        managerDetails: state.investmentManagerDetails
    };
};

export default connect(mapStateToProps, {
    createInvestment,
    fetchInvestmentManager
})(InvestmentCreate);