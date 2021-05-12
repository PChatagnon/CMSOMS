import React, { Component } from 'react';
import Highcharts from 'highcharts';
import HighchartsHeatmap from 'highcharts/modules/heatmap'
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsOfflineExporting from 'highcharts/modules/offline-exporting';
import HighchartsPatterns from 'highcharts/modules/pattern-fill';
import { generateId, setHighchartsLibURL } from '../../../utils/utils';
import sizeMe from 'react-sizeme';
import { range } from 'lodash';

HighchartsExporting(Highcharts);
HighchartsOfflineExporting(Highcharts);
setHighchartsLibURL(Highcharts);
HighchartsHeatmap(Highcharts);
HighchartsPatterns(Highcharts);

const NUM_COLUMNS = 99;
const NUM_ROWS = 35;

const PATTERN1 = 'M 0 0 L 10 10 M 9 -1 L 11 1 M -1 9 L 1 11';
const PATTERN2 = 'M 0 10 L 10 0 M -1 1 L 1 -1 M 9 11 L 11 9';

const RED = '#f44336';
const ORANGE = '#ffc107';
const BLUE = '#3f51b5'; // Example: fill 6240
const WHITE = '#FFFFFF';

class BunchInfoChart extends Component {

    constructor() {
        super();
        this.chart = null;
        this.id = generateId('bunchInfoChart');
    }

    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, this.loadData);
        this.props.shouldRefresh(this.props, this.loadData);
        this.shouldResize();
    }

    getColorPattern = (pattern, color) => {
        return {
            pattern: {
                path: {
                    d: pattern,
                    strokeWidth: 3
                },
                width: 10,
                height: 10,
                color: color
            }
        }
    }

    loadData = () => {
        this.props.showLoader();

        // Load new data
        this.props.fetchData('bunches', { page: 1, pagesize: 4000, sorting: ['bunch_number'] })
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
                this.respData = resp.data.data;

                resp.data.data.forEach(attributeRow => {
                    const {
                        bunch_number, luminosity_detected, intensity_beam_1: beam1, intensity_beam_2: beam2,
                        beam_1_configured, beam_2_configured
                    } = attributeRow.attributes;

                    const row = NUM_ROWS - Math.floor(bunch_number / NUM_COLUMNS);
                    const column = bunch_number % NUM_COLUMNS;

                    let color = WHITE;
                    let dataClass = 0;

                    if (beam1 > 0.05 && beam1 < 0.1) {
                        color = this.getColorPattern(PATTERN1, ORANGE);
                        dataClass = 1;
                    }

                    if (beam2 > 0.05 && beam2 < 0.1) {
                        color = this.getColorPattern(PATTERN2, ORANGE);
                        dataClass = 2;
                    }

                    if (beam1 > 0.05 && beam1 < 0.1 && beam2 > 0.05 && beam2 < 0.1) {
                        color = ORANGE;
                        dataClass = 3;
                    }

                    if (beam1 > 0.1) {
                        color = this.getColorPattern(PATTERN1, RED);
                        dataClass = 4;
                    }

                    if (beam2 > 0.1) {
                        color = this.getColorPattern(PATTERN2, RED);
                        dataClass = 5;
                    }

                    if (beam1 > 0.1 && beam2 > 0.1) {
                        color = RED;
                        dataClass = 6;
                    }

                    if (luminosity_detected) {
                        color = BLUE;
                        dataClass = 7;
                    }

                    let rowObject = { x: column, y: row, value: dataClass, color: color };

                    if (beam_1_configured || beam_2_configured) {
                        rowObject.borderColor = 'black';
                        rowObject.borderWidth = 1;
                    }
                    this.chartData.push(rowObject);
                });

                this.chart.addSeries({ name: 'Bunches', data: this.chartData, borderWidth: 0.5, turboThreshold: 5000 });
                this.chart.redraw();
                this.props.hideLoader();
            })
            .catch(error => this.props.onFailure(error));
    }

    componentDidMount() {
        const _this = this;
        const options = {
            chart: {
                type: 'heatmap',
                height: this.props.portletHeight,
                spacingBottom: 5,
                events: {
                    load: function () {
                        // Hack to add legend item borders for configured/not configured beams
                        this.legend.allItems[7].legendSymbol.element.style = 'stroke:black; stroke-width:1';
                        this.legend.allItems[8].legendSymbol.element.style = 'stroke:rgb(124, 181, 236); stroke-width:1';

                        //fix exporting wrong aspect ratio and legend clipping
                        this.update({
                            exporting: {
                                sourceWidth: this.chartWidth
                            }
                        })
                    }
                },
            },
            credits: {
                enabled: false
            },
            title: {
                text: null
            },
            xAxis: {
                title: null,
                visible: false
            },
            yAxis: {
                title: null,
                categories: range(NUM_ROWS, -1),
                visible: false
            },
            tooltip: {
                shared: true,
                formatter: function () {
                    const bunch = this.point.x + (NUM_ROWS - this.point.y) * NUM_COLUMNS;
                    const {
                        peak_lumi, intensity_beam_1, intensity_beam_2,
                        pileup, beam_1_configured, beam_2_configured
                    } = _this.respData[bunch].attributes;
                    return `
                        <b>Bunch: ${bunch}</b><br />
                        Peak Lumi: ${peak_lumi.toFixed(3)}<br />
                        Intensity Beam 1: ${intensity_beam_1.toFixed(3)}<br />
                        Intensity Beam 2: ${intensity_beam_2.toFixed(3)}<br />
                        Beam 1 Configured: ${beam_1_configured}<br />
                        Beam 2 Configured: ${beam_2_configured}<br />
                        Pileup: ${pileup}<br />
                    `;
                }
            },
            colorAxis: {
                dataClasses: [{
                    from: 1, to: 2,
                    color: this.getColorPattern(PATTERN1, ORANGE),
                    name: 'Beam 1 > 0.5E10'
                }, {
                    from: 2, to: 3,
                    color: this.getColorPattern(PATTERN2, ORANGE),
                    name: 'Beam 2 > 0.5E10'
                }, {
                    from: 3, to: 4,
                    color: ORANGE,
                    name: 'Beam 1 and Beam 2 > 0.5E10'
                }, {
                    from: 4, to: 5,
                    color: this.getColorPattern(PATTERN1, RED),
                    name: 'Beam 1 > 1E10'
                }, {
                    from: 5, to: 6,
                    color: this.getColorPattern(PATTERN2, RED),
                    name: 'Beam 2 > 1E10'
                }, {
                    from: 6, to: 7,
                    color: RED,
                    name: 'Beam 1 and Beam 2 > 1E10'
                }, {
                    from: 7, to: 8,
                    color: BLUE,
                    name: 'Luminosity detected'
                }, {
                    from: 8, to: 9,
                    color: WHITE,
                    name: 'Configured for beam'
                }, {
                    from: 9, to: 10,
                    color: WHITE,
                    name: 'Not configured for beam'
                }]
            },
            legend: {
                width: _this.props.size.width - 40,
                align: 'center',
                symbolRadius: 0,
                symbolHeight: 14,
                itemMarginBottom: 5
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

export default sizeMe({ monitorWidth: true })(BunchInfoChart);
