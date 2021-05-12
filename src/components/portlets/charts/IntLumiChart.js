import React, { Component } from 'react';
import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsOfflineExporting from 'highcharts/modules/offline-exporting';
import { generateId, setHighchartsLibURL } from '../../../utils/utils';
import { dateToUnix } from '../../../utils/dateUtils';
import sizeMe from 'react-sizeme';

HighchartsExporting(Highcharts);
HighchartsOfflineExporting(Highcharts);
setHighchartsLibURL(Highcharts);

class IntLumiChart extends Component {

    constructor() {
        super();
        this.chart = null;
        this.id = generateId('lumiChart');
    }

    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, this.loadData);
        this.props.shouldRefresh(this.props, this.loadData);
        this.shouldResize();
    }

    loadData = () => {
        this.props.showLoader();

        // Remove plot lines, bands and series if any
        this.chart.xAxis[0].removePlotBand('downtime');
        this.chart.xAxis[0].removePlotLine('run');
        this.chart.xAxis[0].removePlotLine('stable_beam');

        // Remove all chart series without redrawing 
        while (this.chart.series.length > 0)
            this.chart.series[0].remove(false);

        // Load new data
        let recorded = {
            name: 'Recorded',
            type: 'spline',
            color: '#058DC7',
            marker: {
                symbol: 'circle',
            },
            data: []
        };

        let delivered = {
            name: 'Delivered',
            type: 'spline',
            color: '#ED561B',
            marker: {
                symbol: 'circle',
            },
            data: []
        };

        // Lumisections
        this.props.fetchData('lumisections', {
            include: ['turbo'],
            fields: ['start_time', 'recorded_lumi', 'delivered_lumi'],
            pagesize: 10000,
            page: 1
        }).then(resp => {
            resp.data.data.forEach(lumi => {
                const { attributes } = lumi;
                let timestamp = dateToUnix(attributes.start_time);

                recorded.data.push([timestamp, attributes.recorded_lumi || 0]);
                delivered.data.push([timestamp, attributes.delivered_lumi || 0]);
            });
            this.chart.addSeries(recorded, false);
            this.chart.addSeries(delivered, false);
            this.chart.redraw();
            this.props.hideLoader();
        })
            .catch(error => this.props.onFailure(error));

        // Downtimes
        this.props.fetchData('downtimes', { include: ['turbo'], fields: ['start_time', 'end_time'] })
            .then(resp => {
                resp.data.data.forEach(downtime => {
                    const { attributes } = downtime;
                    const plotBand = {
                        id: 'downtime',
                        color: 'rgba(237, 86, 27, 0.5)',
                        from: dateToUnix(attributes.start_time),
                        to: (attributes.end_time) ? dateToUnix(attributes.end_time) : Date.now(),
                        zIndex: 0
                    };
                    this.chart.xAxis[0].addPlotBand(plotBand);
                });
                this.chart.redraw();
            })
            .catch(error => this.props.onFailure(error));

        // Runs
        this.props.fetchData('runs', { include: ['turbo'], fields: ['run_number', 'start_time'] })
            .then(resp => {
                resp.data.data.forEach(run => {
                    const { attributes } = run;
                    const plotLine = {
                        id: 'run',
                        color: 'black',
                        dashStyle: 'LongDash',
                        value: dateToUnix(attributes.start_time),
                        width: 1,
                        label: {
                            text: attributes.run_number,
                            style: {
                                fontWeight: 'bold'
                            }
                        }
                    };
                    this.chart.xAxis[0].addPlotLine(plotLine);
                });
                this.chart.redraw();
            })
            .catch(error => this.props.onFailure(error));

        // Fill
        this.props.fetchData('fills', { include: ['turbo'], fields: ['start_stable_beam'] })
            .then(resp => {
                let fills = resp.data.data;
                if (fills.length > 0) {
                    const fill = fills[0].attributes;
                    if (fill.start_stable_beam) {
                        // STABLE BEAMS
                        const plotLine = {
                            id: 'stable_beam',
                            color: '#50B432',
                            dashStyle: 'Solid',
                            value: dateToUnix(fill.start_stable_beam),
                            width: 5,
                            label: {
                                text: "STABLE BEAMS",
                                y: 100,
                                style: {
                                    color: '#50B432',
                                    fontWeight: 'bold'
                                }
                            }
                        };
                        this.chart.xAxis[0].addPlotLine(plotLine);
                        this.chart.redraw();
                    }
                }
            })
            .catch(error => this.props.onFailure(error));
    }

    componentDidMount() {
        const options = {
            chart: {
                // inverted: true,
                zoomType: 'x',
                height: this.props.portletHeight
            },
            credits: {
                enabled: false
            },
            title: {
                text: null
            },
            xAxis: {
                type: 'datetime',
                title: {
                    text: 'Time'
                },
                plotLines: [

                ]
            },
            yAxis: {
                title: {
                    text: 'Int Lumi'
                }
            },
            tooltip: {
                shared: true
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

    render() {
        return <div id={this.id} />;
    }
}

export default sizeMe({ monitorWidth: true })(IntLumiChart);
