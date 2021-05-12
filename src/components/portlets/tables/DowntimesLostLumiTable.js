import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Datatable from '../generic/datatable/table/Table';
import { aggregateData, addColumnUnits, transformData } from '../generic/datatable/table/utils';
import { prettyFloat } from '../../../utils/prettyUtils';
import { masterDetails } from '../../../actions/appActions';
import { createAdaptedSelectorsKeepAll } from '../PortletUtils';

function mapStateToProps(state) {
    return { md: state.md };
}

function mapDispatchToProps(dispatch) {
    return {
        ...bindActionCreators({ masterDetails }, dispatch), dispatch
    };
}

class DowntimesLostLumiTable extends Component {

    constructor(props) {
        super(props);

        this.state = {
            columns: [],
            data: null
        }
        this.params = { page: 1, pagesize: 1000, include: ['presentation_timestamp'], sorting: ['group', 'category'] };
        if (props.configuration.selectors) {
            const portletSelectors = props.selectors.in || [];
            this.params.selectors = createAdaptedSelectorsKeepAll(portletSelectors, props.configuration.selectors);
        }
        this.columns = [{
            name: 'group',
            label: 'Group',
            props: {
                href: '/cms/downtimes/downtimes',
                query: '{ "cms_downtime_group": "%" }',
                params: ['group'],
                type: 'link_query'
            }
        }, {
            name: 'category',
            label: 'Category',
            props: {
                clickHandler: (row) => {
                    this.props.dispatch(masterDetails({
                        groupId: this.props.groupId,
                        body: { ...row, selector: this.props.selectors.out.length ? this.props.selectors.out[0].attributes.name : null }
                    }));
                },
                type: 'link_click'
            }
        }, {
            name: 'dt_events',
            label: 'Downtime Events',
            numeric: true,
            aggregate: 'sum',
            style: { minWidth: 80 }
        }, {
            name: 'lost_lumi',
            label: 'Lost Lumi',
            numeric: true,
            show_units: true,
            type: 'fraction',
            units: 'pb^{-1}',
            aggregate: 'sum',
            style: { minWidth: 80 }
        }, {
            name: 'lost_lumi_percentage',
            label: 'Lost Lumi Percentage',
            numeric: true,
            show_units: true,
            units: '\\%',
            style: { minWidth: 80 }
        }, {
            name: 'downtime',
            label: 'Downtime',
            numeric: true,
            aggregate: 'sum',
            props: { type: 'duration' },
            style: { minWidth: 80 }
        }, {
            name: 'downtime_percentage',
            label: 'Downtime Percentage',
            numeric: true,
            show_units: true,
            units: '\\%',
            style: { minWidth: 80 }
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

        this.props.fetchData(this.props.configuration.endpoint, this.params)
            .then(resp => {
                const { data, meta } = resp.data;
                let categories = {};
                let totalDowntime = 0;
                let totalLumi = 0;

                // Handle empty data response
                if (!data.length) {
                    this.setState({ data: null });
                    return this.props.onEmpty();
                }

                // Modify dataset
                data.forEach(row => {
                    const { category: c, group, lost_lumi, duration } = row.attributes;
                    if (!categories[c]) categories[c] = {};

                    // Group
                    if (!categories[c].group) categories[c].group = group;

                    // Lost lumi
                    if (!categories[c].lost_lumi) categories[c].lost_lumi = 0;
                    categories[c].lost_lumi += lost_lumi;

                    // Downtime
                    if (!categories[c].downtime) categories[c].downtime = 0;
                    categories[c].downtime += duration;

                    // Downtime Events
                    if (!categories[c].dt_events) categories[c].dt_events = 0;
                    categories[c].dt_events += duration ? 1 : 0;

                    // Total Downtime 
                    totalDowntime += duration ? duration : 0;

                    // Total Lumi 
                    totalLumi += lost_lumi ? lost_lumi : 0;
                });

                let downtimes = [];
                Object.keys(categories).forEach(c => {
                    downtimes.push({
                        attributes: {
                            category: c,
                            group: categories[c].group,
                            dt_events: categories[c].dt_events,
                            lost_lumi: categories[c].lost_lumi,
                            lost_lumi_percentage: prettyFloat(categories[c].lost_lumi / totalLumi * 100, 2),
                            downtime: categories[c].downtime,
                            downtime_percentage: prettyFloat(categories[c].downtime / totalDowntime * 100, 2)
                        }
                    });
                });

                const aggData = aggregateData(downtimes, this.columns);

                this.setState({
                    data: aggData ? downtimes.concat(aggData) : downtimes,
                    columns: addColumnUnits(transformData(data, meta), this.columns)
                });
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

export default connect(mapStateToProps, mapDispatchToProps)(DowntimesLostLumiTable);