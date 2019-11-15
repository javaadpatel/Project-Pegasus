import React from 'react';
import {Field, reduxForm} from 'redux-form';
import {connect} from 'react-redux';
import {makePayment} from '../../../actions';
import {MAKE_PAYMENT} from '../../../actions/types';
import {createLoadingSelector, createErrorMessageSelector} from '../../../selectors';
import {Button} from 'semantic-ui-react';

//validation functions
const minValue = min => value => value && value < min ? `Must be at least ${min}` : undefined;
const minValue0 = minValue(0);

class InvestmentPaymentForm extends React.Component{
    state = {loading: false}

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

    renderInput = ({input, label, meta, type, step}) => {
        const className = `field ${meta.error && meta.touched ? 'error': ''}`;
        return(
            <div className={className}>
                <label>{label}</label>
                <input {...input} autoComplete="off" type={type}  step={step}/>
                {this.renderError(meta)}
            </div>
        )
    }

    onSubmit = (formValues) => {
        this.props.makePayment(formValues, this.props.investmentContractAddress);
    }

    render(){
        return(
            <form
                onSubmit={this.props.handleSubmit(this.onSubmit)}
                className="ui form error"
            >
                <Field
                    name="amount"
                    component={this.renderInput}
                    label="Payment Amount (ETH)"
                    type="number"
                    step="any"
                    validate={[minValue0]}
                >
                </Field>
                <Button compact fluid loading={this.props.isFetching} className="ui button primary">
                    Pay
                </Button>   
                
            </form>
        )
    }
}

const validate = (formValues) => {
    const errors = {};
    if(!formValues.amount){
        errors.amount = "You must enter an amount in ETH above 0"
    }

    return errors;
}

const loadingSelector = createLoadingSelector([MAKE_PAYMENT]);
const errorSelector = createErrorMessageSelector([MAKE_PAYMENT]);
const mapStateToProps = (state) => {
    return {
        isFetching: loadingSelector(state),
        error: errorSelector(state)
    }
}

const ConnectedInvestmentPaymentForm = connect(mapStateToProps, {
    makePayment
})(InvestmentPaymentForm);

export default reduxForm({
    form: 'investmentPaymentForm',
    validate
})(ConnectedInvestmentPaymentForm);