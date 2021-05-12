import React, { Component } from 'react';
import Datatable from '../generic/datatable/table/Table';
import { createAdaptedSelectors } from '../PortletUtils';

const COLUMNS = [
    {
        label: "Start Time",
        name: "start_time"
    },
    {
        label: "End Time",
        name: "end_time"
    },
    {
        name: 'fills',
        label: 'Fill Summary',
        props: {
            href: '/cms/fills/summary?cms_fill_from=%&cms_fill_to=%',
            params: ['fillFrom', 'fillTo'],
            type: 'link'
        }
    },
    {
        name: 'runtimes',
        label: 'Runtimes',
        props: {
            href: '/cms/runtimes/analysis?cms_fill_from=%&cms_fill_to=%',
            params: ['fillFrom', 'fillTo'],
            type: 'link'
        }
    },
    {
        name: 'runs',
        label: 'Run Summary',
        props: {
            href: '/cms/runs/summary?cms_run_from=%&cms_run_to=%',
            params: ['runFrom', 'runTo'],
            type: 'link'
        }
    },
    {
        label: "Del. Lumi",
        name: "delivered_lumi",
        show_units: true,
        type: "fraction",
        units: "{\\mu}b^{-1}"
    },
    {
        label: "Rec. Lumi",
        name: "recorded_lumi",
        show_units: true,
        type: "fraction",
        units: "{\\mu}b^{-1}"
    },
    {
        label: "Eff By Lumi",
        name: "efficiency_lumi",
        show_units: true,
        props: {
            ndigits: 2,
            type: "efficiency"
        }
    },
    {
        label: "Max Init Lumi",
        name: "max_init_lumi",
        show_units: true,
        type: "fraction",
        units: "10^{27}cm^{-2}s^{-1}"
    },
    {
        label: "Max Pileup",
        name: "max_pileup",
        type: "fraction"
    }
];


class SummaryTable extends Component {

    constructor(props) {
        super(props);
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
        const params = { page: 1, include: ['presentation_timestamp'], selectors: createAdaptedSelectors(this.props.selectors.in, { datetime_from: "start_time", datetime_to: "start_time" }) };

        this.props.fetchData('lumisummaries', params)
            .then(resp => {
                const { data } = resp.data;

                // Handle empty data response
                if (!data.length) {
                    this.setState({ data: null });
                    return this.props.onEmpty();
                }

                // Modify dataset
                const summaryData = data.map(row => {

                    const {
                        first_run_number, last_run_number, first_fill_number,
                        last_fill_number, delivered_lumi, recorded_lumi
                    } = row.attributes;

                    const runFrom = first_run_number;
                    const runTo = last_run_number;

                    const fillFrom = first_fill_number;
                    const fillTo = last_fill_number;

                    row.attributes = {
                        ...row.attributes,
                        runFrom: runFrom, runTo: runTo,
                        runs: `${runFrom} - ${runTo}`,
                        runtimes: `${fillFrom} - ${fillTo}`,
                        fillFrom: fillFrom, fillTo: fillTo,
                        fills: `${fillFrom} - ${fillTo}`,
                        efficiency_lumi: (recorded_lumi / delivered_lumi * 100).toFixed(3)
                    };
                    return row;
                });

                this.setState({ data: summaryData });
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

export default SummaryTable;