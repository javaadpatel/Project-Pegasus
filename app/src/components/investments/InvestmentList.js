import React from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router-dom';
import {fetchInvestments} from '../../actions';
import {Item, Tab, Menu, Label, Segment, Dimmer, Loader, Popup, Icon} from 'semantic-ui-react';
import {InvestmentStatusEnum} from  '../../constants';
import _ from 'lodash';

class InvestmentList extends React.Component{
    componentDidMount(){
        this.props.fetchInvestments();
    }

    createInvestmentCard(investment){
        return(
            <Item>
                <Item.Image size='tiny' src='https://react.semantic-ui.com/images/wireframe/image.png' />
        
                <Item.Content>
                <Item.Header>
                    <Link to={`/investments/${investment.address}`} className="header">
                        {investment.investmentTitle}
                    </Link>
                </Item.Header>
                <Item.Meta>Description</Item.Meta>
                <Item.Description>
                    {investment.investmentRationale}
                </Item.Description>
                </Item.Content>
            </Item>
        )
    }

    createInvestmentCards(){
        return this.props.investments.map(investment => {
            return (
                <>
                    {this.createInvestmentCard(investment)}
                </>
            )
        })
    }

    renderList(investmentStatusEnum) {
        var investments = this.props.investments;
        //filter investments
        investments = _.filter(investments, item => item.investmentStatus === investmentStatusEnum);
            
        return investments.map(investment => {
            return(
                <Item key={investment.address}>
                    <Item.Image size='small' src='https://react.semantic-ui.com/images/wireframe/image.png' />

                    <Item.Content>
                        <Link to={`/investments/${investment.address}`} className="header">
                            {investment.investmentTitle}
                        </Link>
                        <Item.Description>{investment.investmentRationale}</Item.Description>
                        <Item.Extra>
                            <Icon color='yellow' name='trophy' /> {investment.managerRanking}
                        </Item.Extra>
                    </Item.Content>
                </Item>
            )
        })
    }

    renderCreate(){
        const isSignedIn = this.props.isSignedIn;
        return(
            <Popup
            trigger={
                <Link to="/investments/new" className={`ui button ${isSignedIn ? 'primary' : ''}`} onClick={e => {if(!isSignedIn){e.preventDefault()}}} >
                    Create Investment
                </Link>
            }
            content='Please sign in.'
            position ='left center'
            on='hover'
            disabled={isSignedIn}
            />

        )
    }

    renderPanes() {
        return (
            [
                { menuItem:  (
                    <Menu.Item key='inProgressInvestments'>
                      In Progress
                      <Label key="inProgressCountLabel" content={this.CalculateInvestmentCount(InvestmentStatusEnum.INPROGRESS)}></Label>
                    </Menu.Item>
                  ), render: () => (
                    <Tab.Pane><div className="ui celled list relaxed">{this.renderList(InvestmentStatusEnum.INPROGRESS)}</div></Tab.Pane>
                    ) 
                },
                { menuItem: (
                    <Menu.Item key='completedInvestments'>
                      Completed
                      <Label key="completedCountLabel" content={this.CalculateInvestmentCount(InvestmentStatusEnum.COMPLETED)}></Label>
                    </Menu.Item>
                  ),  render: () => (
                    <Tab.Pane><div className="ui celled list relaxed">{this.renderList(InvestmentStatusEnum.COMPLETED)}</div></Tab.Pane>
                    )  },
                { menuItem: (
                    <Menu.Item key='failedInvestments'>
                      Failed
                      <Label key="failedCountLabel" content={this.CalculateInvestmentCount(InvestmentStatusEnum.FAILED)}></Label>
                    </Menu.Item>
                  ),  render: () => (
                    <Tab.Pane><div className="ui celled list relaxed">{this.renderList(InvestmentStatusEnum.FAILED)}</div></Tab.Pane>
                    )  },
              ]
        )
    }
      
    TabExampleVerticalTabular = () => (
        <Tab menu={{ fluid: true, vertical: true, tabular: true }} panes={this.renderPanes()} />
    )

    CalculateInvestmentCount (investmentStatus){
        var investmentCount = (_.filter(this.props.investments, item => item.investmentStatus === investmentStatus)).length;
        return investmentCount;
    }

    render(){
        if (!this.props.investments){
            return (
                <Segment padded='very'>
                    <Dimmer active inverted>
                    <Loader content='Fetching Investments...' />
                    </Dimmer>
                </Segment>
            );
        }

        return(
            <div>
                <div className="content floated right" style={{textAlign: 'right'}}>
                    {this.renderCreate()}
                </div>
                <br />
                {this.TabExampleVerticalTabular()}
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    //convert state.investments to array
    return {
        investments: Object.values(state.investments),
        isSignedIn: state.auth.isSignedIn
    };
}

export default connect(mapStateToProps, {
    fetchInvestments
})(InvestmentList);