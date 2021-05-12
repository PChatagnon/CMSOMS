/**
 *    DateTimeChart
 * 
 *    generic Highccharts chart to plot value-vs-time data.
 *    
 *    MANDATORY SELECTORS: datetime_from, datetime_to !!!!
 * 
 * 
 */



import React, { Component } from 'react';
import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsOfflineExporting from 'highcharts/modules/offline-exporting';
import { generateId, setHighchartsLibURL } from '../../../utils/utils';
import { dateToUnix, unixToDatetimeURL } from '../../../utils/dateUtils';
import sizeMe from 'react-sizeme';
import katex from 'katex';
import { cloneDeep } from 'lodash';
import { createAdaptedSelectors } from '../PortletUtils';
import { OmsChart } from '../generic/charts/OmsChart';
//import { ThemeProvider } from 'styled-components';

HighchartsExporting(Highcharts);
HighchartsOfflineExporting(Highcharts);
setHighchartsLibURL(Highcharts);

class DateTimeChart extends Component {

    static reloadDataOnZoom = 'reloadDataOnZoom';

    constructor(props) {
        super(props);
        this.id = generateId('dateTimeChart');
        this.chart = null;
        this.endpoints = [];    // array of objects storing all the info needed to retrieve data from an endpoint
        // each entry is an extended copy of entries in props.configuration.plots array
        this.yAxes = [];        // string array to identify y axis in use
        this.plotBands = [];
        this.configuration = cloneDeep(this.props.configuration);
    }

    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, this.loadData);
        this.props.shouldRefresh(this.props, this.loadData);
        this.shouldResize();
    }

    // initialize options needed to create a Highcharts chart object
    initChart() {
        const { zoom } = this.configuration;

        const optional = {
            credits: {
                enabled: false
            },
            title: {
                text: null
            },
            yAxis: {
                title: {
                    text: ''
                }
            },
            tooltip: {
                shared: false
            }
        };

        const mandatory = {
            chart: {
                // inverted: true,
                zoomType: 'x',
                height: this.props.portletHeight,
                spacingBottom: 5
            },
            xAxis: {
                type: 'datetime',
                title: {
                    text: 'Time'
                }
            },
            series: []
        };
        if (zoom && zoom === 'reloadDataOnZoom')
            mandatory.xAxis.events = { afterSetExtremes: this.afterSetExtremes };


        this.configuration.highcharts = { ...optional, ...this.configuration.highcharts, ...mandatory };

        this.yAxisNames = OmsChart.extendConfig( this.configuration );

        this.chart = new Highcharts.chart(this.id, this.configuration.highcharts);
    }

    // initialization of info needed per endpoint to retrieve data. params.query may vary from query to query and are updated in loadData()
    initEndpointParameters() {
        const { group, plots = [] } = this.configuration;

        this.endpoints = [];
        plots.forEach(plot => {
            if (plot.endpoint && plot.timestampAttribute) {
                let endpoint = {}
                endpoint.name = plot.endpoint;
                endpoint.params = { group: group, page: 1, pagesize: 10000 };

                const timestampAttribute = plot.timestampAttribute;
                endpoint.params.sorting = [timestampAttribute];
                endpoint.timestampAttribute = timestampAttribute;
                let fields = [timestampAttribute];
                if (plot.series) {
                    endpoint.configSeries = plot.series;
                    plot.series.forEach(series => fields.push(series.attribute));
                }
                endpoint.params.fields = fields;

                if (plot.aggpath)
                    endpoint.params.aggpath = plot.aggpath;

                if (plot.filters) {
                    if (!endpoint.params.filters)
                        endpoint.params.filters = [];
                    plot.filters.forEach(filter => {
                        if (filter.attribute && filter.value)
                            endpoint.params.filters.push({
                                attribute: filter.attribute,
                                operator: 'EQ',
                                value: filter.value
                            });
                    });
                }

                const portletSelectors = this.props.selectors.in || [];
                if (plot.selectors)
                    endpoint.params.selectors = createAdaptedSelectors(portletSelectors, plot.selectors);

                if (plot.yAxis) {
                    endpoint.yAxis = plot.yAxis;
                }

                this.endpoints.push(endpoint);
            }
        });


    }



    // returning promise to get data for plotbands 
    fetchPlotBandsData = (fillsOrRuns, params) => {
        if (fillsOrRuns === 'fills') {
            params.fields = ['fill_number', 'start_stable_beam', 'end_stable_beam'];
            params.selectors = createAdaptedSelectors(this.props.selectors.in || [], { datetime_from: 'start_stable_beam', datetime_to: 'start_stable_beam' });
        } else if (fillsOrRuns === 'runs') {
            params.fields = ['run_number', 'start_time', 'end_time'];
            params.selectors = createAdaptedSelectors(this.props.selectors.in || [], { datetime_from: 'start_time', datetime_to: 'start_time' });
        }

        return this.props.fetchData(fillsOrRuns, params)
            .then(resp => {
                resp.data.data.forEach(fillOrRun => {
                    let start, stop, id;
                    if (fillsOrRuns === 'runs')
                        ({ start_time: start, end_time: stop, run_number: id } = fillOrRun.attributes);
                    else
                        ({ start_stable_beam: start, end_stable_beam: stop, fill_number: id } = fillOrRun.attributes);
                    this.chart.xAxis[0].addPlotBand({
                        color: '#FCFFC5',
                        from: dateToUnix(start),
                        to: dateToUnix(stop),
                        id: id,
                        label: {
                            text: id
                        }
                    })
                    this.plotBands.push(id);
                })
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

                resp.data.data.forEach(data_point => {
                    const { attributes, meta } = data_point;
                    let timestamp = dateToUnix(attributes[endpoint.timestampAttribute]);

                    series.forEach(serie => {
                        serie.data.push([timestamp, attributes[serie.attribute] || 0]);

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

                // Handle the y axis
                let yAxis = 0;
                if (endpoint.yAxis) {
                    yAxis = this.yAxisNames.indexOf(endpoint.yAxis);
                    this.chart.yAxis[yAxis].setTitle({
                        useHTML: true,
                        text: endpoint.yAxis + " " + katex.renderToString(units || "")
                    }, false);
                }


                // Add series to highchart
                series.forEach(serie => {
                    serie.yAxis = yAxis;
                    if (this.props.tuneSeriesSettings)
                        this.props.tuneSeriesSettings(serie);
                    this.chart.addSeries(serie, false);
                })

            });
    }

    loadData = (query, zoom = false) => {
        this.props.showLoader();

        const { plotBands } = this.configuration;

        this.endpoints.forEach(endpoint => endpoint.params.query = query);

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
            }).concat(this.fetchPlotBandsData(plotBands, {aggpath: '/agg'}))
            :
            this.endpoints.map(endpoint => this.fetchDataPerEndpoint(endpoint))
        ).then(resp => {
//            if (this.props.configuration.setXminXmaxFromQuery && !zoom) {
//                const { query } = this.props;
//                const xAxis = this.chart.xAxis[0];
//                xAxis.setExtremes( dateToUnix(query.datetime_from), dateToUnix(query.datetime_to) );
//            }
            // Redraw once all the series finished to update and hide loader
            const xAxis = this.chart.xAxis[0];
            if (this.props.configuration.setXminXmaxFromQuery && !zoom) {
                const { query } = this.props;
                const min = dateToUnix(query.datetime_from) - 60000;
                xAxis.setExtremes( min, dateToUnix(query.datetime_to) );
            }
            const chart = this.chart;
            chart.redraw();
            this.props.hideLoader();
        })
            .catch(error => this.props.onFailure(error));
    }

    afterSetExtremes = (e) => {
        // Zoom change

        const { trigger } = e;

        if (!trigger)
            // No trigger means not a zoom action
            return

        if (e.userMin) { // zoom in
            this.loadData({
                datetime_from: unixToDatetimeURL(e.userMin) + 'Z',
                datetime_to: unixToDatetimeURL(e.userMax) + 'Z'
            }, true )
        }
        else { // reset zoom, restore original ranges
            this.loadData();
        }
    }

    componentDidMount() {
        this.initChart();
        this.initEndpointParameters();
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

export default sizeMe({ monitorWidth: true })(DateTimeChart);
