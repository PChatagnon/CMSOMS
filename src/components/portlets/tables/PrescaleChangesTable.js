import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import Datatable from '../generic/datatable/table/Table';
import Chip from '@material-ui/core/Chip';

function mapStateToProps(state) {
    return { md: state.md };
}

const styles = theme => ({
    chip: {
        margin: theme.spacing(0.5),
        marginLeft: 0
    },
});

class PrescaleChangesTable extends Component {

    constructor(props) {
        super(props);
        this.mdData = null;
        this.allColumns = [
            {
                "name": "lumisection_number",
                "label": "LS #",
                "type": "integer",
                "description": "Lumisection Number",
                "units": null,
                "sortable": true,
                "searchable": true,
                "projectable": true,
                "numeric": true,
                "custom": false
            },
            {
                "name": "new_prescale_index",
                "label": "New Prescale Index",
                "type": "integer",
                "description": "New Prescale Index",
                "units": null,
                "sortable": null,
                "searchable": null,
                "projectable": true,
                "numeric": true,
                "custom": false
            },
            {
                "name": "new_prescale_value",
                "label": "New Prescale Value",
                "type": "integer",
                "description": "New Prescale Value",
                "units": null,
                "sortable": null,
                "searchable": null,
                "projectable": null,
                "numeric": true,
                "custom": false,
                "hidden": true
            },
            {
                "name": "new_prescale_name",
                "label": "New Prescale Title",
                "type": "string",
                "description": "New Prescale Title",
                "units": null,
                "sortable": null,
                "searchable": null,
                "projectable": true,
                "numeric": false,
                "custom": false
            },
            {
                "name": "old_prescale_index",
                "label": "Old Prescale Index",
                "type": "integer",
                "description": "Old Prescale Index",
                "units": null,
                "sortable": null,
                "searchable": null,
                "projectable": true,
                "numeric": true,
                "custom": false
            },
            {
                "name": "change_time",
                "label": "Change Time",
                "type": "string",
                "description": "Change Time",
                "units": null,
                "sortable": null,
                "searchable": null,
                "projectable": true,
                "numeric": false,
                "custom": false
            },
            {
                "name": "physics_declared",
                "label": "Physics Active",
                "type": "boolean",
                "description": "Physics Active",
                "units": null,
                "sortable": null,
                "searchable": null,
                "projectable": true,
                "numeric": false,
                "custom": false
            }
        ];
        this.filteredColumns = this.allColumns.filter(c => !c.hidden);

        this.state = {
            data: null,
            columns: this.filteredColumns,
            path: null
        };
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

        this.mdData = this.props.md[groupId];
        if (this.mdData.selector !== 'prescale_path') return;

        return this.updateData(this.mdData.path_name);
    }

    updateData = (path) => {
        this.props.showLoader();
        const data = this.state.data.map(row => {
            row.attributes['new_prescale_value'] = this.mdData[`prescale${row.attributes.new_prescale_index}`];
            return row;
        });

        this.setState({
            columns: this.allColumns,
            data: data,
            path: path
        });
        this.props.hideLoader();
    }

    loadData = () => {
        this.props.showLoader();

        const params = { page: 1, pagesize: 100000, include: ['turbo', 'presentation_timestamp'] };
        this.props.fetchData('prescalechanges', params)
            .then(resp => {
                const { data } = resp.data;
                this.setState({
                    data: data,
                    path: null,
                    columns: this.filteredColumns
                });
                this.props.hideLoader();
            })
            .catch(error => this.props.onFailure(error));
    }

    onFilterRemove = (type, name) => () => {
        this.setState({
            columns: this.filteredColumns,
            path: null
        });
    }

    render() {
        const { data, path, columns } = this.state;
        if (!data) return <div />;

        const { classes, portletHeight } = this.props;
        return (
            <div>
                {path && <Chip label={path} onDelete={this.onFilterRemove('path', path)} className={classes.chip} />}
                <Datatable
                    data={data}
                    columns={columns}
                    showFooter={false}
                    height={portletHeight}
                />
            </div>
        );
    }
}

export default connect(mapStateToProps)(withStyles(styles)(PrescaleChangesTable));