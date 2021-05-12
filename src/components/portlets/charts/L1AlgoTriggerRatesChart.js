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

class L1AlgoTriggerRatesChart extends Component {

    constructor(props) {
        super(props);
        this.chart = null;
        this.params = {
            page: 1, pagesize: 10000, include: ['turbo'],
            group: { key: 'granularity', value: 'lumisection' }
        };
        this.id = generateId('algoChart');
    }

    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, this.loadData);
        this.props.shouldRefresh(this.props, this.loadData);
        this.shouldResize();
    }

    loadData = () => {
        this.props.showLoader();
        const bit = (this.props.query !== null && this.props.query.cms_l1_bit != null ) ? this.props.query.cms_l1_bit : 'unknown';
        const bitName = (this.props.query !== null && this.props.query.cms_l1_bit_name != null ) ? this.props.query.cms_l1_bit_name : 'unknown';
        this.props.setTitle('Bit ' + bit + ' - ' + bitName);

        // Load new data
        this.props.fetchData('l1algorithmtriggers', this.params)
            .then(resp => {

                // Remove all chart series without redrawing
                while (this.chart.series.length > 0)
                    this.chart.series[0].remove(false);

                //this.chart.redraw();

                const serie_countBP = { name: 'Pre-DT Counts Before Prescale', data: [], stype: 'count', visible: false, yAxis: 1 };
                const serie_rateBP = { name: 'Pre-DT Rate Before Prescale', data: [], stype: 'rate', visible: true };

                const serie_countPreDP = { name: 'Pre-DT Counts After Prescale', data: [], stype: 'count', visible: false, yAxis: 1 };
                const serie_ratePreDT = { name: 'Pre-DT Rate After Prescale', data: [], stype: 'rate', visible: false };

                const serie_countPD = { name: 'Post-DT Counts (HLT)', data: [], stype: 'count', visible: false, yAxis: 1 };
                const serie_ratePD = { name: 'Post-DT Rate (HLT)', data: [], stype: 'rate', visible: false };

                const serie_countPostDT = { name: 'Post-DT Counts (uGT)', data: [], stype: 'count', visible: false, yAxis: 1 };
                const serie_ratePostDT = { name: 'Rate Post-DT (uGT)', data: [], stype: 'rate', visible: false };

                const serie_ratio1 = { name: 'Ratio: Post-DT HLT/Pre-DT', data: [], stype: 'ratio', visible: false };
                const serie_ratio2 = { name: 'Ratio: Post-DT uGT/Pre-DT', data: [], stype: 'ratio', visible: false };

                resp.data.data.forEach(row => {
                    row = row.attributes;

                    serie_countBP.data.push([row.last_lumisection_number, row.pre_dt_before_prescale_counter]);
                    serie_rateBP.data.push([row.last_lumisection_number, row.pre_dt_before_prescale_rate]);

                    serie_countPreDP.data.push([row.last_lumisection_number, row.pre_dt_counter]);
                    serie_ratePreDT.data.push([row.last_lumisection_number, row.pre_dt_rate]);

                    serie_countPD.data.push([row.last_lumisection_number, row.post_dt_hlt_counter]);
                    serie_ratePD.data.push([row.last_lumisection_number, row.post_dt_hlt_rate]);

                    serie_countPostDT.data.push([row.last_lumisection_number, row.post_dt_ugt_counter]);
                    serie_ratePostDT.data.push([row.last_lumisection_number, row.post_dt_ugt_rate]);

                    serie_ratio1.data.push([row.last_lumisection_number, row.pre_dt_counter === 0 ? 0 : (row.post_dt_hlt_counter / row.pre_dt_counter)]);
                    serie_ratio2.data.push([row.last_lumisection_number, row.pre_dt_counter === 0 ? 0 : (row.post_dt_ugt_counter / row.pre_dt_counter)]);
                });

                this.chart.addSeries(serie_rateBP, false);
                this.chart.addSeries(serie_countBP, false);

                this.chart.addSeries(serie_ratePreDT, false);
                this.chart.addSeries(serie_countPreDP, false);

                this.chart.addSeries(serie_ratePD, false);
                this.chart.addSeries(serie_countPD, false);

                this.chart.addSeries(serie_ratePostDT, false);
                this.chart.addSeries(serie_countPostDT, false);

                this.chart.addSeries(serie_ratio1, false);
                this.chart.addSeries(serie_ratio2, false);

                this.chart.redraw();

                if (!resp.data.data.length) {
                    return this.props.onEmpty();
                }
                return this.props.hideLoader()
            })
            .catch(error => this.props.onFailure(error));
    }

    handleLogScale = (event, isChecked) => {
        const type = isChecked ? 'logarithmic' : 'linear';
        this.chart.yAxis[0].update({ type: type });
        this.chart.yAxis[1].update({ type: type });
    }

    componentDidMount() {
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
                    lineWidth: 2
                }
            },
            yAxis: [{
                // Primary yAxis
                title: {
                    text: 'Rates [Hz]'
                }
            }, {
                // Secondary yAxis
                opposite: true,
                title: {
                    text: 'Counts'
                },

            }],
            tooltip: {
                enabled: true,
                shared: true,
                formatter: function () {
                    let tooltip = 'Lumisection: <b>' + this.x + '</b>';
                    this.points.forEach((point) => {
                        tooltip += '<br/>' + point.series.name + ':<b>' + (Number.isInteger(this.y) ? this.y : this.y.toFixed(4)) + '</b>';
                    });
                    return tooltip;
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
                this.chart.setSize(newSize.width, newSize.height - 40);
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

export default sizeMe({ monitorWidth: true })(L1AlgoTriggerRatesChart);
