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

const COLUMNS = [
    { name: 'name', label: 'Name', style: { minWidth: 220 } },
    { name: 'deadtime', label: 'Deadtime', numeric: true, style: { minWidth: "12ch" }, show_units: true }
];

const TABLE_HEIGHT = 330;

class DeadtimeBreakdownChart extends Component {

    constructor(props) {
        super(props);
        this.chart = null;
        this.state = { tableData: [] };
        this.chartData = [];
        this.params = { page: 1, pagesize: 10000, include: ['turbo'], group: { key: 'granularity', value: 'range' } };
        this.id = generateId('deadtimeBreakdownChart');
        this.ba = props.configuration.beam_active || false;
    }

    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, this.loadData);
        this.props.shouldRefresh(this.props, this.loadData);
        this.shouldResize();
    }

    loadData = () => {
        this.props.showLoader();

        // Load new data
        this.props.fetchData('deadtimesperrange', this.params)
            .then(resp => {

                // Remove all chart series without redrawing
                while (this.chart.series.length > 0)
                    this.chart.series[0].remove(false);

                // Handle empty data response
                if (!resp.data.data.length) {
                    return this.props.onEmpty();
                }

                // Delete chart data on each request
                this.chartData = [];

                const { attributes } = resp.data.data[0];

                const calibration = this.ba ? attributes.deadtime_beamactive_calib : attributes.deadtime_calib;
                const tts = this.ba ? attributes.deadtime_beamactive_tts : attributes.deadtime_tts;
                const triggerRules = this.ba ? attributes.deadtime_beamactive_trg_rules : attributes.deadtime_trg_rules
                const swPause = this.ba ? attributes.deadtime_beamactive_sw_pause : attributes.deadtime_sw_pause;
                const fwPause = this.ba ? attributes.deadtime_beamactive_fw_pause : attributes.deadtime_fw_pause;
                const apve = this.ba ? attributes.deadtime_beamactive_apve : attributes.deadtime_apve;
                const retri = this.ba ? attributes.deadtime_beamactive_retri : attributes.deadtime_retri;
                const bxMax = this.ba ? attributes.deadtime_beamactive_bx_mask : attributes.deadtime_bx_mask;
                const backpressure = this.ba ? attributes.deadtime_beamactive_daq_bp : attributes.deadtime_daq_bp;

                // Handle chart data
                this.chartData.push({ name: 'Calibration', y: calibration });
                this.chartData.push({ name: 'TTS', y: tts });
                this.chartData.push({ name: 'Trigger Rules', y: triggerRules });
                this.chartData.push({ name: 'SW Pause', y: swPause });
                this.chartData.push({ name: 'FW Pause', y: fwPause });
                this.chartData.push({ name: 'APVE', y: apve });
                this.chartData.push({ name: 'BX Mask', y: bxMax });
                this.chartData.push({ name: 'Retri', y: retri });
                this.chartData.push({ name: 'Backpressure', y: backpressure });

                this.chart.addSeries({ name: 'Breakdown', data: this.chartData, colorByPoint: true });

                // Handle table data
                const total = calibration + tts + triggerRules + swPause + fwPause + apve + bxMax + retri + backpressure;

                let tableData = [
                    {
                        attributes: {
                            name: 'Calibration',
                            percent: prettyFloat(calibration / total * 100, 2),
                            deadtime: calibration.toFixed(2)
                        },
                        units: { deadtime: { units: "\\%" } }
                    },
                    {
                        attributes: {
                            name: 'TTS',
                            percent: prettyFloat(tts / total * 100, 2),
                            deadtime: tts.toFixed(2)
                        },
                        units: { deadtime: { units: "\\%" } }
                    },
                    {
                        attributes: {
                            name: 'Trigger Rules',
                            percent: prettyFloat(triggerRules / total * 100, 2),
                            deadtime: triggerRules.toFixed(2)
                        },
                        units: { deadtime: { units: "\\%" } }
                    },
                    {
                        attributes: {
                            name: 'SW Pause',
                            percent: prettyFloat(swPause / total * 100, 2),
                            deadtime: swPause.toFixed(2)
                        },
                        units: { deadtime: { units: "\\%" } }
                    },
                    {
                        attributes: {
                            name: 'Firmware Pause',
                            percent: prettyFloat(fwPause / total * 100, 2),
                            deadtime: fwPause.toFixed(2)
                        },
                        units: { deadtime: { units: "\\%" } }
                    },
                    {
                        attributes: {
                            name: 'APVE',
                            percent: prettyFloat(apve / total * 100, 2),
                            deadtime: apve.toFixed(2)
                        },
                        units: { deadtime: { units: "\\%" } }
                    },
                    {
                        attributes: {
                            name: 'BX Mask',
                            percent: prettyFloat(bxMax / total * 100, 2),
                            deadtime: bxMax.toFixed(2)
                        },
                        units: { deadtime: { units: "\\%" } }
                    },
                    {
                        attributes: {
                            name: 'Retri',
                            percent: prettyFloat(retri / total * 100, 2),
                            deadtime: retri.toFixed(2)
                        },
                        units: { deadtime: { units: "\\%" } }
                    },
                    {
                        attributes: {
                            name: 'Backpressure',
                            percent: prettyFloat(backpressure / total * 100, 2),
                            deadtime: backpressure.toFixed(2)
                        },
                        units: { deadtime: { units: "\\%" } }
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
                height: this.props.portletHeight - TABLE_HEIGHT,
                margin: [0, 0, 0, 0]
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
                        format: '<b>{point.name}</b> - {point.y:.2f} %',
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
                    return `${this.key} <br /> ${this.series.name} - <b>${this.point.y.toFixed(2)}%</b>`;
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
                    columns={COLUMNS}
                    showFooter={false}
                    height={TABLE_HEIGHT}
                />
                <div id={this.id} />
            </div>
        );
    }
}

export default sizeMe({ monitorWidth: true })(DeadtimeBreakdownChart);
