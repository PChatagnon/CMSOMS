import React, { Component } from 'react';
import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsOfflineExporting from 'highcharts/modules/offline-exporting';
import Resthub from '../../../../../components/providers/Resthub';
import { generateId, getRandomColor, setHighchartsLibURL } from '../../../../../utils/utils';
import sizeMe from 'react-sizeme';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';


HighchartsExporting(Highcharts);
HighchartsOfflineExporting(Highcharts);
setHighchartsLibURL(Highcharts);

const RESTHUB_URL = '/hgcal-resthub';

class HgcalCurvesChart extends Component {

    constructor() {
        super();
        this.chart = null;
        this.id = generateId('HgcalCurvesChart');
    }

    componentWillReceiveProps(nextProps) {
        this.props.shouldUpdate(this.props.query, nextProps.query, this.loadData);
        this.props.shouldRefresh(nextProps, this.loadData);
    }

    loadData = (query = this.props.query) => {
        this.props.showLoader();

        // Remove all chart series without redrawing
        while (this.chart.series.length > 0)
            this.chart.series[0].remove(false);

        this.chart.redraw();

        const { configuration } = this.props;
        query.hgcal_Data.forEach(function (element) {

            Resthub.json2("SELECT " + configuration.var1 + ", " + configuration.var2 + " FROM " + configuration.url + " t WHERE t.SNSR_TYPE = '" + element.snsrType + "' AND t.CHLD_SER_NUM = '" + element.childId + "' AND t.SNSR_SER_NUM = '" + element.sensrId + "' AND t.CHLD_TYPE = '" + element.childType + "' ", null, null, null, RESTHUB_URL)
                .then(resp => {
                    const data = resp.data.data;

                    const { xAxisObjName, yAxisObjectName } = configuration;
                    let seria = {};
                    seria['name'] = element.childId;
                    seria['data'] = [];
                    data.forEach(d => {
                        seria['data'].push([d[xAxisObjName], d[yAxisObjectName]])
                    });

                    seria['tooltip'] = {
                        pointFormatter: function () {
                            return `<span style='color: ${this.series.color}'>\u25CF</span> ${this.series.name}: <b>${this.y}</b><br />`;
                        }
                    }

                    seria['color'] = getRandomColor();
                    this.chart.addSeries(seria);
                    this.chart.redraw();
                }).catch(error => this.props.onFailure(error));
        }, this);

        
        this.chart.hideLoading();
        return this.props.hideLoader();

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
            yAxis: [{
                labels: {
                    format: '{value}',
                    style: {
                        color: Highcharts.getOptions().colors[1]
                    }
                },
                title: {
                    text: this.props.configuration.yAxisName,
                    style: {
                        color: Highcharts.getOptions().colors[1]
                    }
                },
            }],

            xAxis: {
                pointStart: 0,
                title: {
                    text: this.props.configuration.xAxisName
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

export default sizeMe({ monitorWidth: true })(HgcalCurvesChart);
