import React, { Component } from 'react';
import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsOfflineExporting from 'highcharts/modules/offline-exporting';
import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { generateId, copyObjectsArray, setHighchartsLibURL } from '../../../utils/utils';
import { secondsToDatetime } from '../../../utils/dateUtils';
import sizeMe from 'react-sizeme';
import { createAdaptedSelectorsKeepAll } from '../PortletUtils';

HighchartsExporting(Highcharts);
HighchartsOfflineExporting(Highcharts);
setHighchartsLibURL(Highcharts);

class DowntimesLostLumiChart extends Component {

    constructor(props) {
        super(props);
        this.chart = null;
        this.lumiData = [];
        this.timeData = [];
        this.displayType = 'lumi';
        this.params = { page: 1, pagesize: 10000, sorting: ['group', 'category'] };
        if (props.configuration.selectors) {
            const portletSelectors = props.selectors.in || [];
            this.params.selectors = createAdaptedSelectorsKeepAll(portletSelectors, props.configuration.selectors);
        }
        this.id = generateId('downtimesLostLumiChart');
    }

    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, this.loadData);
        this.props.shouldRefresh(this.props, this.loadData);
        this.shouldResize();
    }

    loadData = () => {
        this.props.showLoader();

        // Load new data
        this.props.fetchData(this.props.configuration.endpoint, this.params)
            .then(resp => {

                // Remove all chart series without redrawing
                while (this.chart.series.length > 0)
                    this.chart.series[0].remove(false);

                // Delete chart data on each request
                this.lumiData = [];
                this.timeData = [];
                let categories = {};

                resp.data.data.forEach(row => {
                    const { category, group, lost_lumi, duration } = row.attributes;
                    const cat = `${group} : ${category}`;

                    if (!categories[cat]) categories[cat] = { time: 0, lumi: 0 };

                    categories[cat].lumi += lost_lumi ? lost_lumi : 0;
                    categories[cat].time += duration ? duration : 0;
                });

                Object.keys(categories).forEach(c => {
                    this.lumiData.push({ name: c, y: categories[c].lumi });
                    this.timeData.push({ name: c, y: categories[c].time });
                });

                this.chart.addSeries({
                    name: this.displayType === 'lumi' ? 'Lost Lumi' : 'Downtime Duration',
                    data: this.displayType === 'lumi' ? copyObjectsArray(this.lumiData) : copyObjectsArray(this.timeData),
                    colorByPoint: true
                });

                if (!resp.data.data.length) {
                    return this.props.onEmpty();
                }
                return this.props.hideLoader();
            })
            .catch(error => this.props.onFailure(error));
    }

    componentDidMount() {
        const _this = this;
        const options = {
            chart: {
                type: 'pie',
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                height: this.props.portletHeight - 30
            },
            credits: {
                enabled: false
            },
            title: {
                text: null
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b> - {point.percentage:.1f} %',
                        style: {
                            color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                        }
                    },
                    showInLegend: true
                }
            },
            legend: {
                enabled: false
            },
            tooltip: {
                formatter: function () {
                    const value = _this.displayType === 'time' ? secondsToDatetime(this.point.y) : this.point.y.toFixed(2);
                    return `${this.key} <br /> ${this.series.name} - <b>${this.percentage.toFixed(1)}%</b> (<b>${value}</b>)`;
                }
            },
            series: []
        };

        this.chart = new Highcharts.chart(this.id, options);
        this.loadData();
    }

    componentWillUnmount() {
        this.chart.destroy();
    }

    shouldResize() {
        if (this.chart && this.props.editMode) {
            const newSize = { width: this.props.size.width, height: this.props.portletHeight };
            const changed = this.haveSizeChanged(newSize);

            if (changed) {
                this.chart.setSize(newSize.width, newSize.height);
            }
        }
    }

    haveSizeChanged = (newSize) => {
        return newSize.width !== this.chart.chartWidth || newSize.height !== this.chart.chartHeight;
    }

    handleSwitchChange = (event, isChecked) => {
        this.displayType = isChecked ? 'time' : 'lumi';
        this.chart.series[0].update({
            name: isChecked ? 'Downtime Duration' : 'Lost Lumi',
            data: isChecked ? copyObjectsArray(this.timeData) : copyObjectsArray(this.lumiData)
        });
    }

    render() {
        return (
            <div>
                <div id={this.id} />
                <FormControlLabel
                    style={{ marginTop: -10, marginLeft: 5 }}
                    control={<Switch onChange={this.handleSwitchChange} color="primary" />}
                    label="Downtime Duration"
                />
            </div>
        );
    }
}

export default sizeMe({ monitorWidth: true })(DowntimesLostLumiChart);
