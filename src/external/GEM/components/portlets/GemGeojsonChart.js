import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Highcharts from 'highcharts/highmaps';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsOfflineExporting from 'highcharts/modules/offline-exporting';
import { generateId, setHighchartsLibURL } from '../../../../utils/utils';
import sizeMe from 'react-sizeme';
import { masterDetails } from '../../../../actions/appActions';
import { geojson } from '../../geojson/gem';

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
    1: { name: 'unknown', color: 'yellow' }
};

class GemGeojsonChart extends Component {

    constructor(props) {
        super(props);
        const { status_data = STATUS_DATA } = props.configuration;
        this.status_data = status_data;
        this.chart = null;
        this.id = generateId('gemGeojsonChart');
    }

    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, this.loadData);
        this.props.shouldRefresh(this.props, this.loadData);
        this.shouldResize();
    }

    loadData = () => {
        this.props.showLoader();

        this.chart.addSeries({
            id: 'on',
            type: 'map',
            data: geojson.features.map(f => [f.properties.id]),
            keys: ['id'],
            joinBy: 'id',
            name: 'on',
            color: '#9e9e9e',
            negativeColor: undefined
        }, false);

        this.chart.redraw();
        return this.props.hideLoader();
    }

    componentDidMount() {
        const options = {
            chart: {
                map: geojson,
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
                },
                allowPointSelect: false
            },
            legend: {
                enabled: false
            },
            tooltip: {},
            series: []
        };

        this.chart = new Highcharts.chart(this.id, options);
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
        return (
            <div id={this.id} />
        );
    }
}

export default sizeMe({ monitorWidth: true })(
    connect(mapStateToProps, mapDispatchToProps)(GemGeojsonChart)
);
