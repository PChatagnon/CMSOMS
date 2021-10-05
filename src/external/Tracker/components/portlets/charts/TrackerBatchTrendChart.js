import React, { Component } from 'react';
import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsOfflineExporting from 'highcharts/modules/offline-exporting';
import HighchartsAccesibility from 'highcharts/modules/accessibility';
HighchartsAccesibility(Highcharts);
import Resthub from '../../../../../components/providers/Resthub';
//import { generateId, getRandomColor } from '../../../../../utils/utils';
import { generateId, setHighchartsLibURL } from '../../../../../utils/utils';
import sizeMe from 'react-sizeme';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
HighchartsExporting(Highcharts);
HighchartsOfflineExporting(Highcharts);
setHighchartsLibURL(Highcharts);
import HC_more from 'highcharts/highcharts-more';
HC_more(Highcharts);
import bellCurve from "highcharts/modules/histogram-bellcurve";
bellCurve(Highcharts);



import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Button from '@material-ui/core/Button';
import SwapHorizIcon from '@material-ui/icons/SwapHoriz';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';


const RESTHUB_URL = '/tracker-resthub';

class TrackerBatchTrendChart extends Component {

    constructor(props) {
        super(props);
        this.chart = null;
        this.id = generateId('TrackerBatchTrendChart');
        this.yAxes = [];
        this.state = {
            mode: '2D',
            labelX: {
                title: '',
                name: '',
                label: '',
                type: '',
                description: null,
                units: null,
                sortable: true,
            },
            labelY: {
                title: '',
                name: '',
                label: '',
                type: '',
                description: null,
                units: null,
                sortable: true,
            },
            loadMeta: false,
            displayed: false,
            buttonText: "Display",
            buttonColor: "primary",
            data2D: [],
            errorX: [],
            errorY: [],
            dataFreq: [],
            nbBins: -1
        }

        this.columns = {
            columns: [] //list of selected columns
        };
    }

    componentDidUpdate(prevProps) {
        /*if (this.state.mode == '2D' && !this.AllowDisplay()) {
            this.props.shouldUpdate(prevProps.query, this.props.query, this.loadMeta);
            this.props.shouldRefresh(this.props, this.loadMeta);
        }
        else if (!this.AllowDisplay()) {
            this.props.shouldUpdate(prevProps.query, this.props.query, this.loadMeta);
            this.props.shouldRefresh(this.props, this.loadMeta);
        }
        else*/ if (this.state.mode == '2D') {
            this.props.shouldUpdate(prevProps.query, this.props.query, this.loadData);
            this.props.shouldRefresh(this.props, this.loadData);

        }
        else if (this.AllowDisplay()) {
            this.props.shouldUpdate(prevProps.query, this.props.query, this.loadDataFreq);
            this.props.shouldRefresh(this.props, this.loadDataFreq);

        }
        this.shouldResize();
    }

    loadMeta = () => {
        const { configuration } = this.props;
        //console.log("this.props")
        //console.log(this.props)
        let sql2 = configuration.url;
        if (this.props.controllerExportData.tracker_data.length > 0) {
            Object.entries(this.props.controllerExportData.tracker_data[0].barcodeRunList[0]).forEach(ef => {
                sql2 = sql2.replace(ef[0], "'" + ef[1] + "'");

            })
            sql2 = sql2.replace("tracker_hmStructType", "'" + this.props.query.tracker_hmStructType + "'")
            sql2 = sql2.replace("tracker_fluteType", "'" + this.props.query.tracker_fluteType + "'")
            sql2 = sql2.replace("tracker_hmSetType", "'" + this.props.query.tracker_hmSetType + "'")
            sql2 = sql2.replace("tracker_hmConfigType", "'" + this.props.query.tracker_hmConfigType + "'")


        }

        return Resthub.query("SELECT * FROM ( " + sql2 + " ) meta  ", this.resthubUrl)
            .then(response => {
                return Resthub.meta(response.data, this.resthubUrl)
                    .then(response => {
               
                        this.columns = response.data.columns.map(column => {
                            return {
                                title: column.name,
                                name: column.jname,
                                label: column.name,
                                type: column.type.toLowerCase(),
                                description: null,
                                units: null,
                                sortable: true,
                            }
                        });

                        this.columns.unshift({
                            title: "Batch nb",
                            name: "Batch nb",
                            label: "BATCH nb",
                            type: "Batch nb".toLowerCase(),
                            description: null,
                            units: null,
                            sortable: true,
                        });
                        this.setState({ loadMeta: true })
                    })
            }).catch(error => this.props.onFailure(error));
    }

    average(array, i) {
        let reduced = array.map(a => a[i]);
        return reduced.reduce((a, b) => a + b) / array.length;
    }

    min_max(array, i) {
        let reduced = array.map(a => a[i]);
        var min = Math.min(...reduced);
        var max = Math.max(...reduced);
        return [min, max]
    }

    sigma(array, i) {
        const n = array.length
        let reduced = array.map(a => a[i]);
        const mean = reduced.reduce((a, b) => a + b) / n
        return Math.sqrt(reduced.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
    }

    createSQL = (element, sqli, sqlf, i) => {

        const { configuration } = this.props;
        const partBarcode = configuration.partBarcode; // tracker_partBarcode
        const runTypeNumber = configuration.runTypeNumber; // tracker_runTypeNumber

        sqlf = sqlf.replace(partBarcode, "'" + element.tracker_partBarcode + "'")
        sqlf = sqlf.replace(runTypeNumber, "'" + element.tracker_runTypeNumber + "'")
        sqlf = sqlf.substring(5, sqlf.length);
        sqlf = "(" + sqlf + ")";

        if (i == 0) {
            sqli = sqli + " where " + sqlf;
        }
        else sqli = sqli + " or " + sqlf;

        sqli = sqli.replace("tracker_hmStructType", "'" + this.props.query.tracker_hmStructType + "'")
        sqli = sqli.replace("tracker_fluteType", "'" + this.props.query.tracker_fluteType + "'")
        sqli = sqli.replace("tracker_hmSetType", "'" + this.props.query.tracker_hmSetType + "'")
        sqli = sqli.replace("tracker_hmConfigType", "'" + this.props.query.tracker_hmConfigType + "'")


        return sqli;
    }

    getBatch = (batch) => {
        let Batch = {};
        Batch['data'] = [];
        Batch['min_max'] = [];
        Batch['sigma'] = [];
        Batch['ID'] = batch.tracker_id;
        let mean_data = [];
        let retrieved_data = [];

        const { configuration } = this.props;
        this.sql = configuration.url;
        let sqli = this.sql.substring(0, this.sql.indexOf('where'));
        let sqlf = this.sql.substring(this.sql.indexOf('where'), this.sql.length);
        batch.barcodeRunList.map((element, i) => { sqli = this.createSQL(element, sqli, sqlf, i) });

        return Resthub.json2(sqli, null, null, null, configuration.resthubUrl) 
            .then(resp => {
                const data = resp.data.data;
                data.forEach(d => {
                    retrieved_data.push([d[this.state.labelX.name], d[this.state.labelY.name]])
                });

                let batch_number = parseInt(Batch['ID'].substring(6))
                if (this.state.labelX.name == "Batch nb") {
                    mean_data = [[batch_number, this.average(retrieved_data, 1)]];
                }
                else if (this.state.labelY.name == "Batch nb") {
                    mean_data = [[this.average(retrieved_data, 0), batch_number]];
                }
                else mean_data = [[this.average(retrieved_data, 0), this.average(retrieved_data, 1)]];

                Batch['data'] = mean_data;
                Batch['min_max'] = [this.min_max(retrieved_data, 0), this.min_max(retrieved_data, 1)];
                Batch['sigma'] = [this.sigma(retrieved_data, 0), this.sigma(retrieved_data, 1)];
                return Batch;
            }).catch(error => this.props.onFailure(error));

    }

    loadData = (controllerExportData = this.props.controllerExportData) => {
        this.loadMeta().then(
            () => {

                this.props.showLoader();
                const { configuration } = this.props;
                this.setState({ loadMeta: true })
                this.props.showLoader();
                this.colorCount = 0;
                this.axisColor = 0;
                this.chart.redraw();
                this.create2Dplot(configuration);

                var data2D = [];
                var errorX = [];
                var errorY = [];

                const promises = [];
                //console.log(" here at controllerExportData")
                //console.log(this.props.controllerExportData)
                //console.log(controllerExportData)
                this.props.controllerExportData.tracker_data.map((c) => {
                    promises.push(this.getBatch(c))
                })

                Promise.all(promises)
                    .then(results => {
                        let batchdataList = [];
                       
                        batchdataList = results.map((val, index) => { return val; });
                        return batchdataList.map((s, index) => {
                            let seria = {};
                            let sigma_seria = {};
                            let sigmaX_seria = {};

                            var color = (this.state.labelX.name == "Batch nb" || this.state.labelY.name == "Batch nb") ? Highcharts.getOptions().colors[0] : Highcharts.getOptions().colors[index % 10];

                           
                            seria['marker'] = {
                                radius: 7,
                                symbol: 'circle'
                            }
                            seria['data'] = s.data;
                            seria['name'] = s.ID;
                            seria['id'] = s.ID;
                            seria['color'] = color;
                            seria['tooltip'] = {
                                pointFormatter: function () {
                                    return `<span style='color: ${this.series.color}'>\u25CF</span> <b>" X "${this.x}</b> <b>" Y "${this.y}</b><br />`;
                                }
                            }

                            data2D.push(seria);

                            sigma_seria['type'] = 'line';
                            sigma_seria['linkedTo'] = s.ID;
                            sigma_seria['name'] = s.ID;
                            sigma_seria['marker'] = { radius: 0 }
                            sigma_seria['lineWidth'] = 2;
                            sigma_seria['data'] = [[s.data[0][0], s.data[0][1] - s.sigma[1]], [s.data[0][0], s.data[0][1] + s.sigma[1]]];//[[s.data[0]-s.sigma[0], s.data[0]+s.sigma[0]]];
                            sigma_seria['tooltip'] = {
                                pointFormatter: function () {
                                    return `<span style='color: ${this.series.color}'>\u25CF</span> <b>" X "${this.x}</b> <b>" Y "${this.y}</b><br />`;
                                }
                            };
                            sigma_seria['color'] = color;

                            errorY.push(sigma_seria);

                            sigmaX_seria['type'] = 'line';
                            sigmaX_seria['linkedTo'] = s.ID;
                            sigmaX_seria['name'] = s.ID;
                            sigmaX_seria['marker'] = { radius: 0 }
                            sigmaX_seria['lineWidth'] = 2;
                            sigmaX_seria['data'] = [[s.data[0][0] - s.sigma[0], s.data[0][1]], [s.data[0][0] + s.sigma[0], s.data[0][1]]];
                            sigmaX_seria['color'] = color;
                            sigmaX_seria['tooltip'] = {
                                pointFormatter: function () {
                                    return `<span style='color: ${this.series.color}'>\u25CF</span> <b>" X "${this.x}</b> <b>" Y "${this.y}</b><br />`;
                                }
                            };
                            errorX.push(sigmaX_seria);

                            this.chart.addSeries(seria, false);
                            this.chart.addSeries(sigma_seria, false);
                            this.chart.addSeries(sigmaX_seria, false);

                        })
                    }).then(() => {
                        this.setState({ displayed: true })
                        this.setState({ data2D: data2D })
                        this.setState({ errorY: errorY })
                        this.setState({ errorX: errorX })
                        this.chart.setTitle({ text: this.state.labelY.name + " VS " + this.state.labelX.name });
                        this.chart.redraw();
                        return this.props.hideLoader();
                    });
            })
    }


    loadDataFreq = (controllerExportData = this.props.controllerExportData) => {

        this.loadMeta().then(
            () => {
                const { configuration } = this.props;
                this.setState({ loadMeta: true })
                this.props.showLoader();
                this.colorCount = 0;
                this.axisColor = 0;
                this.chart.redraw();
                this.createFreqplot();

                const promises = [];
                controllerExportData.tracker_data.map((c) => {
                    promises.push(this.getBatch(c))
                })
                let seria = [];
                Promise.all(promises)
                    .then(results => {
                        let batchdataList = [];
                      
                        batchdataList = results.map((val, index) => { return val; });

                        return batchdataList.map(s => {
                            seria.push(s.data[0][0]);

                        })
                    }).then(() => {
                        const serie = {
                            name: 'Input data',
                            data: seria,
                            visible: false,
                            id: 's1'
                        };

                        this.setState({ dataFreq: seria })
                        this.setState({ displayed: true })
                        this.chart.addSeries(serie, false);
                        this.chart.setTitle({ text: this.state.labelX.name });
                        this.chart.redraw();
                        return this.props.hideLoader();
                    });

            });
    }

    showData2D = () => {
        this.loadData();
    }

    showDataFreq = () => {
        this.loadDataFreq();
    }

    componentDidMount() {
        let { configuration } = this.props;

        this.createYaxes(configuration)

        let XAxis = '';
        if (this.state.labelX) XAxis = this.state.labelX.label;

        const options = {
            chart: {
                height: this.props.portletHeight - 50,
                zoomType: 'xy',
                panning: true,
                panKey: 'shift',
                type: 'scatter'
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
                    text: XAxis
                },
            },
            tooltip: {
                shared: true
            },
            series: []
        };

        this.chart = new Highcharts.chart(this.id, options);
        this.loadMeta();
    }

    createFreqplot = () => {

        var binOption = (this.state.nbBins > 0) ? parseInt(this.state.nbBins) : 'square-root';

        const options = {
            chart: {
                height: this.props.portletHeight - 50
            },
            xAxis: [{
                title: { text: '' },
                alignTicks: false
            }, {
                title: { text: this.state.labelX.name },
                alignTicks: false
            }],
            title: {
                text: null
            },
            yAxis: [{
                title: { text: '' }
            }, {
                title: { text: 'Counts' }
            }],

            series: [{
                name: this.state.labelX.name,
                type: 'histogram',
                xAxis: 1,
                yAxis: 1,
                baseSeries: 's1',
                zIndex: -1,
                binsNumber: binOption
            }]
        };
        this.chart = new Highcharts.chart(this.id, options);
    }

    create2Dplot = () => {
        this.createYaxes()

        const options = {
            chart: {
                height: this.props.portletHeight - 50,
                zoomType: 'xy',
                panning: true,
                panKey: 'shift',
                type: 'scatter'
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
                    text: this.state.labelX.label
                },
            },
            tooltip: {
                shared: true
            },
            series: []
        };
        this.chart = new Highcharts.chart(this.id, options);

    }

    createYaxes = () => {
        //this.yAxes.pop();
        let obj = {
            labels: {
                gridLineWidth: 0,
                format: '{value}',
                style: {
                    color: "black"
                }
            },
            title: {
                useHTML: true,
                text: this.state.labelY.label,
                reversed: false,
                style: {
                    color: "black"
                }
            },
            opposite: false
        }
        this.yAxes = [obj];
    }

    componentWillUnmount() {
        this.chart.destroy();
    }

    shouldResize() {
        if (this.chart && this.props.editMode) {
            const newSize = { width: this.props.size.width, height: this.props.portletHeight - 50 };
            const changed = this.haveSizeChanged(newSize);

            if (changed) {
                this.chart.setSize(newSize.width, newSize.height);
            }
        }
    }

    haveSizeChanged = (newSize) => {
        return newSize.width !== this.chart.chartWidth || newSize.height !== this.chart.chartHeight;
    }



    AllowDisplay = () => {
        let display = (this.state.mode == '2D' && this.state.labelY.name != '' && this.state.labelX.name != '') || (this.state.mode == 'Freq' && this.state.labelX.name != '');
        return display;
    }

    swapLabel = () => {
        var formerX = this.state.labelX;
        var formerY = this.state.labelY;
        this.setState({ labelX: formerY });
        this.setState({ labelY: formerX });
        if (this.state.displayed) {
            this.setState({ buttonText: "UPDATE" })
            this.setState({ buttonColor: "secondary" })
        }
    }

    handleChangeX = (event) => {
        if (this.state.labelY.label == event.target.value) {
            this.setState({
                labelY: {
                    title: '',
                    name: '',
                    label: '',
                    type: '',
                    description: null,
                    units: null,
                    sortable: true
                }
            });
        }

        this.setState({ displayed: false })
        this.setState({ buttonText: "DISPLAY" })
        this.setState({ buttonColor: "primary" })
        this.setState({ labelX: this.columns.find(c => c.label === event.target.value) });

    };

    handleChangeY = (event) => {
        if (this.state.labelX.label == event.target.value) {
            this.setState({
                labelX: {
                    title: '',
                    name: '',
                    label: '',
                    type: '',
                    description: null,
                    units: null,
                    sortable: true
                }
            });
        }


        this.setState({ labelY: this.columns.find(c => c.label === event.target.value) });
        this.setState({ displayed: false })
        this.setState({ buttonText: "DISPLAY" })
        this.setState({ buttonColor: "primary" })
    };

    handleDisplayClick = (event) => {
        if (this.state.displayed && this.state.mode == 'Freq' && this.state.buttonText != "UPDATED") {
            this.createFreqplot();
            const serie = {
                name: 'Input data',
                data: this.state.dataFreq,
                visible: false,
                id: 's1'
            };
            this.chart.addSeries(serie, false);

            this.chart.redraw();
            this.props.hideLoader();
            this.setState({ buttonText: "UPDATED" })
            this.setState({ buttonColor: "primary" })
        }
        else if (this.state.displayed && this.state.mode == '2D' && this.state.buttonText != "UPDATED") {
            this.create2Dplot();
            //handle swapping XY of the data
            var newdata2D = this.state.data2D.map(
                (serie) => {
                    var old_varx = serie['data'][0][0];
                    var old_vary = serie['data'][0][1];
                    serie['data'][0][0] = old_vary;
                    serie['data'][0][1] = old_varx;
                    this.chart.addSeries(serie, false);
                    return serie;
                });
            this.setState({ data2D: newdata2D });

            //handle swapping error bars
            var newerrorX = this.state.errorY.map(
                (serie) => {
                    serie['type'] = 'line';
                    var old_varx = serie['data'][0][0];
                    var old_low = serie['data'][0][1];
                    var old_high = serie['data'][1][1];
                    serie['data'] = [[old_low, old_varx], [old_high, old_varx]];
                    this.chart.addSeries(serie, false);
                    return serie;
                });
            this.setState({ errorX: newerrorX });

            var newerrorY = this.state.errorX.map(
                (serie) => {
                    serie['type'] = 'line';
                    var old_vary = serie['data'][0][1];
                    var old_left = serie['data'][0][0];
                    var old_right = serie['data'][1][0];
                    serie['data'] = [[old_vary, old_left], [old_vary, old_right]];
                    this.chart.addSeries(serie, false);
                    return serie;
                });
            this.setState({ errorY: newerrorY });

            this.chart.redraw();
            this.props.hideLoader();
            this.setState({ buttonText: "UPDATED" })
            this.setState({ buttonColor: "primary" })

        }
        else if (this.state.mode == '2D' && this.state.buttonText == "DISPLAY") {
            this.showData2D();
            this.setState({ buttonText: "UPDATED" })
            this.setState({ buttonColor: "primary" })
        }
        else if (this.state.mode == 'Freq' && this.state.buttonText == "DISPLAY") {
            this.showDataFreq();
            this.setState({ buttonText: "UPDATED" })
            this.setState({ buttonColor: "primary" })
        }
    }

    handleLogScale = (event, isChecked) => {
        const type = isChecked ? 'logarithmic' : 'linear';
        this.chart.yAxis[0].update({ type: type });
    }

    handleModeFrequency = (event, isChecked) => {
        const type = isChecked ? 'Freq' : '2D';
        this.setState({ displayed: false })
        this.setState({ mode: type })
        this.setState({ buttonText: "DISPLAY" })
        this.setState({ buttonColor: "primary" })
    }

    handleMode2D = (event, isChecked) => {
        const type = isChecked ? '2D' : 'Freq';
        this.setState({ displayed: false })
        this.setState({ mode: type })
        this.setState({ buttonText: "DISPLAY" })
        this.setState({ buttonColor: "primary" })
    }

    handleBinChange = (event) => {
        this.setState({ nbBins: event.target.value })
        this.setState({ buttonText: "UPDATE" })
        this.setState({ buttonColor: "secondary" })

    }


    renderXAxis = () => {
        let empty = 'No data';
        let emptycol = {
            title: '',
            name: '',
            label: '',
            type: '',
            description: null,
            units: null,
            sortable: true
        };
        if (this.state.loadMeta && this.columns.length > 0) {
            return this.columns.map((column) => {
                return <MenuItem value={column.label} key={column.label} > {`${column.label}`} </MenuItem>;
            });
        }
        else return <MenuItem value={emptycol}> {empty} </MenuItem>;

    }

    renderYAxis = () => {
        let empty = 'No data';
        let emptycol = {
            title: '',
            name: '',
            label: '',
            type: '',
            description: null,
            units: null,
            sortable: true
        };
        if (this.state.loadMeta && this.columns.length > 0) {
            return this.columns.map((column) => {
                return <MenuItem value={column.label} key={column.label} > {`${column.label}`} </MenuItem>;
            });
        }
        else return <MenuItem value={emptycol}> {empty} </MenuItem>;

    }

    render() {
        const { mode } = this.state;
        return (
            <div>
                <div id={this.id} />
                <FormControlLabel
                    disabled={mode == 'Freq'}
                    style={{ marginTop: -10, marginLeft: 5 }}
                    control={<Checkbox color="primary" onChange={this.handleLogScale} />}
                    label="Log scale"
                />

                <FormControl component="fieldset">
                    <InputLabel id="x_axis" style={{ marginTop: -10, marginLeft: 20 }} >X axis</InputLabel>
                    <Select
                        labelId="x_axis"
                        id="x_axis"
                        value={this.state.labelX.label}
                        onChange={this.handleChangeX}
                        style={{ marginTop: -10, marginLeft: 75, minWidth: 200 }}
                        autoWidth
                    >
                        {this.renderXAxis()}
                    </Select>
                </FormControl>

                <IconButton color="primary" onClick={this.swapLabel}
                    style={{ marginTop: -10, marginLeft: 20 }}
                    disabled={mode == 'Freq'}
                    onClick={this.swapLabel}
                >
                    <SwapHorizIcon />
                </IconButton>

                <FormControl component="fieldset">
                    <InputLabel id="y_axis" style={{ marginTop: -10, marginLeft: 20 }}>Y axis</InputLabel>
                    <Select
                        disabled={mode == 'Freq'}
                        labelId="y_axis"
                        id="y_axis"
                        value={this.state.labelY.label}
                        onChange={this.handleChangeY}
                        style={{ marginTop: -10, marginLeft: 75, minWidth: 200 }}
                        autoWidth
                    >
                        {this.renderYAxis()}
                    </Select>
                </FormControl>

                <FormControl component="fieldset">
                    <RadioGroup row aria-label="Aggregate" name="Aggregate" defaultValue="2D">
                        <FormControlLabel
                            style={{ marginTop: -10, marginLeft: 35 }}
                            value="2D"
                            control={<Radio color="primary" onChange={this.handleMode2D} />}
                            label="2D Chart"
                            labelPlacement="start"
                        />

                        <FormControlLabel
                            style={{ marginTop: -10, marginLeft: 25 }}
                            value="frequency"
                            control={<Radio color="primary" onChange={this.handleModeFrequency} />}
                            label="1D Chart"//"Frequency plot"
                            labelPlacement="start"
                        />

                        <TextField
                            disabled={mode == '2D'}
                            style={{ marginTop: -10, marginLeft: 20, maxWidth: 100 }}
                            id="bins"
                            label="Nb of bins"
                            variant="outlined"
                            onChange={this.handleBinChange}
                        />

                    </RadioGroup>
                </FormControl>


                <Button variant="contained"
                    color={this.state.buttonColor}
                    onClick={this.handleDisplayClick}
                    style={{ marginTop: -10, marginLeft: 20 }}
                    disabled={!this.AllowDisplay()}
                >
                    {this.state.buttonText}
                </Button>
            </div>
        );
    }
}

export default sizeMe({ monitorWidth: true })(TrackerBatchTrendChart);
