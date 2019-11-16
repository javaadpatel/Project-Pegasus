import React from 'react';
import {Field, reduxForm} from 'redux-form';

//validation functions
class InvestmentCreationForm extends React.Component{
    renderError({error, touched}){
        if (touched && error){
            return (
                <div className="ui error message">
                    <div className="header">
                        {error}
                    </div>
                </div>
            );
        }
    }

     //input comes from formProps.input which redux-form
    //sends along, label is sent along as an extra prop 
    //in the object
    renderInput = ({input, label, meta, type, step}) => {
        const className = `field ${meta.error && meta.touched ? 'error': ''}`;
        return(
            <div className={className}>
                <label>{label}</label>
                <input {...input} autoComplete="off" type={type} step={step}/>
                {this.renderError(meta)}
            </div>
        )
    }

    onSubmit = (formValues) => {
        this.props.onSubmit(formValues);
    }
    
    render(){
        return(
            <form
                onSubmit={this.props.handleSubmit(this.onSubmit)}
                className="ui form error"
            >
                <Field 
                    name="title" 
                    component={this.renderInput} 
                    label="Investment Title"
                    type="text"/>
                <Field 
                    name="rationale" 
                    component={this.renderInput}  
                    label="Investment Rationale"
                    type="text"/>
                <Field
                    name="totalInvestmentCost"
                    component={this.renderInput}
                    label="Total Investment Required (Ether)"
                    type="number"      
                    step="any"
                />
                <Field
                    name="commissionFee"
                    component={this.renderInput}
                    label="Commission Fee (%)"
                    type="number"      
                />
                <Field
                    name="deadline"
                    component={this.renderInput}
                    label="Expires in (Days)"
                    type="number"      
                />
                <button className="ui button primary">
                    Submit
                </button>
            </form>
        )
    }
};

const validate = (formValues, props) =>{
    const errors = {};
    if(!formValues.title){
        //only ran if the user did not enter title
        errors.title = 'You must enter a title';
    }
    if (!formValues.rationale){
        errors.rationale = 'You must enter a rationale';
    }
    if (formValues.commissionFee < 0 || formValues.commissionFee > 100){
        errors.commissionFee = "Commision must be between 0-100%"
    }
    if (formValues.totalInvestmentCost < 0 || formValues.totalInvestmentCost > props.totalInvestmentMax){
        errors.totalInvestmentCost = `Total Investment Cost must be between 0 and ${props.totalInvestmentMax}`
    }
    // if (!formValues.email || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(formValues.email)){
    //     errors.email = 'Invalid email address' 
    // }
    return errors;
};

export default reduxForm({
    form: 'investmentCreationForm',
    validate
})(InvestmentCreationForm);
