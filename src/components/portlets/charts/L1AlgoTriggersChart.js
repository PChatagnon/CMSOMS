import React, { Component } from 'react';
import { connect } from 'react-redux';
import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsOfflineExporting from 'highcharts/modules/offline-exporting';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { generateId, setHighchartsLibURL } from '../../../utils/utils';
import { dateToUnix, unixToDatetime } from '../../../utils/dateUtils';
import sizeMe from 'react-sizeme';
import axios from 'axios';

HighchartsExporting(Highcharts);
HighchartsOfflineExporting(Highcharts);
setHighchartsLibURL(Highcharts);

function mapStateToProps(state) {
    return { md: state.md };
}

const CancelToken = axios.CancelToken;

class L1AlgoTriggersChart extends Component {

    constructor(props) {
        super(props);
        this.chart = null;
        this.cancelSource = CancelToken.source();
        this.cancelToken = this.cancelSource.token;
        this.params = { page: 1, pagesize: 10000, include: ['turbo'], sorting: ['last_lumisection_number'] };
        this.id = generateId('algoChart');
        this.mdData = null;
        this.series = [];
        const { urlParams } = props;
        this.deselected = urlParams && urlParams.deselected && urlParams.deselected.length ? urlParams.deselected : [];
        this.displayType = 'lumi';
        this.timer = null;
        this._isMounted = false;
        this.postDT = props.configuration.postDT === 'ugt' ? 'post_dt_ugt_rate' : 'post_dt_hlt_rate';
    }

    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, () => {

            // Cancel all the pending requests when a query changes
            this.cancelRequests("componentDidUpdate: new Query");

            // Update all the series using the new query from the controller
            this.updateChart(true, this.props.query)
        });
        this.shouldUpdate(prevProps);
        this.props.shouldRefresh(this.props, () => this.updateChart(true, this.props.query));
        this.shouldResize();
    }

    componentDidMount() {
        this._isMounted = true;
        const _this = this;
        const options = {
            chart: {
                zoomType: 'x',
                height: this.props.portletHeight - 30
            },
            credits: {
                enabled: false
            },
            title: {
                text: null
            },
            xAxis: {
                title: {
                    text: 'Lumisection'
                }
            },
            plotOptions: {
                series: {
                    lineWidth: 2,
                    events: {
                        hide: function () {
                            const seriesData = this.chart.series.find(s => s.options.name === this.name);
                            _this.deselected.push(seriesData.options.id);
                            _this.props.addUrlParam({ [_this.props.id]: { deselected: _this.deselected } });
                        },
                        show: function () {
                            const seriesData = this.chart.series.find(s => s.options.name === this.name);
                            _this.deselected = _this.deselected.filter(id => id !== seriesData.options.id);
                            _this.props.addUrlParam({ [_this.props.id]: { deselected: _this.deselected } });
                        }
                    }
                }
            },
            yAxis: [{
                // Primary yAxis
                title: {
                    text: 'Rates [Hz]'
                }
            }, {
                // Secondary yAxis
                opposite: true,
                //max: 100,
                title: {
                    text: 'Percent [%]'
                },

            }],
            tooltip: {
                enabled: true,
                shared: true,
                formatter: function () {
                    let tooltip = _this.displayType === 'lumi' ? 'Lumisection: <b>' + this.x + '</b>' : 'Time: <b>' + unixToDatetime(this.x) + '</b>';
                    this.points.forEach((point) => {
                        tooltip += '<br/>' + point.series.name + ': <b>' + (Number.isInteger(point.y) ? point.y : point.y.toFixed(4)) + '</b>';
                    });
                    return tooltip;
                }
            },
            series: []
        };

        this.chart = new Highcharts.chart(this.id, options);
        this.setTimer();
        return this.props.onEmpty();
    }

    componentWillUnmount() {
        this.cancelSource.cancel("L1AlgoTriggersChart: component is unmounting");
        this._isMounted = false;
        this.chart.destroy();
        clearInterval(this.timer);
    }

    shouldResize() {
        if (this.chart && this.props.editMode) {
            const newSize = { width: this.props.size.width, height: this.props.portletHeight };
            const changed = this.haveSizeChanged(newSize);

            if (changed) {
                this.chart.setSize(newSize.width, newSize.height - 40);
            }
        }
    }

    cancelRequests = msg => {
        // Cancel all the pending requests
        this.cancelSource.cancel(msg);
        // Create a new cancel source for the upcoming requests
        this.cancelSource = CancelToken.source();
        this.cancelToken = this.cancelSource.token;
    }

    clearTimer = () => clearInterval(this.timer);

    setTimer = () => {
        const update = 'update' in this.props.query ? this.props.query.update : false;
        if (update) {
            clearInterval(this.timer);
            this.timer = setInterval(this.updateChart, 24000);
        }
    }

    // Check if there are new data from master-details channel
    shouldUpdate(prevProps) {
        if (!this._isMounted) return;

        const { groupId } = this.props;
        if (this.props.md[groupId] === prevProps.md[groupId]) return;

        this.mdData = this.props.md[groupId];
        let id = null;
        switch (this.mdData.selector) {
            case 'l1_trigger_bit':
                id = this.mdData.row.attributes.bit.toString();
                this.loadData(id + "_pre", this.addTriggersSeries);
                this.loadData(id + "_post", this.addTriggersSeries);
                return;
            case 'l1_trigger_key':
                id = this.mdData.row.attributes.key;
                this.loadData(id, this.addTriggerRatesSeries);
                return;
            case 'l1_ba_deadtime':
                id = this.mdData.row.attributes.key;
                this.loadData(id + "-ba", this.addDeadtimesSeries);
                return;
            case 'l1_oa_deadtime':
                id = this.mdData.row.attributes.key;
                this.loadData(id + "-oa", this.addOverallDeadtimesSeries);
                return;
            default:
                return;
        }
    }

    loadData = (id, fetchSeriesData) => {
        let series = this.chart.get(id);

        // Row selection
        if (this.mdData.selected && !series) {
            this.clearTimer();
            fetchSeriesData(id, this.mdData.row.attributes.name)
                .then(() => {
                    if (this.chart.series) this.chart.redraw();
                    this.props.hideLoader();
                    this.setTimer();
                });
        }

        // Row deselection
        if (!this.mdData.selected) {

            if (series) {
              series.remove();
              if (this.chart.colorCounter>0) this.chart.colorCounter--;
              if (this.chart.symbolCounter>0) this.chart.symbolCounter--;
            }
            else this.cancelRequests('Pending request was canceled by deselecting MD row.');

            this.setTimer();
            if (this.chart.series.length === 0) {
                return this.props.onEmpty();
            }
        }
    }

    handleError = error => {
        if (axios.isCancel(error)) {
            console.log('Request canceled', error);
            return error;
        }
        return this.props.onFailure(error);
    }

    updateChart = (hardReload = false, query = this.props.query) => {
        if (!this._isMounted) return;
        if (this.chart.series.length === 0) return;
        this.props.showLoader();
        this.clearTimer();

        // Iterate over series and update each independently
        Promise.all(
            this.chart.series.map(series => {
                const { id } = series.options;
                const seriesData = this.series.find(s => s.id === id);

                if (hardReload) {
                    seriesData.lumi = [];
                    seriesData.utc = [];
                }

                let updateFunction = null;
                switch (seriesData.type) {
                    case 'algoTriggers':
                        updateFunction = this.updateTriggersSeries;
                        break;
                    case 'beamActiveDeadtimes':
                        updateFunction = this.updateDeadtimesSeries;
                        break;
                    case 'overallDeadtimes':
                        updateFunction = this.updateOverallDeadtimesSeries;
                        break;
                    case 'triggerRates':
                        updateFunction = this.updateTriggerRatesSeries;
                        break;
                    default:
                        updateFunction = null;
                        break;
                }
                return updateFunction(id, series, seriesData, query);
            })
        ).then(resp => {
            // Do not redraw if request is canceled - new one is coming instead
            if (axios.isCancel(resp[0])) return;

            // Redraw once all the series finishes to update and hide loader
            this.chart.redraw();
            this.props.hideLoader();
            this.setTimer();
        });
    }

    addTriggersSeries = (id, label) => {
        this.props.showLoader();
        const triggerData = id.split("_");
        const triggerKey = triggerData[1] === "pre" ? "pre_dt_before_prescale_rate" : this.postDT;
        const labelPrefix = triggerData[1] === "pre" ? "Pre-DT BP " : "Post-DT ";

        let series = { id: id, name: labelPrefix + label, data: null, visible: this.deselected.includes(id) ? false : true };
        const params = {
            ...this.params,
            query: { ...this.props.query, cms_l1_bit: triggerData[0] },
            cancelToken: this.cancelToken,
            fields: [triggerKey, 'last_lumisection_number', 'start_time'],
            group: { key: 'granularity', value: 'lumisection' }
        };

        let lumiData = [];
        let utcData = [];
        let lastLumiIndex = null;

        return this.props.fetchData('l1algorithmtriggers', params)
            .then(resp => {
                if (!this._isMounted) return;
                resp.data.data.forEach(row => {
                    const value = row.attributes[triggerKey];

                    if (value === null && lastLumiIndex === null) {
                        lastLumiIndex = lumiData.length;
                    }

                    lumiData.push([row.attributes.last_lumisection_number, value]);
                    if (row.attributes.start_time) {
                        utcData.push([dateToUnix(row.attributes.start_time), value]);
                    }
                });
                series.data = this.displayType === 'lumi' ? [...lumiData] : [...utcData];
                this.series.push({ id: id, 'lumi': lumiData, 'utc': utcData, type: 'algoTriggers', lastLumiIndex: lastLumiIndex });
                this.chart.addSeries(series, false);
            })
            .catch(error => this.handleError(error));
    }

    addDeadtimesSeries = (id, label) => {
        this.props.showLoader();
        const key = id.split("-")[0];

        let series = { id: id, name: label + ' BA DT', data: null, visible: this.deselected.includes(id) ? false : true, yAxis: 1 };
        const params = { 
            ...this.params,
            query: { ...this.props.query },
            cancelToken: this.cancelToken,
            fields: [key, 'last_lumisection_number', 'start_time'],
            group: { key: 'granularity', value: 'lumisection' }
        };

        let lumiData = [];
        let utcData = [];
        let lastLumiIndex = null;

        return this.props.fetchData('deadtimes', params)
            .then(resp => {
                if (!this._isMounted) return;
                resp.data.data.forEach(row => {
                    const value = row.attributes[key].percent;

                    if (value === null && lastLumiIndex === null) {
                        lastLumiIndex = lumiData.length;
                    }

                    lumiData.push([row.attributes.last_lumisection_number, value]);
                    if (row.attributes.start_time) {
                        utcData.push([dateToUnix(row.attributes.start_time), value]);
                    }
                });
                series.data = this.displayType === 'lumi' ? [...lumiData] : [...utcData];
                this.series.push({ id: id, 'lumi': lumiData, 'utc': utcData, type: 'beamActiveDeadtimes', lastLumiIndex: lastLumiIndex });
                this.chart.addSeries(series, false);
            })
            .catch(error => this.handleError(error));
    }

    addOverallDeadtimesSeries = (id, label) => {
        this.props.showLoader();
        const key = id.split("-")[0];

        let series = { id: id, name: label + ' Overall DT', data: null, visible: this.deselected.includes(id) ? false : true, yAxis: 1 };
        const params = {
            ...this.params,
            query: { ...this.props.query },
            cancelToken: this.cancelToken,
            fields: [key, 'last_lumisection_number', 'start_time'],
            group: { key: 'granularity', value: 'lumisection' }
        };

        let lumiData = [];
        let utcData = [];
        let lastLumiIndex = null;

        return this.props.fetchData('deadtimes', params)
            .then(resp => {
                if (!this._isMounted) return;
                resp.data.data.forEach(row => {
                    const value = row.attributes[key].percent;

                    if (value === null && lastLumiIndex === null) {
                        lastLumiIndex = lumiData.length;
                    }

                    lumiData.push([row.attributes.last_lumisection_number, value]);
                    if (row.attributes.start_time) {
                        utcData.push([dateToUnix(row.attributes.start_time), value]);
                    }
                });
                series.data = this.displayType === 'lumi' ? [...lumiData] : [...utcData];
                this.series.push({ id: id, 'lumi': lumiData, 'utc': utcData, type: 'overallDeadtimes', lastLumiIndex: lastLumiIndex });
                this.chart.addSeries(series, false);
            })
            .catch(error => this.handleError(error));
    }

    addTriggerRatesSeries = (id, label) => {
        this.props.showLoader();

        let series = { id: id, name: label, data: null, visible: this.deselected.includes(id) ? false : true };
        const params = {
            ...this.params,
            query: { ...this.props.query },
            cancelToken: this.cancelToken,
            fields: [id, 'last_lumisection_number', 'start_time'],
            group: { key: 'granularity', value: 'lumisection' },
            filters: [{
                attribute: 'last_lumisection_number',
                operator: 'GT',
                value: 0
            }]
        };

        let lumiData = [];
        let utcData = [];
        let lastLumiIndex = null;

        return this.props.fetchData('l1triggerrates', params)
            .then(resp => {
                if (!this._isMounted) return;
                resp.data.data.forEach(row => {
                    const value = row.attributes[id].rate;

                    if (value === null && lastLumiIndex === null) {
                        lastLumiIndex = lumiData.length;
                    }

                    lumiData.push([row.attributes.last_lumisection_number, value]);
                    if (row.attributes.start_time) {
                        utcData.push([dateToUnix(row.attributes.start_time), value]);
                    }
                });
                series.data = this.displayType === 'lumi' ? [...lumiData] : [...utcData];
                this.series.push({ id: id, 'lumi': lumiData, 'utc': utcData, type: 'triggerRates', lastLumiIndex: lastLumiIndex });
                this.chart.addSeries(series, false);
            })
            .catch(error => this.handleError(error));
    }

    updateTriggersSeries = (id, series, seriesData, query) => {
        let latestLumi = seriesData.lumi.length > 0 ? seriesData.lumi[seriesData.lumi.length - 1][0] : 0;

        if (seriesData.lastLumiIndex && seriesData.lumi.length > 0) {
            latestLumi = seriesData.lumi[seriesData.lastLumiIndex - 1][0];
            seriesData.lumi = seriesData.lumi.slice(0, seriesData.lastLumiIndex);
            seriesData.lastLumiIndex = null;
        }

        const triggerData = id.split("_");
        const triggerKey = triggerData[1] === "pre" ? "pre_dt_before_prescale_rate" : this.postDT;

        const params = {
            ...this.params,
            query: { ...query, cms_l1_bit: triggerData[0] },
            cancelToken: this.cancelToken,
            fields: [triggerKey, 'last_lumisection_number', 'start_time'],
            group: { key: 'granularity', value: 'lumisection' },
            filters: [{
                attribute: 'last_lumisection_number',
                operator: 'GT',
                value: latestLumi
            }]
        };

        return this.props.fetchData('l1algorithmtriggers', params)
            .then(resp => {
                if (!this._isMounted) return;
                resp.data.data.forEach(row => {
                    const value = row.attributes[triggerKey];

                    if (value === null && seriesData.lastLumiIndex === null) {
                        seriesData.lastLumiIndex = seriesData.lumi.length;
                    }

                    seriesData.lumi.push([row.attributes.last_lumisection_number, value]);
                    if (row.attributes.start_time) {
                        seriesData.utc.push([dateToUnix(row.attributes.start_time), value]);
                    }
                });
                series.update({ data: this.displayType === 'lumi' ? [...seriesData.lumi] : [...seriesData.utc] }, false);
            })
            .catch(error => this.handleError(error));
    }

    updateDeadtimesSeries = (id, series, seriesData, query) => {
        let latestLumi = seriesData.lumi.length > 0 ? seriesData.lumi[seriesData.lumi.length - 1][0] : 0;

        if (seriesData.lastLumiIndex && seriesData.lumi.length > 0) {
            latestLumi = seriesData.lumi[seriesData.lastLumiIndex - 1][0];
            seriesData.lumi = seriesData.lumi.slice(0, seriesData.lastLumiIndex);
            seriesData.lastLumiIndex = null;
        }

        const key = id.split("-")[0];

        const params = {
            ...this.params,
            query: { ...query },
            cancelToken: this.cancelToken,
            fields: [key, 'last_lumisection_number', 'start_time'],
            group: { key: 'granularity', value: 'lumisection' },
            filters: [{
                attribute: 'last_lumisection_number',
                operator: 'GT',
                value: latestLumi
            }]
        };

        return this.props.fetchData('deadtimes', params)
            .then(resp => {
                if (!this._isMounted) return;
                resp.data.data.forEach(row => {
                    const value = row.attributes[key].percent;

                    if (value === null && seriesData.lastLumiIndex === null) {
                        seriesData.lastLumiIndex = seriesData.lumi.length;
                    }

                    seriesData.lumi.push([row.attributes.last_lumisection_number, value]);
                    if (row.attributes.start_time) {
                        seriesData.utc.push([dateToUnix(row.attributes.start_time), value]);
                    }
                });
                series.update({ data: this.displayType === 'lumi' ? [...seriesData.lumi] : [...seriesData.utc] }, false);
            })
            .catch(error => this.handleError(error));
    }

    updateOverallDeadtimesSeries = (id, series, seriesData, query) => {
        let latestLumi = seriesData.lumi.length > 0 ? seriesData.lumi[seriesData.lumi.length - 1][0] : 0;

        if (seriesData.lastLumiIndex && seriesData.lumi.length > 0) {
            latestLumi = seriesData.lumi[seriesData.lastLumiIndex - 1][0];
            seriesData.lumi = seriesData.lumi.slice(0, seriesData.lastLumiIndex);
            seriesData.lastLumiIndex = null;
        }

        const key = id.split("-")[0];

        const params = {
            ...this.params,
            query: { ...query },
            cancelToken: this.cancelToken,
            fields: [key, 'last_lumisection_number', 'start_time'],
            filters: [{
                attribute: 'last_lumisection_number',
                operator: 'GT',
                value: latestLumi
            }],
            group: { key: 'granularity', value: 'lumisection' }
        };

        return this.props.fetchData('deadtimes', params)
            .then(resp => {
                if (!this._isMounted) return;
                resp.data.data.forEach(row => {
                    const value = row.attributes[key].percent;

                    if (value === null && seriesData.lastLumiIndex === null) {
                        seriesData.lastLumiIndex = seriesData.lumi.length;
                    }

                    seriesData.lumi.push([row.attributes.last_lumisection_number, value]);
                    if (row.attributes.start_time) {
                        seriesData.utc.push([dateToUnix(row.attributes.start_time), value]);
                    }
                });
                series.update({ data: this.displayType === 'lumi' ? [...seriesData.lumi] : [...seriesData.utc] }, false);
            })
            .catch(error => this.handleError(error));
    }

    updateTriggerRatesSeries = (id, series, seriesData, query) => {
        let latestLumi = seriesData.lumi.length > 0 ? seriesData.lumi[seriesData.lumi.length - 1][0] : 0;

        if (seriesData.lastLumiIndex && seriesData.lumi.length > 0) {
            latestLumi = seriesData.lumi[seriesData.lastLumiIndex - 1][0];
            seriesData.lumi = seriesData.lumi.slice(0, seriesData.lastLumiIndex);
            seriesData.lastLumiIndex = null;
        }

        const params = {
            ...this.params,
            query: { ...query },
            cancelToken: this.cancelToken,
            fields: [id, 'last_lumisection_number', 'start_time'],
            group: { key: 'granularity', value: 'lumisection' },
            filters: [{
                attribute: 'last_lumisection_number',
                operator: 'GT',
                value: latestLumi
            }]
        };

        return this.props.fetchData('l1triggerrates', params)
            .then(resp => {
                if (!this._isMounted) return;
                resp.data.data.forEach(row => {
                    const value = row.attributes[id].rate;

                    if (value === null && seriesData.lastLumiIndex === null) {
                        seriesData.lastLumiIndex = seriesData.lumi.length;
                    }

                    seriesData.lumi.push([row.attributes.last_lumisection_number, value]);
                    if (row.attributes.start_time) {
                        seriesData.utc.push([dateToUnix(row.attributes.start_time), value]);
                    }
                });
                series.update({ data: this.displayType === 'lumi' ? [...seriesData.lumi] : [...seriesData.utc] }, false);
            })
            .catch(error => this.handleError(error));
    }

    handleLogScale = (event, isChecked) => {
        const type = isChecked ? 'logarithmic' : 'linear';
        this.chart.yAxis[0].update({ type: type });
        this.chart.yAxis[1].update({ type: type });
    }

    handleDisplayChange = (event, isChecked) => {
        this.displayType = isChecked ? 'utc' : 'lumi';

        // Update all the series to use different data for x axis
        this.chart.series.forEach(series => {
            const { id } = series.options;
            const data = this.series.find(s => s.id === id);
            series.setData([...data[this.displayType]]);
        });

        // Change x axis title and type
        this.chart.xAxis[0].update({
            type: isChecked ? 'datetime' : 'linear',
            title: {
                text: isChecked ? 'Time [UTC]' : 'Lumisection',
            }
        });
    }

    haveSizeChanged = (newSize) => {
        return newSize.width !== this.chart.chartWidth || newSize.height !== this.chart.chartHeight;
    }

    render() {
        return (
            <div>
                <div id={this.id} />
                <FormControlLabel
                    style={{ marginTop: -10, marginLeft: 5 }}
                    control={<Checkbox color="primary" onChange={this.handleLogScale} />}
                    label="Logarithmic scale"
                />
                <FormControlLabel
                    style={{ marginTop: -10, marginLeft: 5 }}
                    control={<Checkbox color="primary" onChange={this.handleDisplayChange} />}
                    label="Display time in UTC"
                />
            </div>
        );
    }
}

export default sizeMe({ monitorWidth: true })(
    connect(mapStateToProps)(L1AlgoTriggersChart)
);
