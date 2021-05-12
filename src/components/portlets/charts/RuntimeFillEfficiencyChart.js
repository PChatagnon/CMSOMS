import React, { Component } from 'react';
import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsOfflineExporting from 'highcharts/modules/offline-exporting';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { generateId, setHighchartsLibURL } from '../../../utils/utils';
import sizeMe from 'react-sizeme';

HighchartsExporting(Highcharts);
HighchartsOfflineExporting(Highcharts);
setHighchartsLibURL(Highcharts);

const fillQueryParams = {
    page: 1, pagesize: 10000,
    fields: ['fill_number', 'efficiency_time', 'efficiency_lumi'],
    sorting: ['fill_number'],
    include: ['turbo']
};

class RuntimeFillEfficiencyChart extends Component {

    constructor(props) {
        super(props);
        this.chart = null;
        this.timeData = [];
        this.lumiData = [];
        this.fillData = [];
        this.id = generateId('runtimeFillEfficiencyChart');
    }

    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, this.loadData);
        this.props.shouldRefresh(this.props, this.loadData);
        this.shouldResize();
    }

    loadData = () => {
        this.props.showLoader();

        // Load new data
        this.props.fetchData('fills', fillQueryParams)
            .then(resp => {

                // Remove all chart series without redrawing
                while (this.chart.series.length > 0)
                    this.chart.series[0].remove(false);

                // Handle empty data response
                if (!resp.data.data.length) {
                    return this.props.onEmpty();
                }

                // Delete chart data on each request
                this.timeData = [];
                this.lumiData = [];
                this.fillData = [];

                // Populate chart dataset
                resp.data.data.forEach(row => {
                    const { fill_number, efficiency_time, efficiency_lumi } = row.attributes;

                    this.fillData.push(fill_number);
                    this.timeData.push(efficiency_time);
                    this.lumiData.push(efficiency_lumi);
                });

                this.chart.addSeries({ name: 'Efficiency By Time', data: this.timeData, color: '#058DC7' });
                this.chart.addSeries({ name: 'Efficiency By Lumi', data: this.lumiData, color: 'rgb(144, 237, 125)', });
                this.chart.xAxis[0].setCategories(this.fillData);

                return this.props.hideLoader();
            })
            .catch(error => this.props.onFailure(error));
    }

    componentDidMount() {
        const _this = this;
        const options = {
            chart: {
                type: 'column',
                height: this.props.portletHeight - 30,
                spacingBottom: 0
            },
            credits: {
                enabled: false
            },
            title: {
                text: null
            },
            yAxis: {
                max: 100,
                title: {
                    text: 'Percent [%]'
                }
            },
            plotOptions: {
                column: {
                    pointPadding: 0.2,
                    borderWidth: 0
                },
                series: {
                    cursor: 'pointer',
                    point: {
                        events: {
                            click: function () {
                                return _this.props.changeURL(`/cms/fills/report?cms_fill=${this.category}`);
                            }
                        }
                    }
                }
            },
            tooltip: {
                formatter: function () {
                    return `Fill - <b> ${this.key}</b> <br /> ${this.series.name} - <b> ${this.point.y} %</b>`;
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

    handleLogScale = (event, isChecked) => {
        this.chart.yAxis[0].update({ type: isChecked ? 'logarithmic' : 'linear' });
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
            </div>
        );
    }
}

export default sizeMe({ monitorWidth: true })(RuntimeFillEfficiencyChart);
