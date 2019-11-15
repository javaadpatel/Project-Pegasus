import _ from 'lodash';
import React from 'react';
import {Table} from 'semantic-ui-react';

class InvestmentPaymentsTable extends React.Component {
    state = {
        column: null,
        data: this.props.payments,
        direction: null
    }

    handleSort = clickedColumn => () => {
        const {column, data, direction} = this.state;

        if (column !== clickedColumn){
            this.setState({
                column: clickedColumn,
                data: _.sortBy(data, [clickedColumn]),
                direction: 'ascending'
            })
            return;
        }

        this.setState({
            data: data.reverse(),
            direction: direction === 'ascending' ? 'descending' : 'ascending'
        })
    };

    render(){
        const {column, data, direction} = this.state;

        return(
            <Table sortable celled fixed striped>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell
                            sorted={column === 'address' ? direction : null}
                            onClick={this.handleSort('address')}
                        >
                            Paid from Address
                        </Table.HeaderCell>
                        <Table.HeaderCell
                            sorted={column === 'amountInEther' ? direction : null}
                            onClick={this.handleSort('amountInEther')}
                        >
                            Payment (ETH)
                        </Table.HeaderCell>
                        <Table.HeaderCell
                            sorted={column === 'timestamp' ? direction : null}
                            onClick={this.handleSort('timestamp')}
                        >
                            Date Paid
                        </Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {_.map(data, ({ address, amountInEther, timestamp }) => (
                        <Table.Row key={timestamp}>
                        <Table.Cell>{address}</Table.Cell>
                        <Table.Cell>{amountInEther}</Table.Cell>
                        <Table.Cell>{timestamp}</Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
                <Table.Footer>
                    <Table.Row>
                        <Table.HeaderCell />
                        <Table.HeaderCell>
                            {_.reduce(data, function (sum, n) { return sum + parseFloat(n.amountInEther)}, 0).toFixed(5)} Total Paid (ETH)
                        </Table.HeaderCell>
                        <Table.HeaderCell />
                    </Table.Row>
                </Table.Footer>
            </Table>
        );
    };
}

export default InvestmentPaymentsTable;