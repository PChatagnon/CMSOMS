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
//import { ENGINE_METHOD_NONE } from 'constants';

HighchartsExporting(Highcharts);
HighchartsOfflineExporting(Highcharts);
setHighchartsLibURL(Highcharts);

function mapStateToProps(state) {
    return { md: state.md };
}

const CancelToken = axios.CancelToken;

class ChartMD extends Component {

    constructor(props) {
        super(props);
        this.chart = null;
        this.cancelSource = CancelToken.source();
        this.cancelToken = this.cancelSource.token;
        this.params = { page: 1, pagesize: 10000 };
        this.id = generateId('ChartMD');
        this.mdData = null;
        this.series = [];
        const { urlParams } = props;
        this.deselected = urlParams && urlParams.deselected && urlParams.deselected.length ? urlParams.deselected : [];
        this.displayType = 'ls';
        this.timer = null;
        this._isMounted = false;
    }

    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, () => {

            // Cancel all the pending requests when a query changes
            this.cancelRequests("ChartMD: new Query");

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
            }],
            tooltip: {
                enabled: true,
                shared: true,
                formatter: function () {
                    let tooltip = _this.displayType === 'ls' ? 'Lumisection: <b>' + this.x + '</b>' : 'Time: <b>' + unixToDatetime(this.x) + '</b>';
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
        this.cancelSource.cancel("ChartMD: component is unmounting");
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
        const plotProps = this.mdData.selector && this.props.configuration && this.props.configuration.plots && this.mdData.selector in this.props.configuration.plots ? this.props.configuration.plots[this.mdData.selector] : null;
        if (plotProps)
            this.loadData(plotProps, this.addSeries);
    }

    loadData = (plotProps, fetchSeriesData) => {
        let series = this.chart.get(this.mdData.row.attributes[plotProps.filterAttributeFromTable]);

        // Row selection
        if (this.mdData.selected && !series) {
            this.clearTimer();
            fetchSeriesData(this.mdData, plotProps)
                .then(() => {
                    if (this.chart.series) this.chart.redraw();
                    this.props.hideLoader();
                    this.setTimer();
                });
        }

        // Row deselection
        if (!this.mdData.selected) {

            if (series) series.remove();
            else this.cancelRequests('ChartMD: Pending request was canceled by deselecting MD row.');

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
                    seriesData.ls = [];
                    seriesData.utc = [];
                }

                let updateFunction = this.updateSeries;
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

    getQueryParams = (id, plotProps) => {
        let fields = [plotProps.yAttribute];
        let filters = [];
        let sorting = null;

        if (plotProps.lumisectionAttribute) {
            fields.push(plotProps.lumisectionAttribute);
            filters.push({ attribute: plotProps.lumisectionAttribute, operator: 'GT', value: 0 });
            if (!sorting)
                sorting = [plotProps.lumisectionAttribute];
        }
        if (plotProps.timestampAttribute) {
            fields.push(plotProps.timestampAttribute);
            if (!sorting)
                sorting = [plotProps.timestampAttribute];
        }

        if (plotProps.filterAttributeFromTable)
            filters.push({
                attribute: plotProps.filterAttributeFromTable,
                operator: 'EQ',
                value: id
            });

        const params = {
            ...this.params,
            query: { ...this.props.query },
            cancelToken: this.cancelToken,
            fields: fields,
            filters: filters,
            sorting: sorting,
            group: plotProps.granularity ? { key: 'granularity', value: plotProps.granularity } : undefined,
            aggpath: plotProps.aggpath ? plotProps.aggpath : undefined
        };
        return params;
    }

    addSeries = (mdData, plotProps) => {
        this.props.showLoader();

        const label = mdData.row.attributes[plotProps.filterAttributeFromTable];
        const id = label;

        let series = { id: id, name: label, data: null, visible: this.deselected.includes(id) ? false : true };
        let lsData = [];
        let utcData = [];
        let lastLsIndex = null;

        return this.props.fetchData(plotProps.endpoint, this.getQueryParams(id, plotProps))
            .then(resp => {
                if (!this._isMounted) return;
                resp.data.data.forEach(row => {
                    const value = row.attributes[plotProps.yAttribute];

                    if (value === null && lastLsIndex === null) {
                        lastLsIndex = lsData.length;
                    }

                    if (plotProps.lumisectionAttribute)
                        lsData.push([row.attributes[plotProps.lumisectionAttribute], value]);
                    if (plotProps.timestampAttribute) {
                        utcData.push([dateToUnix(row.attributes[plotProps.timestampAttribute]), value]);
                    }
                });
                series.data = this.displayType === 'ls' ? [...lsData] : [...utcData];
                this.series.push({ id: id, 'ls': lsData, 'utc': utcData, type: mdData.selector, lastLsIndex: lastLsIndex, plotProps: plotProps });
                this.chart.addSeries(series, false);
            })
            .catch(error => this.handleError(error));
    }

    updateSeries = (id, series, seriesData, query) => {
        //let latestLs = seriesData.ls.length > 0 ? seriesData.ls[seriesData.ls.length - 1][0] : 0;

        if (seriesData.lastLsIndex && seriesData.ls.length > 0) {
            //latestLs = seriesData.ls[seriesData.lastLsIndex - 1][0];
            seriesData.ls = seriesData.ls.slice(0, seriesData.lastLsIndex);
            seriesData.lastLsIndex = null;
        }


        return this.props.fetchData(seriesData.plotProps.endpoint, this.getQueryParams(id, seriesData.plotProps))
            .then(resp => {
                if (!this._isMounted) return;
                resp.data.data.forEach(row => {
                    const value = row.attributes.rate;

                    if (value === null && seriesData.lastLsIndex === null) {
                        seriesData.lastLsIndex = seriesData.ls.length;
                    }

                    if (seriesData.plotProps.lumisectionAttribute)
                        seriesData.ls.push([row.attributes[seriesData.plotProps.lumisectionAttribute], value]);

                    if (seriesData.plotProps.timestampAttribute && row.attributes[seriesData.plotProps.timestampAttribute]) {
                        seriesData.utc.push([dateToUnix(row.attributes[seriesData.plotProps.timestampAttribute]), value]);
                    }
                });
                series.update({ data: this.displayType === 'ls' ? [...seriesData.ls] : [...seriesData.utc] }, false);
            })
            .catch(error => this.handleError(error));
    }

    handleLogScale = (event, isChecked) => {
        const type = isChecked ? 'logarithmic' : 'linear';
        this.chart.yAxis[0].update({ type: type });
        this.chart.yAxis[1].update({ type: type });
    }

    handleDisplayChange = (event, isChecked) => {
        this.displayType = isChecked ? 'utc' : 'ls';

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
    connect(mapStateToProps)(ChartMD)
);
