import React, { Component } from 'react';
import Datatable from '../generic/datatable/table/Table';
import moment from 'moment';
import { formatDate } from '../../../utils/dateUtils';

const COLUMNS = [{
    name: 'year',
    label: 'Year'
}, {
    name: 'week',
    label: 'Week'
}, {
    name: 'dateRange',
    label: 'Date Range'
}, {
    name: 'peaklumi',
    label: 'Peak Lumi',
    units: '10^{34}cm^{-2}s^{-1}',
    show_units: true
}, {
    name: 'delivered',
    label: 'Delivered Lumi',
    units: 'pb^{-1}',
    show_units: true
}, {
    name: 'recorded',
    label: 'Recorded Lumi',
    units: 'pb^{-1}',
    show_units: true
}, {
    name: 'efficiency_lumi',
    label: 'Efficiency by Lumi',
    units: '\\%',
    show_units: true
}, {
    name: 'efficiency_time',
    label: 'Efficiency by Time',
    units: '\\%',
    show_units: true
}, {
    name: 'overall_downtime',
    label: 'Overall Downtime',
    props: { type: 'duration' }
}, {
    name: 'runtime_type',
    label: 'Runtime Type'
}, {
    name: 'lastupdate',
    label: 'Last Update'
}, {
    name: 'runs',
    label: 'Run Summary',
    props: {
        href: '/cms/runs/summary?cms_run_from=%&cms_run_to=%',
        params: ['runFrom', 'runTo'],
        type: 'link'
    }
}, {
    name: 'fills',
    label: 'Fill Summary',
    props: {
        href: '/cms/fills/summary?cms_fill_from=%&cms_fill_to=%',
        params: ['fillFrom', 'fillTo'],
        type: 'link'
    }
}, {
    name: 'downtimes',
    label: 'Downtimes',
    props: {
        href: '/cms/runtimes/downtimes?cms_fill_from=%&cms_fill_to=%',
        params: ['fillFrom', 'fillTo'],
        type: 'link'
    }
}];

class WeeklySummary extends Component {

    constructor(props) {
        super(props);
        this.params = { page: 1, include: ['turbo', 'presentation_timestamp', 'runs', 'fills'] };
        this.state = {
            data: null
        };
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

        this.props.fetchData('weeklysummaries', this.params)
            .then(resp => {
                const { data } = resp.data;

                // Handle empty data response
                if (!data.length) {
                    this.setState({ data: null });
                    return this.props.onEmpty();
                }

                // Modify dataset
                const weeklyData = data.map(row => {
                    const { year, week } = row.attributes;
                    const dateFrom = moment().year(year).week(week).isoWeekday(1);
                    const dateTo = moment().year(year).week(week).isoWeekday(7);

                    const runs = row.relationships.runs.data;
                    const runFrom = runs[0].id;
                    const runTo = runs[runs.length - 1].id;

                    const fills = row.relationships.fills.data;
                    const fillFrom = fills[0].id;
                    const fillTo = fills[fills.length - 1].id;

                    delete row.relationships;
                    row.attributes = {
                        ...row.attributes,
                        dateRange: `${formatDate(dateFrom)} - ${formatDate(dateTo)}`,
                        runFrom: runFrom, runTo: runTo,
                        runs: `${runFrom} - ${runTo}`,
                        fillFrom: fillFrom, fillTo: fillTo,
                        fills: `${fillFrom} - ${fillTo}`,
                        downtimes: `${fillFrom} - ${fillTo}`,
                    };
                    return row;
                });

                this.setState({ data: weeklyData });
                this.props.hideLoader();
            })
            .catch(error => this.props.onFailure(error));
    }

    render() {
        const { data } = this.state;
        if (!data) return <div />;

        return (
            <Datatable
                vertical={true}
                data={data}
                columns={COLUMNS}
                showFooter={false}
                height={this.props.portletHeight}
            />
        );
    }
}

export default WeeklySummary;