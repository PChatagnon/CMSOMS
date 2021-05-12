/**
 *    OmsChart
 *
 *    very generic Highcharts chart to plot data provided by OMS aggregation API
 *
 *
 *
 */



import React, { Component } from 'react';
import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsOfflineExporting from 'highcharts/modules/offline-exporting';
import * as histogram from 'highcharts/modules/histogram-bellcurve';
import { generateId, setHighchartsLibURL } from '../../../../utils/utils';
import { dateToUnix } from '../../../../utils/dateUtils';
import { createAdaptedSelectors } from '../../PortletUtils';
import sizeMe from 'react-sizeme';
//import katex from 'katex';
import { cloneDeep } from 'lodash';

HighchartsExporting(Highcharts);
HighchartsOfflineExporting(Highcharts);
setHighchartsLibURL(Highcharts);

export class OmsChart extends Component {

    static useConverterXToCategories = 'useConverterXToCategories';
    static useConverterXToUnixTime = 'useConverterXToUnixTime';

    convertXData = (x) => x;
    convertXDataToUnixTime = (x) => dateToUnix(x);
    convertXDataToCategories = (x) => {
        if (this.configuration.highcharts.xAxis && this.configuration.highcharts.xAxis.categories) {
            let index = this.configuration.highcharts.xAxis.categories.indexOf(x);
            if (index > 0)
                return index;
            else
                return 0;
        }
        return x;
    }

    constructor(props) {
        super(props);
        this.id = generateId('omsChart');
        this.configuration = cloneDeep(this.props.configuration);
        this.chart = null;
        this.endpoints = [];    // array of objects storing all the info needed to retrieve data from an endpoint
                                // each entry is an extended copy of entries in props.configuration.plots array
        this.yAxisNames = [];   // string array to identify y axis in use
        this.plotBands = [];
        if (this.configuration && this.configuration.xDataConverter) {
            if (this.configuration.xDataConverter === OmsChart.usecConverterXToCategories)
                this.convertXData = this.convertXDataToCategories;
            else if (this.configuration.xDataConverter === OmsChart.usecConverterXToUnixTime)
                this.convertXData = this.convertXDataToUnixTime;
        }
    }


    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, this.loadData);
        this.props.shouldRefresh(this.props, this.loadData);
        this.shouldResize();
    }
    
    static extendConfig( config ) {
        const { plots = [], timestampAttribute, xAttribute, aggpath, endpoint, selectors, highcharts: options = {} } = config;
        let { yAxis } = config;

        let yAxes = [];
        let yAxisNames = [];

        // copy predefined y axes to local arrays
        if (options.yAxis) {
            if (Array.isArray(options.yAxis)) {
                options.yAxis.forEach(yAxis => {
                    if (yAxis.title && yAxis.title.text) {
                        yAxisNames.push(yAxis.title.text);
                        yAxes.push(yAxis);
                    }
                })
            }
            else if (options.yAxis.title && options.yAxis.title.text) {
                yAxes.push(options.yAxis);
                yAxisNames.push(options.yAxis.title.text);
            }
        }
        if (!yAxis && yAxisNames.length > 0)
            yAxis = yAxisNames[0];

        plots.forEach(plot => {
            if (!plot.timestampAttribute && timestampAttribute)
                plot.timestampAttribute = timestampAttribute;
            if (!plot.xAttribute && xAttribute)
                plot.xAttribute = xAttribute;
            if (!plot.aggpath && aggpath)
                plot.aggpath = aggpath;
            if (!plot.endpoint && endpoint)
                plot.endpoint = endpoint;
            if (!plot.yAxis && yAxis)
                plot.yAxis = yAxis;
            if (!plot.selectors && selectors)
                plot.selectors = selectors;
            plot.series.forEach(series => {
                if (!series.name && series.attribute)
                    series.name = series.attribute;
                if (!series.yAxis && plot.yAxis)
                    series.yAxis = plot.yAxis;
                if (!yAxisNames.includes(series.yAxis)) {
                    let yAxis = { title: { text: series.yAxis }, opposite: true };
                    yAxes.push(yAxis);
                    yAxisNames.push(series.yAxis);
                }
            });

            if (plot.yAxis && !yAxisNames.includes(plot.yAxis)) {
                let yAxis = { title: { text: plot.yAxis }, opposite: true };
                yAxes.push(yAxis);
                yAxisNames.push(plot.yAxis);
            }
        });
        if (yAxes.length > 0)
            yAxes[0].opposite = false;  // axis 0 is the only axis on the left side of the plot
        options.yAxis = yAxes;

        return yAxisNames;
    }

    // initialize options needed to create a Highcharts chart object
    initChart() {
        const { highcharts: options = {} } = this.configuration;
        const _this = this;

        if (!options.chart)
            options.chart = {};
        options.chart.height = this.props.portletHeight;
        options.series = [];

        if (options.click) {
            this.click = options.click;
            if (!options.plotOptions)
                options.plotOptions = {};
            if (!options.plotOptions.series)
                options.plotOptions.series = {};
            if (!options.plotOptions.series.point)
                options.plotOptions.series.point = {};
            if (!options.plotOptions.series.point.events)
                options.plotOptions.series.point.events = {}
            options.plotOptions.series.point.events = {
                click: function () {
                    const url = _this.click.replace('$x', this.category);
                    return _this.props.changeURL(url);
                }
            };
            delete options.click;
        }

        this.yAxisNames = OmsChart.extendConfig( this.configuration );

        this.chart = new Highcharts.chart(this.id, options);
    }

    // initialization of info needed per endpoint to retrieve data. params.query may vary from query to query and are updated in loadData()
    initEndpointParameters() {
        const { group, plots = [] } = this.configuration;

        this.endpoints = [];
        plots.forEach(plot => {
            if (plot.endpoint && plot.xAttribute) {
                let endpoint = {}
                endpoint.name = plot.endpoint;
                endpoint.params = { group: group, page: 1, pagesize: 10000 };

                const xAttribute = plot.xAttribute;
                endpoint.params.sorting = [xAttribute];
                endpoint.xAttribute = xAttribute;
                let fields = [xAttribute];
                if (plot.series) {
                    endpoint.configSeries = plot.series;
                    plot.series.forEach(series => fields.push(series.attribute));
                }
                endpoint.params.fields = fields;

                if (plot.aggpath)
                    endpoint.params.aggpath = plot.aggpath;

                const portletSelectors = this.props.selectors.in || [];
                if (plot.selectors)
                    endpoint.params.selectors = createAdaptedSelectors(portletSelectors, plot.selectors);

                endpoint.yAxes = [];
                plot.series.forEach(series => {
                    if (series.yAxis)
                        endpoint.yAxes.push(series.yAxis)
                });

                this.endpoints.push(endpoint);
            }
        });


    }


    // returning promise to retrieve data asynchronously from server
    fetchDataPerEndpoint = (endpoint) => {
        return this.props.fetchData(endpoint.name, endpoint.params)
            .then(resp => {

                // Prepare new series
                const series = endpoint.configSeries ? endpoint.configSeries.map(s => ({ ...s, data: [] })) : [];

                // Fill series with data
                let units;
                let unitsSame = true;

                resp.data.data.forEach(data => {
                    const { attributes, meta } = data;
                    let x = this.convertXData(attributes[endpoint.xAttribute]);

                    series.forEach(serie => {
                        if (serie.type === 'histogram') {
                            serie.data.push(attributes[serie.attribute]);
                        } else {
                            serie.data.push([x, attributes[serie.attribute] || 0]);
                        }

                        // Check if all units are same
                        if (unitsSame && meta) {

                            // Check if row has metadata and units
                            const rowUnits = serie.attribute in meta.row ? meta.row[serie.attribute].units : null;
                            units = !units ? rowUnits : units;

                            // Compare previous units with all the rest
                            if (units && units !== rowUnits) {
                                unitsSame = false;
                                units = null;
                            }
                        }
                    });
                });

                // Add series to highchart
                series.forEach(serie => {
                    let yAxis = 0;
                    if (serie.yAxis) {
                        yAxis = this.yAxisNames.indexOf(serie.yAxis);
//                        this.chart.yAxis[yAxis].setTitle({
//                            useHTML: true,
//                            text: serie.yAxis + " " + katex.renderToString(units || "")
//                        }, false);
                    }
                    serie.yAxis = yAxis;
                    this.chart.addSeries(serie, false);
                })

            });
    }

    loadData = (zoom) => {
        this.props.showLoader();

        const { plotBands } = this.configuration;

        this.endpoints.forEach(endpoint => endpoint.params.query = zoom);

        // Remove all existing chart series
        while (this.chart.series.length > 0)
            this.chart.series[0].remove(false);

        // Remove all existing plotbands
        while (this.plotBands.length > 0)
            this.chart.xAxis[0].removePlotBand(this.plotBands.pop());

        // Iterate over endpoints and update each independently
        Promise.all(plotBands ?
            this.endpoints.map(endpoint => {
                return this.fetchDataPerEndpoint(endpoint);
            }).concat(this.fetchPlotBandsData(plotBands, {}))
            :
            this.endpoints.map(endpoint => this.fetchDataPerEndpoint(endpoint))
        ).then(resp => {
            // Redraw once all the series finished to update and hide loader
            this.chart.redraw();
            this.props.hideLoader();
        })
            .catch(error => this.props.onFailure(error));
    }


    componentDidMount() {
        histogram(Highcharts);
        this.initChart();
        this.initEndpointParameters();
        this.loadData();
    }

    componentWillUnmount() {
        if (this.chart)
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

export default sizeMe({ monitorWidth: true })(OmsChart);
