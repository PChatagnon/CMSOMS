import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import DataTable from './DataTable';
import Chip from '@material-ui/core/Chip';
import { masterDetails } from '../../../../actions/appActions';

function mapStateToProps(state) {
    return { md: state.md };
}

function mapDispatchToProps(dispatch) {
    return {
        ...bindActionCreators({ masterDetails }, dispatch), dispatch
    };
}

class DataTableMDClient extends Component {

    constructor(props) {
        super(props);
        this.filterMD = null;
        this.state = { filterMD: null };
    }

    // Check if there are new data from master-details channel
    shouldUpdateByMD = (prevProps) => {
        if (!this.props.configuration || !this.props.configuration.filterMD)
            return false;
        const { filterMD } = this.props.configuration
        const { groupId } = this.props;
        if (this.props.md[groupId] === prevProps.md[groupId]) 
            return false;
        if (this.props.md[groupId].attribute !== filterMD) 
            return false;

        if (!('value' in this.props.md[groupId]))
            this.filterMD = null;
        else
            this.filterMD = {
                attribute: filterMD,
                operator: 'EQ',
                value: this.props.md[groupId].value
            };
        this.setState( {filterMD: this.filterMD});
        return true;
    }

    getFilterMD = () => {
        return this.filterMD;
    }

    onFilterRemove = () => {
        this.filterMD = null;
        this.setState( {filterMD: this.filterMD} );
        this.props.dispatch(masterDetails({
            groupId: this.props.groupId,
            body: {
                attribute: this.props.configuration.filterMD
        }}));
    }

    render() {
        return (
            <div>
                {this.filterMD && <Chip label={this.filterMD.value}  onDelete={this.onFilterRemove}/>}
                <DataTable
                    {...this.props}
                    shouldUpdateByMD={this.shouldUpdateByMD}
                    getFilterMD={this.getFilterMD}
                    height={this.props.portletHeight - 40}
                />
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(DataTableMDClient);