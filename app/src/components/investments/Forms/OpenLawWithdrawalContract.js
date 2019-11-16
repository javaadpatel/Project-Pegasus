import React from 'react';
import _ from 'lodash';
import {Container, Form,Grid, Button, Image} from 'semantic-ui-react';
import {openLawConfig} from '../../../configuration/index';

//create a client instance 
const apiClient = new window.openlaw.APIClient(openLawConfig.server);
console.log(apiClient);
const Openlaw = window.openlaw.Openlaw;

class OpenLawWithdrawalContract extends React.Component {
    state = {
        APIClient: null, 
        Openlaw: null, 
        investmentManager: '0x51D8B949bA829208EfD6F45ADc249e95a7C9cf47',
        investmentManagerEmail:'javaadpatel@gmail.com',
        contract: null,
        myTemplate: null, 
        myContent: null,
        creatorId:'',
        myCompiledTemplate: null, 
        draftId:'' ,
        investmentContractAddress: '0x64134384DCcAF62CDeCF1CD43790E44Efe9Fd635'
    }

    componentDidMount = async () => {
        try{
            //login to openlaw instance 
            await apiClient.login(openLawConfig.userName, openLawConfig.password);
            // console.log(await apiClient.toAdminUser("76b51a49-1f48-4354-bb31-c346b3555112"));
            // console.log(await apiClient.changeEthereumNetwork("Ropsten"));

            // console.log("current network",await apiClient.getCurrentNetwork());
            //get most recent version of the template that was created by us
            const versions = await apiClient.getTemplateVersions(openLawConfig.templateName, 20, 1);
            console.log(versions);
            const latestAuthorizedVersion = _.chain(versions).filter({ 'creatorId': openLawConfig.creatorId}).head().value();

            //retrieve the openLaw template by name
            // const myTemplate = await apiClient.getTemplate(openLawConfig.templateName); //testing
            const myTemplate = await apiClient.getTemplateById(latestAuthorizedVersion.id);
            console.log("myTEmplate", myTemplate);
            
            //pull properties off of JSON and make into variables
            const myTitle = myTemplate.title;
            
            //retrieve OpenLaw template, including Markdown
            const myContent = myTemplate.content;
            
            //get the creatorID from the template
            const creatorId = latestAuthorizedVersion.creatorId;
            console.log(creatorId);
            
            //Get my compiled Template, for use in rendering the HTML in previewTemplate
            const myCompiledTemplate = await Openlaw.compileTemplate(myContent);
            
            if (myCompiledTemplate.isError) {
                console.log("error in template");
                throw "my Template error" + myCompiledTemplate.errorMessage;
            }

            //save template parameters to state
            this.setState({myTemplate, myTitle, myContent, creatorId,myCompiledTemplate});

            //build contract preview
            this.previewTemplate();
        } catch (error) {
        // Catch any errors for any of the above operations.
        alert(
            `Failed to load web3, accounts, or contract. Check console for details.`,
        );
        console.error(error);
        }
    }

    /*Preview OpenLaw Template*/
    previewTemplate = async () => {
        console.log('preview of openlaw draft..');
        // event.preventDefault();
        //Display HTML 
        try{
            const params = {
                "Investment Manager Address": this.state.investmentManager,
                "Investment Contract Address": this.state.investmentContractAddress
            };
            
            const executionResult = await Openlaw.execute(this.state.myCompiledTemplate.compiledTemplate, {}, params);
            const agreements = await Openlaw.getAgreements(executionResult.executionResult);
            const html = await Openlaw.renderForReview(agreements[0].agreement,{});
            console.log("this is the html..", html); 
            console.log("compiled template", this.state.myCompiledTemplate);
            //set html state
            this.setState({html});
        }
        catch(error){
            console.log("draft not submitted yet..", error);
        }
    };

    buildOpenLawParamsObj = async (myTemplate, creatorId) => {
        console.log('template', myTemplate);
        const draftTempId = "345345454643634643643643436";

        const object = {
            templateId: myTemplate.id,
            title: myTemplate.title,
            text: myTemplate.content,
            creator: this.state.creatorId,
            parameters: {
                "Investment Manager Address": this.state.investmentManager,
                "Investment Contract Address": this.state.investmentContractAddress,
                "Investment Manager Signatory Email": this.state.investmentManagerEmail,
            },
            overriddenParagraphs: {},
            agreements: {},
            readonlyEmails: [],
            editEmails: [],
            draftId: draftTempId,//this.state.draftId,
            options: {
                sendNotification: true
            }
        };

        console.log("build object", object.draftId);
        return object;
    };

onSubmit = async(event) => {
    console.log('submiting to OL..');
    event.preventDefault();

    try{
      //login to api
      apiClient.login(openLawConfig.userName,openLawConfig.password);
      console.log('apiClient logged in');

      //add Open Law params to be uploaded
      const uploadParams = await this.buildOpenLawParamsObj(this.state.myTemplate,this.state.creatorId);
      console.log('parmeters from user..', uploadParams.parameters);
      console.log('all parameters uploading...', uploadParams);
      
      //uploadDraft, sends a draft contract to "Draft Management", which can be edited. 
      const draftId = await apiClient.uploadDraft(uploadParams);
      console.log('draft id..', draftId);
      this.setState({draftId});

      //uploadContract, this sends a completed contract to "Contract Management", where it can not be edited.
      console.log('upload contract...');
      const result = await apiClient.uploadContract(uploadParams);
      console.log('results..', result)
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
                    <Image src='./openlaw.png' fluid />
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


export default OpenLawWithdrawalContract;