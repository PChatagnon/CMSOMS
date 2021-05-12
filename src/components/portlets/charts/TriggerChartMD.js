import React, { Component } from 'react';
import { connect } from 'react-redux';
import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsOfflineExporting from 'highcharts/modules/offline-exporting';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { generateId, setHighchartsLibURL } from '../../../utils/utils';
import { unixToDatetime } from '../../../utils/dateUtils';
import TriggerDataLoader from './helper/TriggerDataLoader';
import sizeMe from 'react-sizeme';
import axios from 'axios';
//import { ENGINE_METHOD_NONE } from 'constants';

HighchartsExporting(Highcharts);
HighchartsOfflineExporting(Highcharts);
setHighchartsLibURL(Highcharts);

function mapStateToProps(state) {
    return { md: state.md };
}


class TriggerChartMD extends Component {

    constructor(props) {
        super(props);
        this.chart = null;
        
        this.id = generateId('TriggerChartMD');
        this.mdData = null;
        const { urlParams } = props;
        this.deselected = urlParams && urlParams.deselected && urlParams.deselected.length ? urlParams.deselected : [];
        this.displayType = 'ls';
        this._isMounted = false;
        this.dataLoader = null;
    }

    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, () => {

            // Cancel all the pending requests when a query changes
            this.dataLoader.cancelRequests("TriggerChartMD: new Query");

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
        this.dataLoader = new TriggerDataLoader(this.chart, this.props, this.displayType);
        this.dataLoader.setMounted(true);
        return this.props.onEmpty();
    }

    componentWillUnmount() {
        this.dataLoader.cancelRequests("TriggerChartMD: component is unmounting", false);
        this._isMounted = false;
        this.dataLoader.setMounted(false);
        this.chart.destroy();
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

    


    // Check if there are new data from master-details channel
    shouldUpdate(prevProps) {
        if (!this._isMounted) return;

        const { groupId } = this.props;
        if (this.props.md[groupId] === prevProps.md[groupId]) return;

        this.mdData = this.props.md[groupId];
        this.dataLoader.processMasterDetailsUpdate(this.mdData, this.deselected)
            .catch(error => this.handleError(error));
    }

    handleError = error => {
        if (axios.isCancel(error)) {
            console.log('Request canceled', error);
            return error;
        }
        return this.props.onFailure(error);
    }


    updateChart = (hardReload = false, query = this.props.query) => {
        this.dataLoader.updateChart(!hardReload, query)
            .catch(error => this.handleError(error));
    }


    handleLogScale = (event, isChecked) => {
        const type = isChecked ? 'logarithmic' : 'linear';
        this.chart.yAxis[0].update({ type: type });
        if (this.chart.yAxis.length > 1)
            this.chart.yAxis[1].update({ type: type });
    }

    handleDisplayChange = (event, isChecked) => {
        this.displayType = isChecked ? 'utc' : 'ls';
        this.dataLoader.swapXAxis(this.displayType);
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
    connect(mapStateToProps)(TriggerChartMD)
);
