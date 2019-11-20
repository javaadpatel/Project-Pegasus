import {openLawConfig} from '../../configuration/index';
import _ from 'lodash';

const buildOpenLawParamsObj = async (templateObject) => {
    const {myTemplate, creatorId, investmentManagerAddress, investmentContractAddress, investmentManagerEmail} = templateObject;

    const object = {
        templateId: myTemplate.id,
        title: myTemplate.title,
        text: myTemplate.content,
        creator: creatorId,
        parameters: {
            "Investment Manager Address": investmentManagerAddress,
            "Investment Contract Address": investmentContractAddress,
            "Investment Manager Signatory Email": investmentManagerEmail,
        },
        overriddenParagraphs: {},
        agreements: {},
        readonlyEmails: [],
        editEmails: [],
        draftId: '',//this.state.draftId,
        options: {
            sendNotification: "true"
        }
    };

    return object;
};

const createSignedInOpenlawClientInstance = async () => {
     //create open law client
     const apiClient = new window.openlaw.APIClient(openLawConfig.server);
     const openLaw = window.openlaw.Openlaw;
 
     try{
         //login to openlaw instance 
         await apiClient.login(openLawConfig.userName, openLawConfig.password);
     }catch (error){
         console.log("api client failed to login");
         console.log(error);
     }

     return {apiClient, openLaw};
}

export const compileOpenLawTemplate = async () => {
     //create open law client
     const {apiClient, openLaw} = await createSignedInOpenlawClientInstance(); // new window.openlaw.APIClient(openLawConfig.server);
 
     try{
         //get most recent version of the template that was created by us
         const versions = await apiClient.getTemplateVersions(openLawConfig.templateName, 20, 1);
         const latestAuthorizedVersion = _.chain(versions).filter({ 'creatorId': openLawConfig.creatorId}).head().value();
 
         //retrieve the openLaw template by name
         // const myTemplate = await apiClient.getTemplate(openLawConfig.templateName); //testing
         const myTemplate = await apiClient.getTemplateById(latestAuthorizedVersion.id);
         
         //pull properties off of JSON and make into variables
         const myTitle = myTemplate.title;
         
         //retrieve OpenLaw template, including Markdown
         const myContent = myTemplate.content;
         
         //get the creatorID from the template
         const creatorId = latestAuthorizedVersion.creatorId;
         
         //Get my compiled Template, for use in rendering the HTML in previewTemplate
         const myCompiledTemplate = await openLaw.compileTemplate(myContent);
         
         if (myCompiledTemplate.isError) {
             console.log("error in template");
             throw "my Template error" + myCompiledTemplate.errorMessage;
         }
 
         return {myTemplate, myTitle, myContent, myCompiledTemplate, creatorId};
     } catch (error) {
         // Catch any errors for any of the above operations.
         alert(
             `Failed to load web3, accounts, or contract. Check console for details.`,
         );
         console.error(error);
     }
}

export const uploadDraft = async (templateObject) => {
    const {apiClient} = await createSignedInOpenlawClientInstance();

    //add Open Law params to be uploaded
    const uploadParams = await buildOpenLawParamsObj(templateObject);
    // console.log('parmeters from user..', uploadParams.parameters);
    // console.log('all parameters uploading...', uploadParams);

    //uploadDraft, sends a draft contract to "Draft Management", which can be edited. 
    try{
        const draftId = await apiClient.uploadDraft(uploadParams);
        console.log('uploaded draft id..', draftId);

        console.log("upload params", uploadParams);
        //uploadContract, this sends a completed contract to "Contract Management", where it can not be edited.
        // console.log('upload contract...');
        const result = await apiClient.uploadContract(uploadParams);
        console.log('results..', result)
    }catch(error){
        console.log("Error occurred while trying to upload open law contract draft...");
        console.log({error})
    }
}

export const previewTemplate = async (templateObject) => {
    const {openLaw} = await createSignedInOpenlawClientInstance();
    const {myCompiledTemplate, investmentManagerAddress, investmentContractAddress} = templateObject;

    try{
        const params = {
            "Investment Manager Address": investmentManagerAddress,
            "Investment Contract Address": investmentContractAddress
        };
        
        const executionResult = await openLaw.execute(myCompiledTemplate.compiledTemplate, {}, params);
        const agreements = await openLaw.getAgreements(executionResult.executionResult);
        const html = await openLaw.renderForReview(agreements[0].agreement,{});

        return html;
    }
    catch(error){
        console.log("draft not submitted yet..", error);
    }
};