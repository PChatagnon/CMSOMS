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

class TrackerHybridStatusChart extends Component {

    constructor(props) {
        super(props);
        this.chart = null;
        this.id = generateId('TrackerHybridStatusChart');
        this.yAxes = [];
        this.state = {
            displayed: false
        }
    }

    componentDidUpdate(prevProps) {
        console.log("in update")
        this.props.shouldUpdate(prevProps.query, this.props.query, this.loadStatusData);
        this.props.shouldRefresh(this.props, this.loadStatusData);
        this.shouldResize();
    }

    loadStatusData = (controllerExportData = this.props.controllerExportData) => {
        const { configuration } = this.props;

        console.log("in load data")
        this.props.showLoader();
        this.createPieChart(configuration);

        this.sql = configuration.url;

        this.sql = this.sql.replace("part_DB", "p6640")
        this.sql = this.sql.replace("cond_DB", "c9820")

        console.log("props query");
        console.log(this.props.query);
        console.log(this.props);

        let sqli = this.sql.substring(0, this.sql.indexOf('where'));
        let sqlf = this.sql.substring(this.sql.indexOf('where'), this.sql.length);

        this.props.controllerExportData.tracker_data.map((element, i) => { sqli = this.createSQL(element, sqli, sqlf, i) });

        return Resthub.json2(sqli, null, null, null, configuration.resthubUrl)
            .then(resp => {
                console.log(resp.data.data)
                const data = resp.data.data;
                return this.processStatusData(data);
            })
            .then(
                (serie) => {
                    console.log("processed data")
                    console.log(serie)

                    console.log(this.chart.series)

                    this.createPieChart(serie);
                    this.chart.setTitle({ text: configuration.categories });
                    this.chart.redraw();
                    this.chart.hideLoading();
                    return this.props.hideLoader();
                }
            );
    }

    processStatusData = (data) => {
        const { configuration } = this.props;

        let cat = configuration.categories
        console.log(cat)
        const counts = {};
        data.map(
            (element) => {
                counts[element[cat]] = counts[element[cat]] ? counts[element[cat]] + 1 : 1;
            }
        )

        console.log(counts)

        let series = []
        for (const [key, value] of Object.entries(counts)) {
            console.log(key, value);
            let point = {};
            point['name'] = key;
            point['y'] = parseFloat((100. * value / data.length).toFixed(2));
            series.push(point)
        }

        console.log("series")
        console.log(series)

        let serie = [{
            name: 'Status',
            colorByPoint: true,
            data: series
        }];

        return serie;


    }

    createPieChart = (serie = []) => {

        const options = {
            chart: {
                height: this.props.portletHeight - 50,
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                type: 'pie'
            },
            credits: {
                enabled: false
            },
            title: {
                text: null
            },
            tooltip: {
                pointFormat: '{point.name}: <b>{point.percentage:.1f}%</b>'
            },
            accessibility: {
                point: {
                    valueSuffix: 'serie.name'
                }
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                    }
                }
            },
            series: serie
        };
        this.chart = new Highcharts.chart(this.id, options);

    }


    createSQL = (element, sqli, sqlf, i) => {

        sqlf = sqlf.replace("serial_number", "'" + element.serial_number + "'")
        sqlf = sqlf.substring(5, sqlf.length);
        sqlf = "(" + sqlf + ")";

        if (i == 0) {
            sqli = sqli + " where " + sqlf;
        }
        else sqli = sqli + " or " + sqlf;

        return sqli;
    }

    getDataHybrid = () => {

        console.log("ingetData")

        return true;
    }

    handleHideCategories = (event, isChecked) => {
        const type = isChecked ? 'logarithmic' : 'linear';
        this.chart.yAxis[0].update({ type: type });
    }

    componentDidMount() {
        let { configuration } = this.props;

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
                useHTML: true,
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
        this.loadStatusData();
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
                    control={<Checkbox color="primary" onChange={this.handleHideCategories} />}
                    label="Hide undefined"
                />
            </div>
        );
    }
}

export default sizeMe({ monitorWidth: true })(TrackerHybridStatusChart);
