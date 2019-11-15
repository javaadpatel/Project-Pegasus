import React from 'react';
import {Router, Route, Switch} from 'react-router-dom';

import Header from './Header';
import InvestmentList from './investments/InvestmentList';
import InvestmentCreate from './investments/InvestmentCreate';
import InvestmentShow from './investments/InvestmentShow';
import history from '../history';

const App = () => {
    return (
        <div className="ui container">
            <Router history={history}>
                <div>
                    <Header />
                    <Switch>
                        <Route path="/" exact component={InvestmentList} />
                        <Route path="/investments/new" exact component={InvestmentCreate} />
                        <Route path="/investments/:address" exact component={InvestmentShow} />
                    </Switch>
                </div>
            </Router>
        </div>
    );
};

export default App;