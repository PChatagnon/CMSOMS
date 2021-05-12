import React, { Component } from 'react';
import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsOfflineExporting from 'highcharts/modules/offline-exporting';
import Datatable from '../generic/datatable/table/Table';
import { generateId, setHighchartsLibURL } from '../../../utils/utils';
import { secondsToDatetime } from '../../../utils/dateUtils';
import { prettyFloat } from '../../../utils/prettyUtils';
import sizeMe from 'react-sizeme';

HighchartsExporting(Highcharts);
HighchartsOfflineExporting(Highcharts);
setHighchartsLibURL(Highcharts);

const TABLE_HEIGHT = 200;

class RuntimeLivetimeChart extends Component {

    constructor(props) {
        super(props);
        this.chart = null;
        this.state = { tableData: [] };
        this.chartData = [];
        this.id = generateId('runtimeLivetimeChart');
        this.columns = [
            {
                name: 'name', label: 'Name', style: { minWidth: 220 }, props: {
                    type: 'cell_click',
                    clickHandler: (row) => {
                        const url = row.name === 'Deadtime' ?
                            '/cms/runtimes/deadtimes' :
                            '/cms/runtimes/downtimes';
                        return this.props.changeURL(url);
                    }
                }
            },
            { name: 'percent', label: '%', numeric: true },
            { name: 'time', label: 'Time', numeric: true, style: { minWidth: "12ch" } }
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

                const { downtime, deadtime, lost_time, live_time, stable_beam_duration } = resp.data.data[0].attributes;

                // Delete chart data on each request
                this.chartData = [];

                // Handle chart data
                this.chartData.push({ name: 'Live Time', y: live_time });
                this.chartData.push({ name: 'Downtime', y: downtime, color: '#ED561B' });

                this.chart.addSeries({ name: 'Time', data: this.chartData, colorByPoint: true });

                // Handle table data
                let tableData = [
                    {
                        attributes: {
                            name: 'Stable Beams Duration',
                            percent: stable_beam_duration ? 100 : '',
                            time: secondsToDatetime(stable_beam_duration)
                        }
                    },
                    {
                        attributes: {
                            name: 'Live Time',
                            percent: prettyFloat(live_time / stable_beam_duration * 100, 2),
                            time: secondsToDatetime(live_time)
                        }
                    },
                    {
                        attributes: {
                            name: 'Lost Time',
                            percent: prettyFloat(lost_time / stable_beam_duration * 100, 2),
                            time: secondsToDatetime(lost_time)
                        }
                    },
                    {
                        attributes: {
                            name: 'Deadtime',
                            percent: prettyFloat(deadtime / stable_beam_duration * 100, 2),
                            time: secondsToDatetime(deadtime)
                        },
                        props: { name: { show_link: true } }
                    },
                    {
                        attributes: {
                            name: 'Downtime',
                            percent: prettyFloat(downtime / stable_beam_duration * 100, 2),
                            time: secondsToDatetime(downtime)
                        },
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
                    return `${this.key} <br /> ${this.series.name} - <b>${this.percentage.toFixed(1)}%</b> (<b>${secondsToDatetime(this.point.y)}</b>)`;
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

export default sizeMe({ monitorWidth: true })(RuntimeLivetimeChart);
