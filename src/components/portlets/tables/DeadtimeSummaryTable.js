import React, { Component } from 'react';
import Datatable from '../generic/datatable/table/Table';

const COLUMNS = [
    {
        label: "Start Time",
        name: "start_time",
        valueStyle: { textAlign: 'right' }
    },
    {
        label: "End Time",
        name: "end_time",
        valueStyle: { textAlign: 'right' }
    },
    {
        name: 'fills',
        label: 'Fill Range',
        props: {
            href: '/cms/fills/summary?cms_fill_from=%&cms_fill_to=%',
            params: ['fillFrom', 'fillTo'],
            type: 'link'
        },
        valueStyle: { textAlign: 'right' }
    },
    {
        name: 'runs',
        label: 'Run Range',
        props: {
            href: '/cms/runs/summary?cms_run_from=%&cms_run_to=%',
            params: ['runFrom', 'runTo'],
            type: 'link'
        },
        valueStyle: { textAlign: 'right' }
    },
    {
        label: "Beam Active Deadtime",
        name: "ba_deadtime",
        show_units: true,
        numeric: true,
        units: "\\%",
        valueStyle: { textAlign: 'right' }
    },
    {
        label: "Overall Deadtime",
        name: "overall_deadtime",
        show_units: true,
        numeric: true,
        units: "\\%",
        valueStyle: { textAlign: 'right' }
    },
];

class DeadtimeSummaryTable extends Component {

    constructor(props) {
        super(props);

        this.state = {
            data: null
        };
        this.params = { page: 1, pagesize: 10000, include: ['turbo', 'presentation_timestamp'], group: { key: 'granularity', value: 'range' } };
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

        this.props.fetchData('deadtimesperrange', this.params)
            .then(resp => {
                if (!resp.data.data.length) {
                    this.setState({ data: null });
                    return this.props.onEmpty();
                }
                const { attributes } = resp.data.data[0];

                const runFrom = attributes.first_run_number;
                const runTo = attributes.last_run_number;

                const fillFrom = attributes.first_fill_number;
                const fillTo = attributes.last_fill_number;

                let tableData = [
                    {
                        attributes: {
                            start_time: attributes.start_time,
                            end_time: attributes.end_time,
                            runFrom: runFrom, runTo: runTo,
                            runs: `${runFrom} - ${runTo}`,
                            fillFrom: fillFrom, fillTo: fillTo,
                            fills: `${fillFrom} - ${fillTo}`,
                            ba_deadtime: attributes.deadtime_beamactive_total.toFixed(2),
                            overall_deadtime: attributes.deadtime_total.toFixed(2)
                        }
                    }];

                this.setState({ data: tableData });
                return this.props.hideLoader();
            })
            .catch(error => this.props.onFailure(error));
    }

    render() {
        const { data } = this.state;
        if (!data) return <div />;

        return (
            <Datatable
                data={data}
                columns={COLUMNS}
                showFooter={false}
                vertical={true}
                height={this.props.portletHeight}
            />
        );
    }
}

export default DeadtimeSummaryTable;