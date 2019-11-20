import React from 'react';
import {connect} from 'react-redux';
import _ from 'lodash';
import '../styles/uPort.css';
import {signIn, signOut} from '../actions';
import {Button, Item} from 'semantic-ui-react';
import uPortConnect from  '../ethereum/uPortConnect';
import Modal from './Modal';
import {PegasusInvestments_RegistrationCredential} from '../constants/index';

class UPortAuth extends React.Component{
    state = {showModal1_accountCreation: false, showModal2_registrationClaim: false}

    componentDidMount(){
        //check if the user already has a login session
        if (uPortConnect.did && uPortConnect._state.PegasusInvestments_RegistrationCredential){
            this.onAuthChanged(true, uPortConnect.did);
        }else{
            this.onAuthChanged();
        }
    }

    onAuthChanged = (isSignedIn, did) => {
        if(isSignedIn){
            this.props.signIn(did);
        }else {
            this.props.signOut();
        }
    }

    onSignInClick = async () => {
        var hasRegistrationClaim = false;
        //sign in with uPort
        uPortConnect.requestDisclosure({
            requested: ['name', 'email'],
            verified: [PegasusInvestments_RegistrationCredential],
            notifications: true,
           // accountType: 'segregated' /*used to create a new account for signing transactions (only required when using uPort instead of metamask => https://medium.com/uport/uport-on-any-ethereum-blockchain-c54368a12e8c*/
        }, 'loginDisclosureRequest');

        uPortConnect.onResponse('loginDisclosureRequest').then(res => {
            console.log("login response", res);
            //extract verified claims
            var claims = _.map(res.payload.verified, 'claim');
            //check whether this user has registered before
            hasRegistrationClaim = _.some(claims, PegasusInvestments_RegistrationCredential)

            if (hasRegistrationClaim){
                this.onAuthChanged(true, res.payload.did);
            } else{
                this.setState({showModal1_accountCreation: true});
            }
        })
    }

    onSignOutClick = () => {
        uPortConnect.logout();
        this.onAuthChanged();
    }

//#region Modal
    renderRegistrationClaimModalContent () {
        return (
            <Item.Group>
                    <Item>
                        <Item.Image size='large' src='/registrationCredential.png' />
                        <Item.Content>
                            <Item.Description>
                            <h3>
                                It seems this is the first time you are interacting with Pegasus Investments. 
                            </h3>
                            <h3>
                                Please register with us by accepting
                                a signed credential. Once successfully registered you should have a credential as shown in the image.
                            </h3>
                            </Item.Description>
                        </Item.Content>
                    </Item>
                </Item.Group>
        );
    }
    
    renderRegistrationClaimModalActions () {
        return(
            <>
             <Button primary onClick={this.onRegisterClick}>
                 Register
             </Button>
            </>
        )
    }

      
    onRegisterClick = () => {
        /* Send Verification */
        uPortConnect.sendVerification({
            exp: Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60,
            claim: {
                'PegasusInvestments_RegistrationCredential': {
                    'RegistrationDate': `${new Date()}`
                }
            }
        }, 'registrationRequest');
        
        this.setState({showModal2_registrationClaim: false});
    }

    renderAccountCreationModalContent () {
        return (
            <Item.Group>
                    <Item>
                        <Item.Image size='large' src='/ethereumSigningAccount.png' />
                        <Item.Content>
                            <Item.Description>
                            <h3>
                                It seems this is the first time you are interacting with Pegasus Investments. 
                            </h3>
                            <h3>
                                If you do not have a proxy account to sign transactions with as shown in the image. 
                                Then please create an account, else skip this.
                            </h3>
                            </Item.Description>
                        </Item.Content>
                    </Item>
                </Item.Group>
        );
    }

    onCreateAccountClick = () => {
        //sign in with uPort
        uPortConnect.requestDisclosure({
            requested: ['name', 'email'],
            verified: [PegasusInvestments_RegistrationCredential],
            notifications: true,
            accountType: 'segregated' /*used to create a new account for signing transactions (only required when using uPort instead of metamask => https://medium.com/uport/uport-on-any-ethereum-blockchain-c54368a12e8c*/
        }, 'loginDisclosureRequest');

        this.setState({showModal1_accountCreation: false});
    }
    
    renderAccountCreationModalActions () {
        return(
            <>
             <Button primary onClick={this.onCreateAccountClick}>
                 Create Account
             </Button>
             <Button primary onClick={() => this.setState({showModal1_accountCreation: false, showModal2_registrationClaim: true})}>
                 Skip
             </Button>
            </>
        )
    }
    
    renderRegistrationClaimModal = () => {
        if (this.state.showModal2_registrationClaim){
            return (
                <Modal 
                title="Register using uPort"
                content={this.renderRegistrationClaimModalContent()}
                actions={this.renderRegistrationClaimModalActions()}
                onDismiss={() => this.setState({showModal2_registrationClaim: false})}
                />
                )
            }
    }

    renderAccountCreationModal = () => {
        if (this.state.showModal1_accountCreation){
            return (
                <Modal 
                title="Register using uPort"
                content={this.renderAccountCreationModalContent()}
                actions={this.renderAccountCreationModalActions()}
                onDismiss={() => this.setState({showModal1_accountCreation: false})}
                />
            );
        };
    }
//#endregion
        
    renderAuthButton(){
        //if state is not initialized yet
        if(this.props.isSignedIn === null){
            return null;
        }
        //if signin is true
        else if (this.props.isSignedIn){
            return(
                <Button compact onClick={this.onSignOutClick} className="ui button">
                    <img src={require('../images/uPort.png')} alt="uPort logo" className="uPortLogo" />
                    Sign Out
                </Button>
            );
        }
        else{
            return(
                <Button compact onClick={this.onSignInClick} className="ui button">
                    <img src={require('../images/uPort.png')} alt="uPort logo" className="uPortLogo" />
                    Sign In
                </Button>
            )
        }
    }

    render(){
        return (
            <div style={{paddingTop: 3, paddingBottom: 3}}>
                {this.renderAuthButton()}
                {this.renderAccountCreationModal()}
                {this.renderRegistrationClaimModal()}
            </div>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        isSignedIn: state.auth.isSignedIn
    };
};

export default connect(mapStateToProps, {
    signIn,
    signOut
})(UPortAuth);