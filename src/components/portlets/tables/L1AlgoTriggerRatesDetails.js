import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { unixToDatetime, dateToUnix } from '../../../utils/dateUtils';
import Datatable from '../generic/datatable/table/Table';
import grey from '@material-ui/core/colors/grey';
import axios from 'axios';

const COLUMNS = [
    {
        name: 'run_number', label: 'Run',
        props: {
            href: '/cms/runs/report?cms_run=%',
            params: ['run_number'],
            type: 'link'
        }
    },
//    { name: 'bit', label: 'Bit' },
//    { name: 'name', label: 'Name' },
    { name: 'start_time', label: 'Start time' },
    { name: 'end_time', label: 'End time' },
    { name: 'start_ls', label: 'Start LS' },
    { name: 'end_ls', label: 'End LS' }
];

const CR_COLUMNS = [{
    name: 'type',
    label: 'Type'
}, {
    name: 'avg',
    label: 'Avg'
}, {
    name: 'rms',
    label: 'RMS'
}, {
    name: 'min',
    label: 'Min'
}, {
    name: 'max',
    label: 'Max'
}];

const styles = {
    rowColumn: {
        fontWeight: 'bold',
        textAlign: 'center',
        color: grey[600],
        lineHeight: '24px'
    }
}

class L1AlgoTriggerRatesDetailsPortlet extends Component {

    constructor(props) {
        super(props);
        this.state = {
            data: null,
            countsData: null,
            ratesData: null,
        };
    }

    componentDidMount() {
        this.loadData();
    }

    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, this.loadData);
        this.props.shouldRefresh(this.props, this.loadData);
    }

    loadData = (query = this.props.query) => {
        this.props.showLoader();

        let BP = { cData: [], rData: [] };
        let preDT = { cData: [], rData: [] }
        let PDHLT = { cData: [], rData: [] }
        let PDuGT = { cData: [], rData: [] }
        let lumisections = [];
        let timestamps = [];

        const avg = (arr, tofixed = 2) => {
            if (arr.length) {
                const avg = arr.reduce((a, x) => a + x, 0) / arr.length;
                return avg.toFixed(tofixed);
            }
            return null;
        }
        const rms = (arr, tofixed = 2) => {
            // Root Mean Square
            if (arr.length) {
                const rms = Math.sqrt(arr.reduce((a, x) => (a + x * x), 0) / arr.length);
                return rms.toFixed(tofixed);
            }
            return null;
        }
        const min = (arr, tofixed = 2) => { return (arr.length > 0) ? Math.min(...arr).toFixed(tofixed) : null; }
        const max = (arr, tofixed = 2) => { return (arr.length > 0) ? Math.max(...arr).toFixed(tofixed) : null; }

        const getDetails = (type, row) => {
            return {
                attributes: {
                    type: type,
                    avg: avg(row), rms: rms(row),
                    min: min(row), max: max(row)
                }
            }
        }

        axios.all([
            this.props.fetchData('l1algorithmtriggers', {
                page: 1,
                pagesize: 100000,
                include: ['presentation_timestamp'],
                group: { key: 'granularity', value: 'lumisection' }
            }),
            this.props.fetchData('l1algorithmtriggers', {
                page: 1,
                pagesize: 100000,
                fields: ['name'],
                group: { key: 'granularity', value: 'run' }
            })
        ])
            .then(axios.spread((triggerRatesResp, triggerResp) => {

                const { data: triggerRates } = triggerRatesResp.data;
                const { data: trigger } = triggerResp.data;

                // Handle empty data response
                if (!triggerRates.length && !trigger.length) {
                    this.setState({
                        data: null,
                        countsData: null,
                        ratesData: null
                    });
                    return this.props.onEmpty();
                }

                triggerRates.forEach(row => {
                    row = row.attributes;

                    BP.cData.push(row.pre_dt_before_prescale_counter);
                    BP.rData.push(row.pre_dt_before_prescale_rate);
                    preDT.cData.push(row.pre_dt_counter);
                    preDT.rData.push(row.pre_dt_rate);
                    PDHLT.cData.push(row.post_dt_hlt_counter);
                    PDHLT.rData.push(row.post_dt_hlt_rate);
                    PDuGT.cData.push(row.post_dt_ugt_counter);
                    PDuGT.rData.push(row.post_dt_ugt_rate);
                    lumisections.push(row.last_lumisection_number);
                    timestamps.push(dateToUnix(row.start_time));
                });
                const triggerName = (trigger) ? (trigger.length > 0) ? trigger[0].attributes.name : null : null;

                this.setState({
                    countsData: [
                        getDetails('before prescale', BP.cData),
                        getDetails('pre-DeadTime (after prescale)', preDT.cData),
                        getDetails('post-DeadTime by HLT', PDHLT.cData),
                        getDetails('post-DeadtTime by uGT', PDuGT.cData)
                    ],
                    ratesData: [
                        getDetails('before prescale', BP.rData),
                        getDetails('pre-DeadTime (after prescale)', preDT.rData),
                        getDetails('post-DeadTime by HLT', PDHLT.rData),
                        getDetails('post-DeadtTime by uGT', PDuGT.rData)
                    ],
                    data: [{
                        attributes: {
                            run_number: query.cms_run,
                            bit: query.cms_l1_bit,
                            name: triggerName,
                            start_time: unixToDatetime(min(timestamps, 0)),
                            end_time: unixToDatetime(max(timestamps, 0)),
                            start_ls: min(lumisections, 0),
                            end_ls: max(lumisections, 0)
                        }
                    }]
                });
                this.props.setTitle( 'Bit ' + query.cms_l1_bit + ' : ' + triggerName);
                this.props.hideLoader();
            }))
            .catch(error => this.props.onFailure(error));
    }

    render() {
        const { data, countsData, ratesData } = this.state;
        if (!data || !countsData || !ratesData) return <div />;

        const { classes } = this.props;
        return (
            <div>
                <Datatable
                    data={data}
                    columns={COLUMNS}
                    showFooter={false}
                    vertical={true}
                    height={175}
                />
                <div className={classes.rowColumn}>Rate Hz</div>
                <Datatable
                    data={ratesData}
                    columns={CR_COLUMNS}
                    showFooter={false}
                    height={175}
                />
                <div className={classes.rowColumn}>Counts</div>
                <Datatable
                    data={countsData}
                    columns={CR_COLUMNS}
                    showFooter={false}
                    height={175}
                />                
            </div>
        );
    }
}

export default withStyles(styles)(L1AlgoTriggerRatesDetailsPortlet);
