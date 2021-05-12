import React, { Component } from 'react';
import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import Resthub from '../../../../../components/providers/Resthub';
import { generateId, getRandomColor } from '../../../../../utils/utils';
import sizeMe from 'react-sizeme';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';

HighchartsExporting(Highcharts);

const RESTHUB_URL = '/hgcal-resthub';

class Hgcal8inchIVCurvesChart extends Component {

    constructor() {
        super();
        this.chart = null;
        this.id = generateId('Hgcal8inchIVCurvesChart');
    }

    componentWillReceiveProps(nextProps) {
        this.props.shouldUpdate(this.props.query, nextProps.query, this.loadData);
        this.props.shouldRefresh(nextProps, this.loadData);
    }

    loadData = (query = this.props.query) => {
        this.chart.showLoading();
        this.props.showLoader();

        // Remove all chart series without redrawing
        while (this.chart.series.length > 0)
            this.chart.series[0].remove(false);

        this.chart.redraw();

        let FROM = '';
        if (query.filterBy !== 'compare') {
            if (query.filterBy === 'hamma'){
                FROM = 'hgcal_int2r.hgc_hpk_8inch_snsr_iv_v';
            } else {
                FROM = 'hgcal_int2r.hgc_cern_8inch_snsr_iv_v';
            }
            query.hgcal_data.forEach(function (element) {

            Resthub.json2("SELECT t.VOLTS, t.CURNT_NANOAMP FROM " + FROM +  "  t WHERE t.HPKSNSR = '" + element.sensrType + "' AND t.SNSRCELL = '" + element.sensrCell + "' ", null, null, null, RESTHUB_URL)
            .then(resp => {
                const data = resp.data.data;
                let seria = {};
                seria['name'] = element.sensrCell;
                seria['data'] = [];
                data.forEach(d => {
                    seria.data.push([d.volts, d.curntNanoamp]);
                });

                seria['tooltip'] = {
                    pointFormatter: function () {
                        return `<span style='color: ${this.series.color}'>\u25CF</span> ${this.series.name}: <b>${this.y}</b><br />`;
                    }
                }

                seria['color'] = getRandomColor();
                this.chart.addSeries(seria);
            })
            .catch(error => this.props.onFailure(error));
        }, this);
            this.chart.hideLoading();
            return this.props.hideLoader();

        } else {
                Resthub.json2("SELECT t.VOLTS, t.CURNT_NANOAMP FROM hgcal_int2r.hgc_hpk_8inch_snsr_iv_v t WHERE t.HPKSNSR = '" + query.hgcal_sensor_type + "' AND t.SNSRCELL = '" + query.hgcal_sensor_cell + "' ", null, null, null, RESTHUB_URL)
                .then(resp => {
                    const hammaData = resp.data.data;
                    let seria = {};
                    seria['name'] = 'Hammamatsu';
                    seria['data'] = [];
                    hammaData.forEach(d => {
                        seria.data.push([d.volts, d.curntNanoamp]);
                    });

                    seria['tooltip'] = {
                        pointFormatter: function () {
                            return `<span style='color: ${this.series.color}'>\u25CF</span> ${this.series.name}: <b>${this.y}</b><br />`;
                        }
                    }
    
                    seria['color'] = getRandomColor();

                    this.chart.addSeries(seria, false);

                    Resthub.json2("SELECT t.VOLTS, t.CURNT_NANOAMP FROM hgcal_int2r.hgc_cern_8inch_snsr_iv_v t WHERE t.HPKSNSR = '" + query.hgcal_sensor_type + "' AND t.SNSRCELL = '" + query.hgcal_sensor_cell + "' ", null, null, null, RESTHUB_URL)
                    .then(resp => {
                        const cernData = resp.data.data;

                        let seria2 = {};
                        seria2['name'] = 'CERN';
                        seria2['data'] = [];
                        cernData.forEach(d => {
                            seria2.data.push([d.volts, d.curntNanoamp]);
                        });

                        this.chart.addSeries(seria2, false);
                        this.chart.redraw();

                        if (!hammaData.length || !cernData.length)
                            return this.props.onEmpty();

                        this.chart.hideLoading();
                        return this.props.hideLoader();
                    })
                }).catch(error => this.props.onFailure(error));
            }
        }
        
    handleLogScale = (event, isChecked) => {
        const type = isChecked ? 'logarithmic' : 'linear';
        this.chart.yAxis[0].update({ type: type });
    }

    componentDidMount() {
        const options = {
            chart: {
                height: this.props.portletHeight - 30,
                zoomType: 'xy',
                panning: true,
                panKey: 'shift'
            },
            plotOptions: {
                series: {
                    pointStart: 0,
                    lineWidth: 2
                }
            },
            credits: {
                enabled: false
            },
            title: {
                text: null
            },
            yAxis: [{ // Primary yAxis
                labels: {
                    format: '{value}',
                    style: {
                        color: Highcharts.getOptions().colors[1]
                    }
                },

                // gridLineWidth: 0,
                title: {
                    text: 'Current Amp',
                    style: {
                        color: Highcharts.getOptions().colors[1]
                    }
                },
            }],
            xAxis: {
                pointStart: 0,
                title: {
                    text: 'Volts'
                },
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

    componentDidUpdate() {
        if (this.chart && this.props.editMode) {
            const newSize = { width: this.props.size.width, height: this.props.portletHeight };
            const changed = this.haveSizeChanged(newSize);

            if (changed) {
                this.chart.setSize(newSize.width, newSize.height - 30);
            }
        }
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
            </div>
        );
    }
}
export default sizeMe({ monitorWidth: true })(Hgcal8inchIVCurvesChart);
