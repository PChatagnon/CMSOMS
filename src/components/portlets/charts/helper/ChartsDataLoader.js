import axios from 'axios';
import { dateToUnix } from '../../../../utils/dateUtils';

const CancelToken = axios.CancelToken;

class ChartsDataLoader {

    constructor(chart, portletProps, displayType) {
        this.chart = chart;
        this.portletProps = portletProps;
        this.displayType = displayType;
        this.seriesData = [];
        this._isMounted = false;
        this.cancelSource = CancelToken.source();
        this.cancelToken = this.cancelSource.token;
        this.params = { page: 1, pagesize: 10000 };
    }

    setMounted = (trueFalse) => {
        this._isMounted = trueFalse;
    }

    getSeriesData = (id) => {
        return this.seriesData.find(s => s.id === id);
    }

    cancelRequests = (msg, renew = true) => {
        // Cancel all the pending requests
        this.cancelSource.cancel(msg);
        if (!renew)
            return;
        // Create a new cancel source for the upcoming requests
        this.cancelSource = CancelToken.source();
        this.cancelToken = this.cancelSource.token;
    }

    swapXAxis = (displayType) => {
        this.displayType = displayType;

        // Update all the series to use different data for x axis
        this.chart.series.forEach(series => {
            const { id } = series.options;
            const data = this.getSeriesData(id);
            series.setData([...data[this.displayType]]);
        });

        // Change x axis title and type
        this.chart.xAxis[0].update({
            type: displayType === 'utc' ? 'datetime' : 'linear',
            title: {
                text: displayType === 'utc' ? 'Time [UTC]' : 'Lumisection',
            }
        });
    }


    _updateSingleDataSeries = (id, highchartsSeries, seriesData, query) => {
        //let latestLs = seriesData.ls.length > 0 ? seriesData.ls[seriesData.ls.length - 1][0] : 0;

        if (seriesData.lastLsIndex && seriesData.ls.length > 0) {
            //latestLs = seriesData.ls[seriesData.lastLsIndex - 1][0];
            seriesData.ls = seriesData.ls.slice(0, seriesData.lastLsIndex);
            seriesData.lastLsIndex = null;
        }

        const _this = this;

        return this.portletProps.fetchData(seriesData.plotProps.endpoint, this._getQueryParams(id, seriesData.plotProps, query))
            .then(resp => {
                if (!this._isMounted) return;
                resp.data.data.forEach(row => {
                    const value = row.attributes.rate;

                    if (value === null && seriesData.lastLsIndex === null) {
                        seriesData.lastLsIndex = seriesData.ls.length;
                    }

                    if (seriesData.plotProps.lumisectionAttribute)
                        seriesData.ls.push([row.attributes[seriesData.plotProps.lumisectionAttribute], value]);

                    if (seriesData.plotProps.timestampAttribute && row.attributes[seriesData.plotProps.timestampAttribute]) {
                        seriesData.utc.push([dateToUnix(row.attributes[seriesData.plotProps.timestampAttribute]), value]);
                    }
                });
                highchartsSeries.update({ data: _this.displayType === 'ls' ? [...seriesData.ls] : [...seriesData.utc] }, false);
            })
    }

    _getQueryParams = (id, plotProps, query = null) => {
        let fields = [plotProps.yAttribute];
        let filters = [];
        let sorting = null;

        if (plotProps.lumisectionAttribute) {
            fields.push(plotProps.lumisectionAttribute);
            filters.push({ attribute: plotProps.lumisectionAttribute, operator: 'GT', value: 0 });
            if (!sorting)
                sorting = [plotProps.lumisectionAttribute];
        }
        if (plotProps.timestampAttribute) {
            fields.push(plotProps.timestampAttribute);
            if (!sorting)
                sorting = [plotProps.timestampAttribute];
        }

        if (plotProps.filterAttributeFromTable)
            filters.push({
                attribute: plotProps.filterAttributeFromTable,
                operator: 'EQ',
                value: id
            });

        const params = {
            ...this.params,
            query: query ? {...query} : { ...this.portletProps.query },
            cancelToken: this.cancelToken,
            fields: fields,
            filters: filters,
            sorting: sorting,
            group: plotProps.granularity ? { key: 'granularity', value: plotProps.granularity } : undefined,
            aggpath: plotProps.aggpath ? plotProps.aggpath : undefined
        };
        return params;
    }


    updateChart = (appendData, query) => {
        if (!this._isMounted) return;
        if (this.chart.series.length === 0) 
            return Promise.resolve('empty');
        this.portletProps.showLoader();

        // Iterate over series and update each independently
        return Promise.all(
            this.chart.series.map(series => {
                const { id } = series.options;
                const seriesData = this.getSeriesData(id);

                if (!appendData) {
//                    seriesData.forEach( data => [] );
                    seriesData.ls = [];
                    seriesData.utc = [];
                }

                let updateFunction = this._updateSingleDataSeries;
                return updateFunction(id, series, seriesData, query);
            })
        ).then(resp => {
            // Do not redraw if request is canceled - new one is coming instead
            if (axios.isCancel(resp[0])) return;

            // Redraw once all the series finishes to update and hide loader
            this.chart.redraw();
            this.portletProps.hideLoader();
        })
    }

    processMasterDetailsUpdate = (mdData, deselected) => {
        const plotProps = mdData.selector && this.portletProps.configuration && this.portletProps.configuration.plots && mdData.selector in this.portletProps.configuration.plots ? this.portletProps.configuration.plots[mdData.selector] : null;
        if (plotProps) {
            const label = mdData.row.attributes[plotProps.filterAttributeFromTable];
            const visible = deselected.includes(label) ? false : true;
            let series = this.chart.get(label);

            // Row selection
            if (mdData.selected && !series) {
                const type = mdData.selector;
                this.portletProps.showLoader();
                return this._addSeries(label, type, visible, plotProps)
                    .then(() => {
                        if (this.chart.series) 
                            this.chart.redraw();
                        this.portletProps.hideLoader();
                    });
            }

            // Row deselection
            if (!mdData.selected) {
                if (series) 
                    series.remove();
                else 
                    this.cancelRequests('TriggerChartMD: Pending request was canceled by deselecting MD row.');
                if (this.chart.series.length === 0) {
                    this.portletProps.onEmpty();
                    return Promise.resolve('empty');
                }
            }
            return Promise.resolve('done');
        }
    }
}

export default ChartsDataLoader;