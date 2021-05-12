import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Datatable from '../generic/datatable/table/Table';
import { masterDetails } from '../../../actions/appActions';

function mapStateToProps(state) {
    return { md: state.md };
}

function mapDispatchToProps(dispatch) {
    return {
        ...bindActionCreators({ masterDetails }, dispatch), dispatch
    };
}

class HLTPrescaleSets extends Component {

    constructor(props) {
        super(props);

        this.state = {
            data: [],
            columns: null,
            selectedRows: []
        }
        this.initialColumns = [{
            name: 'prescale_sequence',
            label: 'N'
        }, {
            name: 'path_name',
            label: 'Path Name',
            props: {
                clickHandler: (row) => {
                    this.props.dispatch(masterDetails({
                        groupId: this.props.groupId,
                        body: { ...row, selector: this.props.selectors.out.length ? this.props.selectors.out[0].attributes.name : null }
                    }));

                    this.selectRow(row);
                },
                type: 'link_click'
            }
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

        this.props.fetchData('hltprescalesets', { page: 1, pagesize: 1000, include: ['turbo'] })
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

    selectRow = (row) => {
        const selectedRow = this.state.data.find(r => r.attributes.path_name === row.path_name);
        this.setState({ selectedRows: [selectedRow.id] });
    }

    render() {
        const { data, columns, selectedRows } = this.state;
        if (!data || !columns) return <div />;

        return (
            <Datatable
                data={data}
                columns={columns}
                showFooter={false}
                height={this.props.portletHeight}
                selected={selectedRows}
            />
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(HLTPrescaleSets);