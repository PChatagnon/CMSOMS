import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Chip from '@material-ui/core/Chip';
import Datatable from '../../../../../components/portlets/generic/datatable/table/Table';
import { masterDetails } from '../../../../../actions/appActions';

function mapStateToProps(state) {
    return { md: state.md };
}

function mapDispatchToProps(dispatch) {
    return {
        ...bindActionCreators({ masterDetails }, dispatch), dispatch
    };
}

const COLUMNS = [
    { name: 'position', label: 'Position' },
    { name: 'voltage', label: 'Voltage' },
    { name: 'nominal', label: 'Nominal' },
    { name: 'change_date', label: 'Change Date' }
];

class CSCLastValueTable extends Component {

    constructor(props) {
        super(props);
        this.chamber = null;
        const { columns } = props.configuration;
        this.columns = columns || COLUMNS;
        this.params = { page: 1, pagesize: 100000, include: ['turbo', 'presentation_timestamp'] };
        this.state = {
            data: []
        }
    }

    componentDidMount() {
        this.loadData();
    }

    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, this.loadData);
        this.props.shouldRefresh(this.props, this.loadData);
        this.shouldUpdate(prevProps);
    }

    // Check if there are new data from master-details channel
    shouldUpdate(prevProps) {
        const { groupId } = this.props;
        if (this.props.md[groupId] === prevProps.md[groupId]) return;
        if (this.props.md[groupId].selector !== 'csc_chamber') return;

        this.chamber = this.props.md[groupId].chamber;
        return this.loadData();
    }

    loadData = () => {
        if (!this.chamber) {
            this.setState({ data: null });
            return this.props.onEmpty();
        }
        this.props.showLoader();
        const params = {
            ...this.params,
            filters: [{
                attribute: 'chamber',
                operator: 'EQ',
                value: this.chamber
            }]
        };
        const { endpoint } = this.props.configuration; // subsystems/csc/highvoltage
        this.props.fetchData(endpoint, params)
            .then(resp => {
                const { data } = resp.data;

                // Handle empty data response
                if (!data.length) {
                    this.setState({ data: null });
                    return this.props.onEmpty();
                }

                this.setState({ data: data });
                this.props.hideLoader();
            })
            .catch(error => this.props.onFailure(error));
    }

    onChamberRemove = () => {
        this.chamber = null;
        return this.loadData();
    }

    render() {
        const { data } = this.state;
        if (!data) return <div />;

        return (
            <div>
                {this.chamber && <Chip label={this.chamber} onDelete={this.onChamberRemove} />}
                <Datatable
                    data={data}
                    columns={this.columns}
                    showFooter={false}
                    height={this.props.portletHeight - 40}
                />
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(CSCLastValueTable);
