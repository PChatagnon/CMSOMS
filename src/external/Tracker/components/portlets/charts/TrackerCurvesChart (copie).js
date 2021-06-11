import React, { Component } from 'react';
import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsOfflineExporting from 'highcharts/modules/offline-exporting';
import Resthub from '../../../../../components/providers/Resthub';
//import { generateId, getRandomColor } from '../../../../../utils/utils';
import { generateId, setHighchartsLibURL } from '../../../../../utils/utils';
import sizeMe from 'react-sizeme';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

HighchartsExporting(Highcharts);
HighchartsOfflineExporting(Highcharts);
setHighchartsLibURL(Highcharts);

const RESTHUB_URL = '/tracker-resthub';

class TrackerCurvesChart extends Component {

    constructor(props) {
        super(props);
        this.chart = null;
        this.id = generateId('TrackerCurvesChart');
        this.yAxes = [];
    }

    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, this.loadData);
        this.props.shouldRefresh(this.props, this.loadData);
        this.shouldResize();
    }

    loadData = (query = this.props.query) => {
        this.props.showLoader();

        this.colorCount = 0;
        this.axisColor = 0;
        // Remove all chart series without redrawing
        while (this.chart.series.length > 0)
            this.chart.series[0].remove(false);

        this.chart.redraw();

	console.log("props query");
	console.log(this.props.query);
	console.log(this.props);

        const { configuration } = this.props;
        this.sql = configuration.url;
       if(query.tracker_data.length > 0){
           query.tracker_data.forEach(e =>{
               let sql2 = this.sql
               Object.entries(e).forEach(ef => {
                if (ef[1]===''){
                    ef[1]= null;
                    sql2 = sql2.replace(' = ' + ef[0],' is ' + ef[1] );
                } else {
                    sql2 = sql2.replace(ef[0], "'" + ef[1] + "'");
                }
            })
            
            console.log(sql2);
                const { xAxisObjectName, superImpose } = configuration;
                Resthub.json2(sql2, null, null, null, configuration.resthubUrl)
            .then(resp => {
                const data = resp.data.data;
                //let series = [];
                let seria = {};
                seria['name'] = e['tracker_id'];
                seria['data'] = [];
                data.forEach(d => {
                    seria['data'].push([d[xAxisObjectName], d[superImpose]])
                });
                seria['tooltip'] = {
                    pointFormatter: function () {
                        return `<span style='color: ${this.series.color}'>\u25CF</span> ${this.series.name}: <b>${this.y}</b><br />`;
                    }
                }
                seria['color'] = Highcharts.getOptions().colors[this.colorCount]
                this.colorCount = this.colorCount + 1;
                this.chart.addSeries(seria);
                this.chart.setTitle({text: query[configuration.paramForTitle]});
                this.chart.redraw();
                if (!data.length)
                    return this.props.onEmpty();
                this.chart.hideLoading();
                return this.props.hideLoader();
            }).catch(error => this.props.onFailure(error));
           })
       } else {
       	    console.log("avant "+this.sql);
            Object.entries(this.props.query).forEach(e => {
                if (e[1]===''){
                    e[1]= null;
                    this.sql = this.sql.replace(' = ' + e[0],' is ' + e[1] );
                } else {
                    this.sql = this.sql.replace(e[0], "'" + e[1] + "'");
                }
            })
            console.log("here "+this.sql);
            Resthub.json2(this.sql, null, null, null, configuration.resthubUrl)
            .then(resp => {
                const data = resp.data.data;
                let series = [];
                Object.entries(configuration.series).forEach(e => {
                    let seria = {};
                    seria['useHTML'] = true;
                    seria['name'] = e[1].name
                    seria['data'] = [];
                    seria['dataAxis'] = configuration.yAxes[e[1].yAxis].yAxisObjectName
                    seria['yAxis'] = e[1].yAxis;
                    seria['tooltip'] = {
                        pointFormatter: function () {
                            return `<span style='color: ${this.series.color}'>\u25CF</span> ${this.series.name}: <b>${this.y}</b><br />`;
                        }
                    }
                    seria['color'] = this.yAxes[e[1].yAxis].labels.style.color;
                    series.push(seria);
                });
                data.forEach(d => {
                    series.forEach(s => {
                        s.data.push([d[configuration.xAxisObjectName], d[s.dataAxis]])
                    })
                });
                series.forEach(s => {
                    this.chart.addSeries(s, false)
                })

                this.chart.setTitle({text: query[configuration.paramForTitle]});

                this.chart.redraw();

                if (!data.length)
                    return this.props.onEmpty();

                this.chart.hideLoading();
                return this.props.hideLoader();
            }).catch(error => this.props.onFailure(error));
       }
    }

    handleLogScale = (event, isChecked) => {
        const type = isChecked ? 'logarithmic' : 'linear';
        this.chart.yAxis[0].update({ type: type });
    }

    componentDidMount() {
        let { configuration } = this.props;

        this.createYaxes(configuration)

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
            yAxis: this.yAxes,
            xAxis: {
                pointStart: 0,
                useHTML:true,
                title: {
                    text: configuration.xAxisName
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

    createYaxes = (configuration) => {

        let opposit = false;
        var axisC = 0;
        Object.entries(configuration.yAxes).forEach(entry => {

            axisC = axisC + 1;
            let x = entry[0]
            if (x > 0 ) {
                opposit = true;
            } else {
                opposit = false;
            }
            let obj = {labels: {
                gridLineWidth: 0,
                format: '{value}',
                style: {
                    color: entry[1].color
                }
            },
            title: {
                useHTML:true,
                text: entry[1].text,
                reversed: false,
                style: {
                    color: entry[1].color
                }
            },
            opposite: opposit
        }
        this.yAxes.push(obj);
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
                <FormControlLabel
                    style={{ marginTop: -10, marginLeft: 5 }}
                    control={<Checkbox color="primary" onChange={this.handleLogScale} />}
                    label="Logarithmic scale"
                />
            </div>
        );
    }
}

export default sizeMe({ monitorWidth: true })(TrackerCurvesChart);
