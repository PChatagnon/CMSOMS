import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Highcharts from 'highcharts/highmaps';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsOfflineExporting from 'highcharts/modules/offline-exporting';
import { generateId, setHighchartsLibURL } from '../../../utils/utils';
import { createAdaptedSelectors } from '../PortletUtils';
import sizeMe from 'react-sizeme';
import { masterDetails } from '../../../actions/appActions';
import axios from 'axios';


function mapStateToProps(state) {
    return { md: state.md };
}

function mapDispatchToProps(dispatch) {
    return {
        ...bindActionCreators({ masterDetails }, dispatch), dispatch
    };
}

HighchartsExporting(Highcharts);
HighchartsOfflineExporting(Highcharts);
setHighchartsLibURL(Highcharts);


class DataProcessor {

    getParams = () => {
        return {};
    }

    buildHighchartsSeries = (data, segmentList = []) => {
        return [];
    }
}


class CountingDataProccesor extends DataProcessor {

    constructor(configuration) {
        super(configuration);
        this.valid = false;
        if (!configuration.count)
            return;
        this.identifyingAttribute = configuration.count;
    }

    getParams = () => {
        const params = {
            page: 1,
            pagesize: 10000,
            fields: [this.identifyingAttribute]
        }
        return params;
    }

    buildHighchartsSeries = (data, segmentList) => {
        let counter = {};
        segmentList.forEach( segment => {
            counter[segment] = 0;
        });
        data.forEach(row => {
            if (row.attributes[this.identifyingAttribute]) {
                if ((row.attributes[this.identifyingAttribute] in counter))
                    counter[row.attributes[this.identifyingAttribute]] += 1;
            }
        });
        let dataArray = Object.keys(counter).map( key => {
            return {name: key, value: counter[key] };
         });
        
        return dataArray;
    }

}


class CSCDataProcessor extends DataProcessor {

    constructor(configuration) {
        super(configuration);
        const { status_data = { 1: {name: '', color: 'gray'}} } = configuration;
        this.status_data = status_data;
    }


    buildHighchartsSeries = (data) => {
        let series = [];
        let rows = [];
        data.forEach(row => {
            const { status, chambers } = row.attributes;
            rows.push(row.id);
            series.push({
                id: row.id,
                type: 'map',
                data: chambers.map(c => [c]),
                keys: ['id'],
                joinBy: 'id',
                name: this.status_data[status].name,
                color: this.status_data[status].color,
                negativeColor: undefined,
                legendIndex: status,
                dataLabels: {
                    pointFormat: '{point.id}',
                    enabled: false
                }
            });

            // Include empty series to fill the legend
            Object.keys(this.status_data).forEach(key => {
                if (!rows.includes(key)) {
                    series.push({
                        type: 'map',
                        name: this.status_data[key].name,
                        color: this.status_data[key].color,
                        legendIndex: key
                    });
                }
            });
        });
        return series;
    }
}



class GeojsonChart extends Component {

    constructor(props) {
        super(props);
        this.chart = null;
        this.dataProcessor = null;
        if ( props.configuration.count )
            this.dataProcessor = new CountingDataProccesor(props.configuration);
        else
            this.dataProcessor = new CSCDataProcessor(props.configuration);

        this.id = generateId('geojsonChart');
    }

    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, this.loadData);
        this.props.shouldRefresh(this.props, this.loadData);
        this.shouldResize();
    }

    initStaticData = () => {
        const data = this.geojson.features.map(f => [f.properties.id]);
        const series = {
            type: 'map',
            data: data,
            keys: ['id'],
            joinBy: 'id',
            color: 'gray'
        };
        this.chart.addSeries(series, false);
        this.chart.redraw();
    }

    addMapPoints = () => {
        // Add series which shows disk names for example
        this.chart.addSeries({
            showInLegend: false,
            type: 'mappoint',
            data: Highcharts.geojson(this.geojson, 'mappoint'),
                color: 'black',
                marker: {
                    enabled: false,
                    states: {
                        hover: {
                            enabled: false
                        }
                    }
                },
                dataLabels: {
                    align: 'center',
                    verticalAlign: 'bottom'
                },
                enableMouseTracking: false
        }, false);
    }

    loadData = () => {
        const { endpoint } = this.props.configuration;
        if (!endpoint )
            return;

        this.props.showLoader();

        const params = this.dataProcessor.getParams();
        if (this.props.configuration.selectors) {
            const portletSelectors = this.props.selectors.in || [];
            params.selectors = createAdaptedSelectors(portletSelectors, this.props.configuration.selectors);
        }

        this.props.fetchData(endpoint, params)
            .then(resp => {

                // Remove all chart series without redrawing
                while (this.chart.series.length > 0)
                    this.chart.series[0].remove(false);

                // Handle empty data response
                if (!resp.data.data.length) {
                    return this.props.onEmpty();
                }

                let series = [];
                if (this.dataProcessor) {
                    series = this.dataProcessor.buildHighchartsSeries(resp.data.data, this.segmentList);
                    this.chart.addSeries({data: series, joinBy: 'name'}, false);
                }

                // Add additional labels
                this.addMapPoints();

                this.chart.redraw();
                return this.props.hideLoader();
            })
            .catch(error => this.props.onFailure(error));
    }

    componentDidMount() {
        const _this = this;
        const options = {
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                height: this.props.portletHeight
            },
            credits: {
                enabled: false
            },
            title: {
                text: null
            },
            xAxis: {
                visible: false
            },
            yAxis: {
                visible: false
            },
            plotOptions: {
                map: {
                    allAreas: false,
                    events: {
                        legendItemClick: function () {
                            return false;
                        }
                    }
                },
                series: {
                    tooltip: {
                        headerFormat: undefined,
                        pointFormat: '{point.properties.name}' + (this.props.configuration.tooltip ? this.props.configuration.tooltip : '')
                    },
                    cursor: 'pointer',
                    point: {
                        events: {
                            click: function () {
                                if ( !_this.props.configuration || !_this.props.configuration.linkPattern) {
                                    const { dispatch, groupId } = _this.props;
                                    if ( _this.props.configuration.filterMD )
                                        dispatch(masterDetails({
                                            groupId: groupId,
                                            body: {
                                                value: this[_this.props.configuration.filterMD.valueField],
                                                attribute: _this.props.configuration.filterMD.attribute
                                        }
                                    }));
                                }
                                else {
                                    const link = _this.props.configuration.linkPattern.replace( '{}', this.id);
                                    _this.props.changeURL( link );
                                }
                            }
                        }
                    }
                },
                allowPointSelect: false
            },
            legend: {
                enabled: true
            },
            tooltip: {},
            series: []
        };

        if ( this.props.configuration.colorAxis) 
            options.colorAxis = { dataClasses: this.props.configuration.colorAxis };

        if (this.props.configuration && this.props.configuration.geojsonUrl) {
            axios.get(this.props.configuration.geojsonUrl)
            .then(resp => {
                this.geojson = resp.data;
                options.chart.map = this.geojson;
                this.segmentList = this.geojson.features.map(f => f.properties.name);
                if (!this.props.configuration.endpoint)
                    options.legend.enabled = false;
                if (this.props.configuration.segmentLabel)
                    options.plotOptions.map.dataLabels = {enabled: true, format: '{point.properties.name}'};
                this.chart = new Highcharts.mapChart(this.id, options);
                if(this.props.configuration.endpoint)
                    this.loadData();
                else
                    this.initStaticData();
            });
        }
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
        return (
            <div id={this.id} />
        );
    }
}

export default sizeMe({ monitorWidth: true })(
    connect(mapStateToProps, mapDispatchToProps)(GeojsonChart)
);
