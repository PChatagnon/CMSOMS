import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import DataTable from './DataTable';
import { masterDetails } from '../../../../actions/appActions';

function mapStateToProps(state) {
    return { md: state.md };
}

function mapDispatchToProps(dispatch) {
    return {
        ...bindActionCreators({ masterDetails }, dispatch), dispatch
    };
}

class DataTableMD extends Component {

    onRowSelect = row => {
        if (!row || !row.row) return;

        this.props.dispatch(masterDetails({
            groupId: this.props.groupId, body: {
                ...row,
                selector: this.props.selectors.out.length ? this.props.selectors.out[0].attributes.name : null
            }
        }));
    }

    render() {
        return (
            <DataTable
                {...this.props}
                onRowSelect={this.onRowSelect}
            />
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(DataTableMD);