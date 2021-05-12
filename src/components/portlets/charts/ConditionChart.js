import React, { Component } from 'react';
import { cloneDeep } from 'lodash';
import { dateToUnix, toDateObject, unixToDatetimeURL } from '../../../utils/dateUtils'
import DateTimeChart from './DateTimeChart';


class ConditionChart extends Component {

    #datetime_to_unix;
    #datetime_from_unix;
    #dt;

    appendOutOfRangeValue = (data) => {
        if (data.length == 0)
            return;
        const appendum = cloneDeep( data[data.length - 1] );
        if ( appendum.attributes.first_change_date) {
            appendum.attributes.first_change_date = unixToDatetimeURL(this.#datetime_to_unix + 0.05 * this.#dt) + 'Z';
            data.push( appendum );
        }
    }

    // return false if we do not want to prepend one data point
    prependOutOfRangeValue = (data) => {
        if (data.length > 0) {
            // if first data point within first 10% of time range -> don't do anything            
            const first = data[0].attributes.first_change_date ? dateToUnix(data[0].attributes.first_change_date) : this.#datetime_from_unix;
            if ( (first - this.#datetime_from_unix) < 0.1 * this.#dt )
                return false;
        }
        return true;
    }

    fetchData = (endpoint, params = {}) => {
        if ( !endpoint.startsWith('conditions/') ) 
            return this.props.fetchData(endpoint,params);

        const query = params.query || this.props.query;

        this.#datetime_from_unix = dateToUnix(query.datetime_from);
        this.#datetime_to_unix = dateToUnix(query.datetime_to);
        this.#dt = this.#datetime_to_unix - this.#datetime_from_unix;

        const timestampAttribute = this.props.configuration.timestampAttribute;

        
        return this.props.fetchData(endpoint,params).then(response => {
            const { data, meta } = response.data;

            if ( !this.prependOutOfRangeValue(data) ) {
                this.appendOutOfRangeValue(data);
                return Promise.resolve({
                    data: {
                        meta: meta,
                        data: data
                    }
                });
            }

            // not giving  a start of the range makes the query extermely slow
            // hope to find a value within one week before start of data range
            // if not increase to one month, then to one year, then give up

            const prefixQueryParams = { page: 1, pagesize: 1 };
            prefixQueryParams.query = {};
            prefixQueryParams.sorting = [ '-change_date' ];
            prefixQueryParams.fields = params.fields.map(field => field.replace(timestampAttribute,'change_date'));
            if ( params.filters )
                prefixQueryParams.filters = { ...params.filter };
            else
                prefixQueryParams.filters = [];
            prefixQueryParams.filters.push({
                attribute: 'change_date',
                operator: 'GE',
                value: unixToDatetimeURL( this.#datetime_from_unix - 7 * 24 * 60 * 60 * 1000)
            });
            prefixQueryParams.filters.push({
                attribute: 'change_date',
                operator: 'LE',
                value: query.datetime_from
            });

            // this is a dirty hack: settting of x_min / x_max doesn't work correctly if there are only two faked datapoints 
            const datetime_from = data.length == 0 ? query.datetime_from : null;

            return this.props.fetchData(endpoint,prefixQueryParams).then(response2 => {
                if (response2.data.data.length > 0) {
                    response2.data.data[0].attributes[timestampAttribute] = datetime_from ? datetime_from : response2.data.data[0].attributes['change_date'];
                    const allData =  response2.data.data.concat(data);
                    this.appendOutOfRangeValue(allData, query.datetime_to);            
                    return Promise.resolve({ data: { meta: meta, data: allData } });
                }
                else {
                    prefixQueryParams.filters.find(filter => filter.operator === 'GE' ).value = unixToDatetimeURL( this.#datetime_from_unix - 30 * 24 * 60 * 60 * 1000);
                    return this.props.fetchData(endpoint,prefixQueryParams).then(response3 => {
                        if (response3.data.data.length > 0) {
                            response3.data.data[0].attributes[timestampAttribute] = datetime_from ? datetime_from : response3.data.data[0].attributes['change_date'];
                            const allData =  response3.data.data.concat(data);
                            this.appendOutOfRangeValue(allData, query.datetime_to);            
                            return Promise.resolve({ data: { meta: meta, data: allData } });
                        }
                        else {
                            prefixQueryParams.filters.find(filter => filter.operator === 'GE' ).value = unixToDatetimeURL( this.#datetime_from_unix - 360 * 24 * 60 * 60 * 1000);
                            return this.props.fetchData(endpoint,prefixQueryParams).then(response4 => {
                                var allData = data;
                                if (response4.data.data.length > 0) {
                                    response4.data.data[0].attributes[timestampAttribute] = datetime_from ? datetime_from : response4.data.data[0].attributes['change_date'];
                                    allData = response4.data.data.concat(data);
                                }
                                this.appendOutOfRangeValue(allData, query.datetime_to);            
                                return Promise.resolve({ data: { meta: meta, data: allData } });
                            });
                        }
                    });
                }
            });
        });
    }

    tuneSeriesSettings = (series) => {
        if (series.data.length > 2)
            return;
        
        // series contains only faked data
        if (!series.tooltip)
            series.tooltip = {};
        series.tooltip.headerFormat = 'whole query range<br>';
    };

    render() {
        this.props.configuration.setXminXmaxFromQuery = true;
        return (
            <DateTimeChart
                {...this.props}
                fetchData={this.fetchData}
                tuneSeriesSettings={this.tuneSeriesSettings}
            />
        );
    }
}

export default ConditionChart;