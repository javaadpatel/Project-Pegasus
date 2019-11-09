import React from 'react'
import {registerOnEthProviderUpdate} from '../actions';
import { connect } from 'react-redux';
import {Icon, Segment} from 'semantic-ui-react';


class EthereumNetworkWatcher extends React.Component{
    componentDidMount(){
        this.props.registerOnEthProviderUpdate();
    }

    renderNetworkDisplayWidget(){
        return(
            this.props.isNetworkSupported ? 
            <></> :
            <Segment inverted color='red' textAlign='center'>
                <Icon name='warning sign' size='large' />
                Unsupported network. Please switch to Ropsten.
            </Segment>
        )
    }

    render(){
        return(
            this.renderNetworkDisplayWidget()
        )
    }
}

const mapStateToProps = (state) => {
    return{
        selectedAddress: state.ethProvider.selectedAddress,
        isNetworkSupported: state.ethProvider.networkVersion === '3'
    }
}

export default connect(mapStateToProps, {
    registerOnEthProviderUpdate
})(EthereumNetworkWatcher)