import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Highcharts from 'highcharts/highmaps';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsOfflineExporting from 'highcharts/modules/offline-exporting';
import { generateId, setHighchartsLibURL } from '../../../utils/utils';
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

const STATUS_DATA = {
    1: { name: 'Hot', color: '#f44336' },
    2: { name: 'ON', color: '#8bc34a' },
    3: { name: 'PARTIALLY ON', color: '#ffeb3b' },
    4: { name: 'RAMPING', color: '#ff9800' },
    5: { name: 'STANDBY', color: '#9c27b0' },
    6: { name: 'PARTIALLY STANDBY', color: '#9e9e9e' },
    7: { name: 'OFF', color: '#3f51b5' },
};

class GeojsonChartTester extends Component {

    constructor(props) {
        super(props);
        const { status_data = STATUS_DATA } = props.configuration;
        this.status_data = status_data;
        this.chart = null;
        this.id = generateId('geojsonChart');
    }

    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, this.loadData);
        this.props.shouldRefresh(this.props, this.loadData);
        this.shouldResize();
    }

    loadData = () => {
        const { endpoint, segmentLabel = false } = this.props.configuration; // subsystems/csc/highvoltagestatus
        if (!endpoint) {
            const series = {
                id: 'on',
                type: 'map',
                data: this.geojson.features.map(f => [f.properties.id]),
                keys: ['id'],
                joinBy: 'id',
                name: 'on',
                color: '#9e9e9e',
                negativeColor: undefined
            };
            if (segmentLabel)
                series.dataLabels = {
                    enabled: true,
                    pointFormat: '{point.id}'
                };
            this.chart.addSeries(series, false);
            this.chart.redraw();
            return;
        }

        this.props.showLoader();
        this.props.fetchData(endpoint)
            .then(resp => {

                // Remove all chart series without redrawing
                while (this.chart.series.length > 0)
                    this.chart.series[0].remove(false);

                // Handle empty data response
                if (!resp.data.data.length) {
                    return this.props.onEmpty();
                }

                let rows = [];
                resp.data.data.forEach(row => {
                    const { status, chambers } = row.attributes;
                    rows.push(row.id);
                    this.chart.addSeries({
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
                            enabled: segmentLabel
                        }

                    }, false);
                });

                // Include empty series to fill the legend
                Object.keys(this.status_data).forEach(key => {
                    if (!rows.includes(key)) {
                        this.chart.addSeries({
                            type: 'map',
                            name: this.status_data[key].name,
                            color: this.status_data[key].color,
                            legendIndex: key
                        }, false);
                    }
                });

                // Add series which shows numbers of disks
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
                        pointFormat: '{point.id}'
                    },
                    cursor: 'pointer',
                    point: {
                        events: {
                            click: function () {
                                const { dispatch, groupId, selectors } = _this.props;
                                dispatch(masterDetails({
                                    groupId: groupId,
                                    body: {
                                        chamber: this.id,
                                        selector: selectors.out.length ?
                                            selectors.out[0].attributes.name : null
                                    }
                                }));
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

        if (this.props.configuration && this.props.configuration.geojsonUrl) {
            axios.get(this.props.configuration.geojsonUrl)
            .then(resp => {
                this.geojson = resp.data;
                options.chart.map = this.geojson;
                this.chart = new Highcharts.chart(this.id, options);
                this.loadData();
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
    connect(mapStateToProps, mapDispatchToProps)(GeojsonChartTester)
);
