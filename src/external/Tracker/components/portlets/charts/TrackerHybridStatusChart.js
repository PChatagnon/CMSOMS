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
            displayed: false,
            data: []
        }
    }

    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, this.loadStatusData);
        this.props.shouldRefresh(this.props, this.loadStatusData);
        this.shouldResize();
    }

    loadStatusData = (controllerExportData = this.props.controllerExportData) => {
        const { configuration } = this.props;

        this.props.showLoader();
        this.createPieChart(configuration);

        this.sql = configuration.url;

        let no_display = configuration.noDisplay;

        if (no_display && this.props.controllerExportData.tracker_data.length == 0) { this.props.hideLoader(); this.props.onEmpty(); return; }

        let part_DB = this.props.configuration.part_tables[this.props.controllerExportData.tracker_moduleType + "_" + this.props.controllerExportData.tracker_hybridType];
        let cond_DB = this.props.configuration.condition_tables[this.props.controllerExportData.tracker_moduleType + "_" + this.props.controllerExportData.tracker_hybridType];
        this.sql = this.sql.replace("part_DB", "p" + part_DB)
        this.sql = this.sql.replace("cond_DB", "c" + cond_DB)

        let sqli = this.sql.substring(0, this.sql.indexOf('where'));
        let sqlf = this.sql.substring(this.sql.indexOf('where'), this.sql.length);

        console.log("this.props.controllerExportData.tracker_data")

        console.log(this.props.controllerExportData.tracker_data)

        this.props.controllerExportData.tracker_data.map((element, i) => { sqli = this.createSQL(element, sqli, sqlf, i) });

        console.log(sqli)

        return Resthub.json2(sqli, null, null, null, configuration.resthubUrl)
            .then(resp => {
                console.log(resp.data.data)
                const data = resp.data.data;
                return this.processStatusData(data);
            })
            .then(
                () => {
                    if (configuration.chart_mode == "pie_chart") this.createPieChart(this.formatData(this.state.data));
                    if (configuration.chart_mode == "stack_chart") {
                        this.createStackChart(
                            this.format_2D_Data(this.state.data),
                            this.get_categories_2D_Data(this.state.data)
                        );
                    }

                    console.log("this.state.data")
                    console.log(this.state.data)

                    this.chart.setTitle({ text: configuration.title });
                    this.chart.redraw();
                    this.chart.hideLoading();
                    return this.props.hideLoader();
                }
            );
    }

    formatData = (data) => {
        let serie = [{
            name: 'Status',
            colorByPoint: true,
            data: data
        }];

        return serie;
    }

    format_2D_Data = (data) => {

        //First we need a list of subcategories
        let sub_cat = []
        for (const [key_cat, value_cat] of Object.entries(data)) {
            for (const [key, value] of Object.entries(value_cat)) {
                sub_cat = sub_cat.includes(key) ? sub_cat : sub_cat.concat(key)
            }
        }

        let serie = []
        for (const sub_category of sub_cat) {
            let sub_serie = []
            for (const [key_cat, value_cat] of Object.entries(data)) {
                console.log(key_cat)
                if(value_cat[sub_category]){
                    sub_serie.push(value_cat[sub_category])
                }
                else{
                    sub_serie.push(0)
                }
            }
            serie.push({
                name: sub_category,
                data: sub_serie
            })
        }

        console.log("in format_2D_Data")
        console.log(serie)
        return serie;
    }

    get_categories_2D_Data = (data) => {
        let cat_2D = Object.keys(data);
        console.log(cat_2D)
        console.log(data)
        return cat_2D;
    }


    processStatusData = (data) => {
        const { configuration } = this.props;

        let cat = configuration.categories
        let sub_cat = configuration.subcategories

        let chart_mode = configuration.chart_mode
        let series = []

        if (chart_mode == "pie_chart") {
            const counts = {};
            data.map(
                (element) => {
                    counts[element[cat]] = counts[element[cat]] ? counts[element[cat]] + 1 : 1;
                }
            )


            for (const [key, value] of Object.entries(counts)) {


                let point = {};
                point['name'] = key;
                point['y'] = value;
                series.push(point)
            }
            this.setState({ data: series })
        }

        if (chart_mode == "stack_chart") {
            const counts = {};
            data.map(
                (element) => {
                    counts[element[cat]] = counts[element[cat]] ? counts[element[cat]] : {};
                    counts[element[cat]][element[sub_cat]] = counts[element[cat]][element[sub_cat]] ? counts[element[cat]][element[sub_cat]] + 1 : 1;
                }
            )

            this.setState({ data: counts })
        }

    }

    trimUndefined = () => {

        let series = []
        series = this.state.data.filter(s => (s.name != 'undefined'))

        console.log("here")
        console.log(this.formatData(series))
        return this.formatData(series);
    }

    createStackChart = (serie = [], cat = []) => {
        const { configuration } = this.props;

        let cat_string = configuration.categories
        let sub_cat_string = configuration.subcategories
        const options = {
            chart: {
                type: 'column'
            },
            title: {
                text: 'Stacked column chart'
            },
            xAxis: {
                categories: cat,
                title: {
                    text: cat_string
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: sub_cat_string
                }
            },
            tooltip: {
                pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.percentage:.0f}%)<br/>',
                shared: true
            },
            plotOptions: {
                column: {
                    stacking: 'percent'
                },
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                }
            },
            series: serie
        };

        this.chart = new Highcharts.chart(this.id, options);

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
                pointFormat: '{point.name}: <b>{point.y}</b>'
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
        console.log("here")


        const skipelement = ((sqlf.search("run_Number") > -1) && element.run_number == "undefined");
        sqlf = sqlf.replace("run_Number", "'" + element.run_number + "'")
        sqlf = sqlf.replace("serial_number", "'" + element.serial_number + "'")
        sqlf = sqlf.substring(5, sqlf.length);
        sqlf = "(" + sqlf + ")";

        if (!skipelement) {
            if (i == 0) {
                sqli = sqli + " where " + sqlf;
            }
            else if (!sqli.includes(" where ")) { sqli = sqli + " where " + sqlf; }
            else sqli = sqli + " or " + sqlf;
        }
        return sqli;
    }

    getDataHybrid = () => {

        console.log("ingetData")

        return true;
    }

    handleHideCategories = (event, isChecked) => {
        let { configuration } = this.props;
        if (isChecked) {
            if (configuration.chart_mode == "pie_chart") this.createPieChart(this.trimUndefined());
            if (configuration.chart_mode == "stack_chart") this.createStackChart();
            this.chart.setTitle({ text: configuration.title + " (hidden undefined)" });
        }
        else {
            if (configuration.chart_mode == "pie_chart") this.createPieChart(this.formatData(this.state.data));
            if (configuration.chart_mode == "stack_chart") this.createStackChart();
            this.chart.setTitle({ text: configuration.title });
        }
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
