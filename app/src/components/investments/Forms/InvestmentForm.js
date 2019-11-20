import React from 'react';
import {Field, reduxForm} from 'redux-form';
import {connect} from 'react-redux';
import {invest} from '../../../actions';
import {Button} from 'semantic-ui-react';
import {INVEST} from '../../../actions/types';
import {createLoadingSelector, createErrorMessageSelector} from '../../../selectors';

//validation functions
const minValue = min => value => value && value < min ? `Must be at least ${min}` : undefined;
const minValue0 = minValue(0);

class InvestmentForm extends React.Component{
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
                <input {...input} autoComplete="off" type={type} step={step}/>
                {this.renderError(meta)}
            </div>
        )
    }

    onSubmit = (formValues) => {
        this.props.invest(formValues, this.props.investmentContractAddress);
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
                    label="Investment Amount (ETH)"
                    type="number"
                    step="any"
                    validate={[minValue0]}
                />
                <Button loading={this.props.isFetching} className="ui button primary" fluid>
                    Invest!
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

const loadingSelector = createLoadingSelector([INVEST]);
const errorSelector = createErrorMessageSelector([INVEST]);
const mapStateToProps = (state) => {
    return {
        isFetching: loadingSelector(state),
        error: errorSelector(state)
    }
}

const ConnectedInvestmentForm = connect(mapStateToProps, {
    invest
})(InvestmentForm);

export default reduxForm({
    form: 'investmentForm',
    validate
})(ConnectedInvestmentForm);