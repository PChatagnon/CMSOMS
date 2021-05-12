import React, { Component } from 'react';
import DataTable from './DataTable';

class VerticalDataTable extends Component {

    render() {
        return (
            <DataTable
                {...this.props}
                vertical={true}
            />
        );
    }
}

export default VerticalDataTable;