
import { dateToUnix } from '../../../../utils/dateUtils';
import ChartsDataLoader from './ChartsDataLoader';

class TriggerDataLoader extends ChartsDataLoader
 {

    _addSeries = (label, type, visible, plotProps) => {
        
        const id = label;
        let series = { id: id, name: label, data: null, visible: visible };
        let lsData = [];
        let utcData = [];
        let lastLsIndex = null;

        return this.portletProps.fetchData(plotProps.endpoint, this._getQueryParams(id, plotProps))
            .then(resp => {
                if (!this._isMounted) return;
                resp.data.data.forEach(row => {
                    const value = row.attributes[plotProps.yAttribute];

                    if (value === null && lastLsIndex === null) {
                        lastLsIndex = lsData.length;
                    }

                    if (plotProps.lumisectionAttribute)
                        lsData.push([row.attributes[plotProps.lumisectionAttribute], value]);
                    if (plotProps.timestampAttribute) {
                        utcData.push([dateToUnix(row.attributes[plotProps.timestampAttribute]), value]);
                    }
                });
                series.data = this.displayType === 'ls' ? [...lsData] : [...utcData];
                this.seriesData.push({ id: id, 'ls': lsData, 'utc': utcData, type: type, lastLsIndex: lastLsIndex, plotProps: plotProps });
                this.chart.addSeries(series, false);
            });
    }



    updateHLTRatesSeries = (id, series, seriesData, query) => {
        let latestLumi = seriesData.lumi.length > 0 ? seriesData.lumi[seriesData.lumi.length - 1][0] : 0;

        if (seriesData.lastLumiIndex && seriesData.lumi.length > 0) {
            latestLumi = seriesData.lumi[seriesData.lastLumiIndex - 1][0];
            seriesData.lumi = seriesData.lumi.slice(0, seriesData.lastLumiIndex);
            seriesData.lastLumiIndex = null;
        }

        const params = {
            ...this.params,
            query: { ...query },
            cancelToken: this.cancelToken,
            fields: ['rate', 'last_lumisection_number', 'start_time'],
            filters: [{
                attribute: 'last_lumisection_number',
                operator: 'GT',
                value: latestLumi
            }, {
                attribute: 'path_name',
                operator: 'EQ',
                value: id
            }]
        };

        return this.props.fetchData('hltpathratesperlumisection', params)
            .then(resp => {
                if (!this._isMounted) return;
                resp.data.data.forEach(row => {
                    const value = row.attributes.rate;

                    if (value === null && seriesData.lastLumiIndex === null) {
                        seriesData.lastLumiIndex = seriesData.lumi.length;
                    }

                    seriesData.lumi.push([row.attributes.last_lumisection_number, value]);
                    if (row.attributes.start_time) {
                        seriesData.utc.push([dateToUnix(row.attributes.start_time), value]);
                    }
                });
                series.update({ data: this.displayType === 'lumi' ? [...seriesData.lumi] : [...seriesData.utc] }, false);
            })
            .catch(error => this.handleError(error));
    }
}

export default TriggerDataLoader;