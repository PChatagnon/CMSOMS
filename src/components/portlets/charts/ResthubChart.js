import React, { Component } from 'react';
import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsOfflineExporting from 'highcharts/modules/offline-exporting';
import Resthub from '../../providers/Resthub';
import { generateId, getRandomColor, setHighchartsLibURL } from '../../../utils/utils';
import sizeMe from 'react-sizeme';

HighchartsExporting(Highcharts);
HighchartsOfflineExporting(Highcharts);
setHighchartsLibURL(Highcharts);

class ResthubChart extends Component {

    constructor() {
        super();
        this.chart = null;
        this.id = generateId('ResthubChart');
        this.series = [];
        this.sql = '';
        this.yAxis = [];
        this.xAxis = [];
    }

    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, this.loadData);
        this.props.shouldRefresh(this.props, this.loadData);
        this.shouldResize();
    }

    loadData = (query = this.props.query) => {
        this.chart.showLoading();
        this.props.showLoader();
        const { configuration } = this.props;
        this.sql = configuration.url;

        // Create SQL query. Take query from configuration and add parameters from controller.
        Object.entries(this.props.query).forEach(e => {
            this.sql = this.sql.replace(e[0], "'" + e[1] + "'");
        })

        // Remove all chart series without redrawing
        while (this.chart.series.length > 0)
            this.chart.series[0].remove(false);
        this.chart.redraw();

        Resthub.json2(this.sql, null, null, null, configuration.resthubUrl)
            .then(resp => {
                
                /**
                 * Prepare Series. Find:
                 *  which color it has to be
                 *  to which Y axis it belongs
                 */
                this.series = [];
                Object.entries(configuration.series).forEach(entry => {
                    let seria = {};
                    seria = entry[1];
                    seria['data'] = [];
                    seria['color'] = this.yAxis[entry[1].yAxis].labels.style.color
                    this.series.push(seria);                   
                })

                const data = resp.data.data;
                data.forEach(d => {
                    this.series.forEach(el => {
                        el.data.push([d[el.xData], d[el.yData]])
                    })
                });

                this.series.forEach(serie => {
                    this.chart.addSeries(serie, false)
                })
                this.chart.setTitle({text: query.tracker_sensor_type});

                this.chart.redraw();
                if (!data.length)
                    return this.props.onEmpty();

                this.chart.hideLoading();
                return this.props.hideLoader();
            })
            .catch(error => this.props.onFailure(error));
    }

    componentDidMount() {
        this.constructAxes(this.props.configuration);
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
            yAxis: this.yAxis,
            xAxis: this.xAxis,
            tooltip: {
                shared: true
            },
            series: []
        };

        this.chart = new Highcharts.chart(this.id, options);
        this.loadData();
    }

    constructAxes = (configuration) => {
        //Create Array of X Axes from configuration
        Object.entries(configuration.xAxes).forEach(entry => {
            this.xAxis.push(entry[1]);
        })

        //Create array of Y Axes from configuration
        //Additionally add COLOR parameter
        Object.entries(configuration.yAxes).forEach(entry => {
            let randColor = getRandomColor();
            let obj = entry[1];
            obj.labels.style.color  = randColor;
            obj.title.style.color = randColor;
            this.yAxis.push(obj);
        })
    }
    componentWillUnmount() {
        this.chart.destroy();
    }

    shouldResize() {
        if (this.chart && this.props.editMode) {
            const newSize = { width: this.props.size.width, height: this.props.portletHeight - 30 };
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
        return (
            <div>
                <div id={this.id} />
            </div>
        );
    }
}

export default sizeMe({ monitorWidth: true })(ResthubChart);
