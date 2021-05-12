import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import Datatable from '../generic/datatable/table/Table';
import Chip from '@material-ui/core/Chip';
import { aggregateData, addColumnUnits, transformData } from '../generic/datatable/table/utils';
import { toUrlQuery } from '../../../utils/utils';
import { createAdaptedSelectorsKeepAll } from '../PortletUtils';

function mapStateToProps(state) {
    return { md: state.md };
}

const styles = theme => ({
    chip: {
        margin: theme.spacing(0.5),
        marginLeft: 0
    },
});

class DowntimesTable extends Component {

    constructor(props) {
        super(props);

        this.state = {
            fullData: null,
            data: null,
            columns: [],
            categories: []
        }
        this.mdData = null;
        this.params = { page: 1, pagesize: 1000, include: ['presentation_timestamp'], sorting: ['-fill_number'] };
        if (props.configuration.selectors) {
            const portletSelectors = props.selectors.in || [];
            this.params.selectors = createAdaptedSelectorsKeepAll(portletSelectors, props.configuration.selectors);
        }
        if (props.configuration.columns)
            this.columns = props.configuration.columns;
        else
          this.columns = [{
            label: "Fill",
            name: "fill_number",
            style: { minWidth: 50 },
            props: {
                href: "/cms/fills/report?cms_fill=%",
                params: ["fill_number"],
                type: "link"
            }
        }, {
            label: "Run",
            name: "run_number",
            style: { minWidth: 50 },
            props: {
                href: "/cms/runs/report?cms_run=%",
                params: [
                    "run_number"
                ],
                type: "link"
            }
        }, {
            label: "Group",
            name: "group"
        }, {
            label: "Category",
            name: "category"
        }, {
            label: "Details",
            name: "details"
        }, {
            label: "Lost Lumi",
            name: "lost_lumi",
            numeric: true,
            show_units: true,
            type: 'fraction',
            units: 'pb^{-1}',
            aggregate: 'sum',
            style: { minWidth: 80 }
        }, {
            label: "Duration",
            name: "duration",
            numeric: true,
            aggregate: 'sum',
            props: { type: 'duration' },
            style: { minWidth: 80 }
        }, {
            label: "Start Time",
            name: "start_time"
        }, {
            label: "End Time",
            name: "end_time"
        }];
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
        if (this.mdData.selector !== 'cms_downtime_category') return;

        const { category } = this.mdData;
        return this.updateData(category);
    }

    updateData = (category) => {
        const { categories, order, orderBy } = this.state;

        const newCategories = categories.includes(category) ?
            categories.filter(c => c !== category) :
            categories.concat([category]);

        this.setState({
            categories: newCategories,
            data: this.filterAndSortData(newCategories,order,orderBy)
        });
        this.props.hideLoader();
    }

    filterAndSortData = (categories, order, orderBy) => {
        const { fullData } = this.state;

        const data = categories.length ?
            fullData.filter(row => categories.includes(row.attributes.category)) :
            fullData;

        if (orderBy)
            data.sort( (row1, row2) => {
                let r1r2 = 0;
                if ( isNaN(row1.attributes[orderBy]) || isNaN(row1.attributes[orderBy]) ) {
                    if (row1.attributes[orderBy] === row2.attributes[orderBy])
                        return 0;                        
                    r1r2 = order === 'asc' ? row1.attributes[orderBy].toString() > row2.attributes[orderBy].toString()
                                           : row2.attributes[orderBy].toString() > row1.attributes[orderBy].toString();
                } else {
                    r1r2 = order === 'asc' ? row1.attributes[orderBy] - row2.attributes[orderBy]
                                                 : row2.attributes[orderBy] - row1.attributes[orderBy];
                }
                return r1r2;
            });

        const aggData = aggregateData(data, this.columns);
        if (aggData)
            data.push(aggData);
            
        return data;
    }

    loadData = () => {
        const { order, orderBy } = this.state;
        this.params.sorting = orderBy ? [(order === 'asc' ? '' : '-') + orderBy] : null;
        this.props.showLoader();


        this.props.fetchData(this.props.configuration.endpoint, this.params)
            .then(resp => {
                const { data, meta } = resp.data;
                const aggData = aggregateData(data, this.columns);
                this.setState({
                    fullData: data,
                    data: aggData ? data.concat(aggData) : data,
                    columns: addColumnUnits(transformData(data, meta), this.columns)
                });
                this.props.hideLoader();
            })
            .catch(error => this.props.onFailure(error));
    }

    onFilterRemove = (type, name) => () => {
        if (type === 'group') {
            const query = toUrlQuery({ ...this.props.query, cms_downtime_group: 'ALL' });
            this.props.changeURL('/cms/runtimes/downtimes' + query);
            return window.location.reload();
        }
        // category
        this.updateData(name);
    };

    onSort = (event, property) => {
        const { order, orderBy, categories } = this.state;
        const newOrder = (orderBy === property && order === 'desc') ? 'asc' : 'desc';
        this.setState({ order: newOrder, orderBy: property, data: this.filterAndSortData(categories,newOrder,property) });
    }

    render() {
        const { data, categories, columns, order, orderBy } = this.state;
        if (!data) return <div />;

        const { classes, query, portletHeight } = this.props;
        const group = 'cms_downtime_group' in query ? query.cms_downtime_group : null;
        return (
            <div>
                {group && <Chip label={group} onDelete={this.onFilterRemove('group', group)} className={classes.chip} />}
                {categories.length > 0 &&
                    categories.map(category =>
                        <Chip label={category} key={category}
                            onDelete={this.onFilterRemove('category', category)}
                            className={classes.chip}
                        />
                    )
                }
                <Datatable
                    data={data}
                    columns={columns}
                    showFooter={false}
                    height={portletHeight - 40}
                    order={order}
                    orderBy={orderBy}
                    onSort={this.onSort}
                />
            </div>
        );
    }
}

export default connect(mapStateToProps)(withStyles(styles)(DowntimesTable));