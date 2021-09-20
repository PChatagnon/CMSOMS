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
import { withStyles } from '@material-ui/core/styles';


import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Button from '@material-ui/core/Button';
import SwapHorizIcon from '@material-ui/icons/SwapHoriz';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import bellCurve from "highcharts/modules/histogram-bellcurve";
bellCurve(Highcharts);

const RESTHUB_URL = '/tracker-resthub';



class TrackerTrendChart extends Component {

    constructor(props) {
        super(props);
        this.chart = null;
        this.id = generateId('TrackerTrendChart');
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
            nbBins: -1
        }

        this.columns = {
            columns: [] //list of selected columns
        };
    }

    componentDidUpdate(prevProps) {
        if (this.state.mode == '2D') {
            this.props.shouldUpdate(prevProps.query, this.props.query, this.loadData);
            this.props.shouldRefresh(this.props, this.loadData);
            console.log("in update")
        }
        else {
            this.props.shouldUpdate(prevProps.query, this.props.query, this.loadDataFreq);
            this.props.shouldRefresh(this.props, this.loadDataFreq);
            console.log("in update 2")
        }

        this.shouldResize();
    }

    loadMeta = () => {
        const { configuration } = this.props;
        let sql = configuration.url;
        Object.entries(this.props.query).forEach(e => {
            if (e[1] === '') {
                e[1] = null;
                sql = sql.replace(' = ' + e[0], ' is ' + e[1]);
            } else {
                sql = sql.replace(e[0], "'" + e[1] + "'");
            }
        });
        console.log("HERERERERERE " + sql);

        return Resthub.query("SELECT * FROM ( " + sql + " ) meta  ", this.resthubUrl)
            .then(response => {
                return Resthub.meta(response.data, this.resthubUrl)
                    .then(response => {
                        console.log("here in meta response");
                        console.log(response);
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
                    })
            }).catch(error => this.props.onFailure(error));
    }

    loadData = (query = this.props.query) => {

        this.loadMeta().then(
            () => {

                this.setState({ loadMeta: true })
                this.props.showLoader();

                this.colorCount = 0;
                this.axisColor = 0;

                // Remove all chart series without redrawing
                while (this.chart.series.length > 0)
                    this.chart.series[0].remove(false);

                this.chart.redraw();

                const { configuration } = this.props;
                this.sql = configuration.url;

                let sql3 = this.sql;
                if (this.AllowDisplay()) sql3 = "SELECT data." + this.state.labelX.label + " " + ", data." + this.state.labelY.label + " " + " FROM ( " + this.sql + " ) data  ORDER BY data." + this.state.labelX.label + " ASC";

                this.create2Dplot(configuration)
                console.log("query.tracker_data");
                console.log(query.tracker_data);
                if (query.tracker_data.length > 0) {
                    query.tracker_data.forEach(e => {
                        let sql2 = sql3;
                        Object.entries(e).forEach(ef => {
                            if (ef[1] === '') {
                                ef[1] = null;
                                sql2 = sql2.replace(' = ' + ef[0], ' is ' + ef[1]);
                            } else {
                                sql2 = sql2.replace(ef[0], "'" + ef[1] + "'");
                            }
                        })

                        console.log("sql2: " + sql2);
                        const { xAxisObjectName, superImpose } = configuration;
                        Resthub.json2(sql2, null, null, null, configuration.resthubUrl)
                            .then(resp => {
                                const data = resp.data.data;

                                //let series = [];
                                let seria = {};
                                seria['name'] = e['tracker_id'];
                                seria['data'] = [];
                                data.forEach(d => {
                                    seria['data'].push([d[this.state.labelX.name], d[this.state.labelY.name]])//[d[xAxisObjectName], d[superImpose]])
                                });
                                seria['tooltip'] = {
                                    pointFormatter: function () {
                                        return `<span style='color: ${this.series.color}'>\u25CF</span> ${this.series.name}: <b>${this.y}</b><br />`;
                                    }
                                }
                                seria['color'] = Highcharts.getOptions().colors[this.colorCount]
                                this.colorCount = this.colorCount + 1;
                                this.chart.addSeries(seria);
                                this.chart.setTitle({ text: this.state.labelY.name + " VS " + this.state.labelX.name });
                                this.chart.redraw();
                                if (!data.length)
                                    return this.props.onEmpty();
                                this.chart.hideLoading();
                                return this.props.hideLoader();
                            }).catch(error => this.props.onFailure(error));
                    })
                } else {
                    let sql2 = sql3;
                    Object.entries(this.props.query).forEach(e => {
                        if (e[1] === '') {
                            e[1] = null;
                            sql2 = sql2.replace(' = ' + e[0], ' is ' + e[1]);
                        } else {
                            sql2 = sql2.replace(e[0], "'" + e[1] + "'");
                        }
                    })
                    console.log("sql2 prime: " + sql2);
                    Resthub.json2(sql2, null, null, null, configuration.resthubUrl)
                        .then(resp => {
                            const data = resp.data.data;
                            let series = [];
                            console.log("configuration: ");
                            console.log(configuration);
                            console.log(query);
                            Object.entries(configuration.series).forEach(e => {
                                let seria = {};
                                //seria['useHTML'] = true;
                                seria['name'] = query.tracker_partBarcode;//e[1].name
                                seria['data'] = [];
                                seria['dataAxis'] = configuration.yAxes[e[1].yAxis].yAxisObjectName//this.state.LabelX//
                                seria['yAxis'] = e[1].yAxis;//this.state.labelY;//
                                seria['tooltip'] = {
                                    pointFormatter: function () {
                                        return `<span style='color: ${this.series.color}'>\u25CF</span> ${this.series.name}: <b>${this.y}</b><br />`;
                                    }
                                }
                                seria['color'] = Highcharts.getOptions().colors[this.colorCount]
                                series.push(seria);
                            });
                            data.forEach(d => {
                                series.forEach(s => {
                                    s.data.push([d[this.state.labelX.name], d[this.state.labelY.name]])
                                })
                            });
                            series.forEach(s => {
                                this.chart.addSeries(s, false)
                            })

                            console.log(series);

                            this.chart.setTitle({ text: this.state.labelY.name + " VS " + this.state.labelX.name }); //query[configuration.paramForTitle]

                            this.chart.redraw();

                            if (!data.length)
                                return this.props.onEmpty();

                            this.chart.hideLoading();
                            return this.props.hideLoader();
                        }).catch(error => this.props.onFailure(error));
                }

            });
    }

    loadDataFreq = (query = this.props.query) => {

        this.loadMeta().then(
            () => {

                this.setState({ loadMeta: true })
                this.props.showLoader();

                this.colorCount = 0;
                this.axisColor = 0;

                // Remove all chart series without redrawing
                while (this.chart.series.length > 0)
                    this.chart.series[0].remove(false);

                this.chart.redraw();

                const { configuration } = this.props;
                this.sql = configuration.url;

                let sql3 = this.sql;


                if (this.AllowDisplay()) sql3 = "SELECT data." + this.state.labelX.label + " FROM ( " + this.sql + " ) data  ";


                this.createFreqplot();

                let dataTab = [];

                if (query.tracker_data.length > 0) {

                    query.tracker_data.forEach(e => {
                        let sql2 = sql3;//this.sql
                        Object.entries(e).forEach(ef => {
                            if (ef[1] === '') {
                                ef[1] = null;
                                sql2 = sql2.replace(' = ' + ef[0], ' is ' + ef[1]);
                            } else {
                                sql2 = sql2.replace(ef[0], "'" + ef[1] + "'");
                            }
                        })

                        Resthub.json2(sql2, null, null, null, configuration.resthubUrl)
                            .then(resp => {
                                const data = resp.data.data;

                                data.forEach(d => {
                                    dataTab.push([d[this.state.labelX.name]]);
                                });



                                if ((query.tracker_data[query.tracker_data.length - 1] === e)) {
                                    const serie = {
                                        name: 'Input data',
                                        data: dataTab,
                                        visible: false,
                                        id: 's1'
                                    };
                                    this.chart.addSeries(serie, false);
                                    this.chart.setTitle({ text: this.state.labelX.name });
                                    this.chart.redraw();
                                }

                                if (!data.length)
                                    return this.props.onEmpty();
                                this.chart.hideLoading();
                                return this.props.hideLoader();
                            }).catch(error => this.props.onFailure(error));
                    })




                } else {
                    let sql2 = sql3;
                    Object.entries(this.props.query).forEach(e => {
                        if (e[1] === '') {
                            e[1] = null;
                            sql2 = sql2.replace(' = ' + e[0], ' is ' + e[1]);
                        } else {
                            sql2 = sql2.replace(e[0], "'" + e[1] + "'");
                        }
                    })

                    Resthub.json2(sql2, null, null, null, configuration.resthubUrl)
                        .then(resp => {
                            const data = resp.data.data;
                            data.forEach(d => {
                                dataTab.push([d[this.state.labelX.name]]);
                            });

                            const serie = {
                                name: 'Input data',
                                data: dataTab,
                                visible: false,
                                id: 's1'
                            };

                            this.chart.addSeries(serie, false);
                            this.chart.setTitle({ text: this.state.labelX.name });
                            this.chart.redraw();

                            if (!data.length)
                                return this.props.onEmpty();

                            this.chart.hideLoading();
                            return this.props.hideLoader();
                        }).catch(error => this.props.onFailure(error));
                }

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
                    text: XAxis
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

    createFreqplot = () => {

        var binOption = (this.state.nbBins > 0) ? parseInt(this.state.nbBins) : 'square-root';
        console.log('nbbins ' + binOption)

        const options = {
            chart: {
                height: this.props.portletHeight - 50
            },
            title: {
                text: 'Highcharts Histogram'
            },

            xAxis: [{
                title: { text: '' },
                alignTicks: false
            }, {
                title: { text: this.state.labelX.name },
                alignTicks: false
            }],

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
        console.log(options);
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
            plotOptions: {
                series: {
                    pointStart: 0,
                    lineWidth: 0
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
        this.yAxes.pop();
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
        this.yAxes.push(obj);
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
        let formerX = this.state.labelX;
        let formerY = this.state.labelY;
        this.setState({ labelX: formerY });
        this.setState({ labelY: formerX });
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

    };

    handleDisplayClick = (event) => {
        if (this.state.mode == '2D') this.showData2D();
        else if (this.state.mode == 'Freq') this.showDataFreq();
    }

    handleLogScale = (event, isChecked) => {
        const type = isChecked ? 'logarithmic' : 'linear';
        this.chart.yAxis[0].update({ type: type });
        console.log(this.state);
        console.log(this.AllowDisplay());
    }

    handleModeFrequency = (event, isChecked) => {
        //console.log(this.state);
        const type = isChecked ? 'Freq' : '2D';
        this.setState({ mode: type })
    }

    handleMode2D = (event, isChecked) => {
        const type = isChecked ? '2D' : 'Freq';
        this.setState({ mode: type })
        //console.log(this.state);
    }

    handleBinChange = (event) => {
        this.setState({ nbBins: event.target.value })
    }


    renderAxis = () => {
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
                return <MenuItem value={column.label} key={column.label}> {`${column.label}`} </MenuItem>;
            });
        }
        else return <MenuItem value={emptycol}> {empty} </MenuItem>;

    }

    render() {
        const { mode } = this.state;
        console.log("mode ");
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
                        {this.renderAxis()}
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
                        {this.renderAxis()}
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
                    color="primary"
                    onClick={this.handleDisplayClick}
                    style={{ marginTop: -10, marginLeft: 20 }}
                    disabled={!this.AllowDisplay()}
                >
                    Display
                </Button>
            </div>
        );
    }
}

export default sizeMe({ monitorWidth: true })(TrackerTrendChart);
