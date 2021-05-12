import React, { Component } from 'react';
import Datatable from '../generic/datatable/table/Table';

class RunKeys extends Component {

    state = {
        data: null,
        columns: null
    }

    componentDidMount() {
        this.loadData();
    }

    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, this.loadData);
        this.props.shouldRefresh(this.props, this.loadData);
    }

    loadData = () => {
        this.props.showLoader();

        this.props.fetchData('runkeys')
            .then(resp => {
                const { data } = resp.data;

                // Handle empty data response
                if (!data.length) {
                    this.setState({ data: null, columns: null });
                    return this.props.onEmpty();
                }

                // Transform component keys list of first row into datatables column list
                const compKeys = data[0].attributes.component_keys;
                let columns = [];
                Object.keys(compKeys).forEach(key => {
                    columns.push({
                        name: key,
                        label: key,
                        type: null,
                        description: '',
                        units: null,
                        sortable: false,
                        numeric: true,
                    });
                });

                this.setState({ data: [{ attributes: compKeys }], columns: columns });
                this.props.hideLoader();
            })
            .catch(error => this.props.onFailure(error));
    }

    render() {
        const { data, columns } = this.state;
        if (!data) return null;

        return (
            <Datatable
                data={data}
                columns={columns}
                showFooter={false}
                vertical={true}
                height={this.props.portletHeight}
            />
        );
    }
}

export default RunKeys;
