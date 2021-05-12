import React, { Component } from 'react';
import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsOfflineExporting from 'highcharts/modules/offline-exporting';
import Datatable from '../generic/datatable/table/Table';
import { generateId, setHighchartsLibURL } from '../../../utils/utils';
import { prettyFloat } from '../../../utils/prettyUtils';
import sizeMe from 'react-sizeme';

HighchartsExporting(Highcharts);
HighchartsOfflineExporting(Highcharts);
setHighchartsLibURL(Highcharts);

// Fix for empty pie charts: https://github.com/highcharts/highcharts/issues/5526

Highcharts.wrap(Highcharts.seriesTypes.pie.prototype, 'render', function (proceed) {
    proceed.call(this);

    if (!this.circle) {
        this.circle = this.chart.renderer.circle(0, 0, 0).add(this.group);
    }
    if (this.total === 0) {
        this.circle.attr({
            cx: this.center[0],
            cy: this.center[1],
            r: this.center[2] / 2,
            fill: 'none',
            stroke: 'silver',
            'stroke-width': 1
        });
    } else {
        this.circle.attr({ 'stroke-width': 0 });
    }
});

const TABLE_HEIGHT = 200;

class RuntimeLumiChart extends Component {

    constructor(props) {
        super(props);
        this.chart = null;
        this.state = { tableData: [] };
        this.chartData = [];
        this.id = generateId('runtimeLumiChart');
        this.columns = [
            {
                name: 'name', label: 'Name', style: { minWidth: 220 }, props: {
                    type: 'cell_click',
                    clickHandler: (row) => {
                        const url = row.name === 'Lost Lumi Deadtime' ?
                            '/cms/runtimes/deadtimes' :
                            '/cms/runtimes/downtimes';
                        return this.props.changeURL(url);
                    }
                }
            },
            { name: 'percent', label: '%', numeric: true },
            { name: 'lumi', label: 'Lumi', numeric: true, style: { minWidth: "12ch" }, show_units: true }
        ];
    }

    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, this.loadData);
        this.props.shouldRefresh(this.props, this.loadData);
        this.shouldResize();
    }

    loadData = () => {
        this.props.showLoader();

        // Load new data
        this.props.fetchData('runtimeanalyses', { page: 1, pagesize: 1, include: ['turbo'] })
            .then(resp => {

                // Remove all chart series without redrawing
                while (this.chart.series.length > 0)
                    this.chart.series[0].remove(false);

                // Handle empty data response
                if (!resp.data.data.length) {
                    this.setState({ tableData: null });
                    return this.props.onEmpty();
                }

                const { delivered_lumi, recorded_lumi, lost_lumi, lost_lumi_downtime, lost_lumi_deadtime } = resp.data.data[0].attributes;
                const { row: meta } = resp.data.data[0].meta;

                // Delete chart data on each request
                this.chartData = [];

                // Handle chart data
                this.chartData.push({ name: 'Recorded Lumi', y: recorded_lumi });
                this.chartData.push({ name: 'Deadtime', y: lost_lumi_deadtime });
                this.chartData.push({ name: 'Downtime', y: lost_lumi_downtime, color: '#ED561B' });

                this.chart.addSeries({ name: 'Luminosity', data: this.chartData, colorByPoint: true });

                // Handle table data
                let tableData = [
                    {
                        attributes: {
                            name: 'Delivered Luminosity',
                            percent: delivered_lumi ? 100 : '',
                            lumi: delivered_lumi
                        },
                        units: { lumi: { units: meta.delivered_lumi ? meta.delivered_lumi.units : '' } }
                    },
                    {
                        attributes: {
                            name: 'Recorded Luminosity',
                            percent: prettyFloat(recorded_lumi / delivered_lumi * 100, 2),
                            lumi: recorded_lumi
                        },
                        units: { lumi: { units: meta.recorded_lumi ? meta.recorded_lumi.units : '' } }
                    },
                    {
                        attributes: {
                            name: 'Lost Luminosity',
                            percent: prettyFloat(lost_lumi / delivered_lumi * 100, 2),
                            lumi: prettyFloat(lost_lumi, 3)
                        },
                        units: { lumi: { units: meta.lost_lumi ? meta.lost_lumi.units : '' } }
                    },
                    {
                        attributes: {
                            name: 'Lost Lumi Deadtime',
                            percent: prettyFloat(lost_lumi_deadtime / delivered_lumi * 100, 2),
                            lumi: lost_lumi_deadtime
                        },
                        units: { lumi: { units: meta.lost_lumi_deadtime ? meta.lost_lumi_deadtime.units : '' } },
                        props: { name: { show_link: true } }
                    },
                    {
                        attributes: {
                            name: 'Lost Lumi Downtime',
                            percent: prettyFloat(lost_lumi_downtime / delivered_lumi * 100, 2),
                            lumi: lost_lumi_downtime
                        },
                        units: { lumi: { units: meta.lost_lumi_downtime ? meta.lost_lumi_downtime.units : '' } },
                        props: { name: { show_link: true } }
                    }];

                this.setState({ tableData: tableData });
                return this.props.hideLoader();
            })
            .catch(error => this.props.onFailure(error));
    }

    componentDidMount() {
        const options = {
            chart: {
                type: 'pie',
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                height: this.props.portletHeight - TABLE_HEIGHT
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
                        padding: 1,
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
                    return `${this.key} <br /> ${this.series.name} - <b>${this.percentage.toFixed(1)}%</b> (<b>${this.point.y}</b>)`;
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
            const newSize = { width: this.props.size.width, height: this.props.portletHeight - TABLE_HEIGHT };
            const changed = this.haveSizeChanged(newSize);

            if (changed) {
                this.chart.setSize(newSize.width, newSize.height);
            }
        }
    }

    haveSizeChanged = (newSize) => {
        return newSize.width !== this.chart.chartWidth || newSize.height !== this.chart.chartHeight;
    }

    render() {
        const { tableData } = this.state;
        return (
            <div>
                <Datatable
                    data={tableData}
                    columns={this.columns}
                    showFooter={false}
                    height={TABLE_HEIGHT}
                />
                <div id={this.id} />
            </div>
        );
    }
}

export default sizeMe({ monitorWidth: true })(RuntimeLumiChart);
