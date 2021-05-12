import React, { Component } from 'react';
import Datatable from '../generic/datatable/table/Table';

class L1PrescaleSets extends Component {

    constructor(props) {
        super(props);

        this.state = {
            data: null,
            columns: null
        }
        this.initialColumns = [{
            name: 'algo_index',
            label: 'N'
        }, {
            name: 'algo_name',
            label: 'L1 Algo Name'
        }];
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

        this.props.fetchData('l1prescalesets', { page: 1, pagesize: 1000, include: ['turbo'] })
            .then(resp => {
                const { data } = resp.data;

                // Handle empty data response
                if (!data.length) {
                    this.setState({ data: null, columns: null });
                    return this.props.onEmpty();
                }

                // Transform prescale list of first row into datatables column list
                const columns = this.initialColumns.concat(
                    data[0].attributes.prescales.map(p => ({
                        name: 'prescale' + p.prescale_index,
                        label: `Index ${p.prescale_index} ${p.prescale_name}`,
                        type: null,
                        description: '',
                        units: null,
                        sortable: false,
                        numeric: true,
                    })));

                // Modify dataset by flattening prescale column attributes
                const prescaleSets = data.map(row => {
                    let prescales = {};
                    row.attributes.prescales.forEach(p => prescales['prescale' + p.prescale_index] = p.prescale);
                    delete row.attributes.prescales;
                    row.attributes = { ...row.attributes, ...prescales };
                    return row;
                });

                this.setState({ data: prescaleSets, columns: columns });
                this.props.hideLoader();
            })
            .catch(error => this.props.onFailure(error));
    }

    render() {
        const { data, columns } = this.state;
        if (!data) return <div />;

        return (
            <Datatable
                data={data}
                columns={columns}
                showFooter={false}
                height={this.props.portletHeight}
            />
        );
    }
}

export default L1PrescaleSets;
