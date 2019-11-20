import React from 'react';
import {connect} from 'react-redux';
import _ from 'lodash';
import {Container, Form,Grid, Button, Image} from 'semantic-ui-react';
import {compileOpenLawTemplate, previewTemplate} from '../../../ethereum/investmentContract/openlawHelper';
import {uploadOpenLawContract} from '../../../actions/index';

class OpenLawWithdrawalContract extends React.Component {
    state = {
        templateObject: null
    }

    componentDidMount = async () => {
        //compile openlaw contract
        const templateObject = await compileOpenLawTemplate();

        //argument template object with parameters for uploading
        templateObject.investmentManagerAddress = this.props.investmentManagerAddress;
        templateObject.investmentContractAddress = this.props.investmentContractAddress;

        //build contract preview
        const html = await previewTemplate(templateObject);
        this.setState({html});

        templateObject.html = html;
        this.setState({templateObject});
    }

onSubmit = async(event) => {
    try{
        const templateObject = this.state.templateObject;
        templateObject.investmentManagerEmail = this.state.investmentManagerEmail;
        await this.props.uploadOpenLawContract(templateObject);
        if (this.props.onSubmitComplete !== undefined){
            this.props.onSubmitComplete();
        }
    }
    catch(error){
      console.log(error);
    }
  }


    render(){
        return(
            <Container>
             {/* Show HTML in 'Preview' beware dangerouslySet... for xss vulnerable */}
                <Grid columns={2} centered>
                  <Grid.Column>
                    <Image src='../openlaw.png' fluid />
                    <br />
                    <div dangerouslySetInnerHTML={{__html: this.state.html}} />
                    <br />
                    <Form onSubmit = {this.onSubmit}>
                       <Form.Field>
                        <label>Investment Manager Email</label>
                        <input 
                          type="text" placeholder="Investment Manager Email Address"
                          onChange={event => this.setState({investmentManagerEmail: event.target.value})} />
                      </Form.Field>                                      
                      <Button color='pink' type="submit" fluid> Accept and Sign Contract </Button>
                    </Form>

                  </Grid.Column>
                </Grid>

            </Container>
        )
    }
};


const mapStateToProps = (state) => {
    //convert state.investments to array
    return {
        isSignedIn: state.auth.isSignedIn
    };
}

export default connect(mapStateToProps, {
    uploadOpenLawContract
})(OpenLawWithdrawalContract);