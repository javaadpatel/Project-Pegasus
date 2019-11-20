import React from 'react';
import ReactDOM from 'react-dom';

const Modal = props => {
    return ReactDOM.createPortal(
        <div 
        onClick={props.onDismiss}
        className="ui dimmer modals visible active"
        >
            <div 
            onClick={(e) => e.stopPropagation()}
            className="ui transition modal visible active">
                {props.title === undefined ? "" : <div className="header">{props.title}</div>}
                
                <div className="content">
                    {props.content}
                </div>
                {props.actions === undefined ? 
                    "" :  
                    <div className="actions">
                        {props.actions}
                    </div>
                }
            </div>
        </div>,
        document.querySelector('#modal')
    );
};

export default Modal;