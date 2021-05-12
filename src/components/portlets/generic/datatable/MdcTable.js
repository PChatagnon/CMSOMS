import React, { Component } from 'react';
import Datatable from './table/Table';
import MdcWrapper from '../../../providers/MdcWrapper';
import { diffDates, diffToString } from '../../../../utils/dateUtils';
import { getRowColumnUnit } from './table/utils';
import moment from 'moment';
import cookie from 'react-cookies';

class MdcTable extends Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            filters: null,
            order: 'desc',
            orderBy: null,
            data: null,
            columns: [], // Filtered list of columns which are displayed in table
            tableColumns: null, // Full list of table columns
            columnsOrder: null, // Order of filtered columns for projection in API (without agg columns)
            columnsOrderCookieName: props.id + '_columns_order',
            searchableColumns: null,
            page: 1,
            pages: null,
            count: null,
            rowSize: 10,
            rowSizeList: [10, 25, 50, 100],
            rowSizeCookieName: props.id + '_row_size',
            aggregate: props.configuration.aggregate,
            aggData: null,
            showResetBtn: false,
            showFooter: false,
        };
    }

    componentDidMount() {
        // Add additional rowSize option from the configs
        const { configuration } = this.props;
        if ('pagesize' in configuration) {
            const { rowSizeList, rowSizeCookieName } = this.state;
            const { pagesize } = configuration;
            const rowSizeCookie = cookie.load(rowSizeCookieName);

            return this.setState({
                showResetBtn: rowSizeCookie ? true : false,
                rowSize: rowSizeCookie ? parseInt(rowSizeCookie, 10) : pagesize,
                rowSizeList: rowSizeList.includes(pagesize) ? rowSizeList :
                    rowSizeList.concat(pagesize).sort((a, b) => a - b),
            }, this.loadMeta);
        }
        this.loadMeta();
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (this.state.loading === true && nextState.loading === false) {
            return true;
        }
        return false;
    }

    componentDidUpdate(prevProps) {
        this.props.shouldRefresh(this.props, this.loadData);
        this.props.shouldUpdate(prevProps.query, this.props.query, () => {
            return this.setState({ loading: true, page: 1, count: null }, this.loadData);
        });
    }

    addColumnUnits = (data, meta) => {
        // Iterate over each row and check if row units are all the same for each column
        // If yes, set these units for the column.
        const { columns } = this.state;
        if (!columns) return null;

        return columns.map(column => {
            if (!column.show_units) return column;

            let units = null;
            for (const row of data) {

                // Check if column unit is specified in the row meta
                const columnUnit = getRowColumnUnit(row, column.name);

                // Make sure units dont change in response
                units = !units ? columnUnit : units;
                if (units && units !== columnUnit) {
                    units = null;
                    break;
                }
            }
            column.unit = units || meta.attributes[column.name].unit;
            column.rows_unit = units ? true : false;
            return column;
        });
    }

    applyAggregation = (aggType, data) => {
        const avg = (arr, tofixed = 2) => { const avg = arr.reduce((a, x) => a + x, 0) / arr.length; return (avg) ? avg.toFixed(tofixed) : null; }
        const sum = (arr, tofixed = 2) => { const sum = arr.reduce((a, x) => a + x, 0); return (sum) ? sum.toFixed(tofixed) : null; }
        const min = (arr, tofixed = 2) => arr.length > 0 ? Math.min(...arr).toFixed(tofixed) : null;
        const max = (arr, tofixed = 2) => arr.length > 0 ? Math.max(...arr).toFixed(tofixed) : null;

        switch (aggType) {
            case 'avg': return avg(data, 3);
            case 'sum': return sum(data, 3);
            case 'min': return min(data, 3);
            case 'max': return max(data, 3);
            default: return null;
        }
    }

    aggregateData = (data) => {
        const { columns, aggregate } = this.state;
        if (!aggregate || !columns) return null;

        let aggData = {};
        for (const column of columns) {
            if (!column.aggregate) continue;

            const columnType = column.props ? column.props.type : '';
            /*eslint no-fallthrough: "off"*/
            switch (columnType) {
                case 'datetime': break;
                case 'link': break;
                case 'ratio': break;
                case 'array': break;
                case 'duration':
                    const datetimeDiff = moment.duration(0);
                    const { starttimeName, endtimeName } = column.props;
                    data.forEach(row => {
                        const startTime = row.attributes[starttimeName];
                        const endTime = row.attributes[endtimeName];
                        if (startTime) {
                            const diff = diffDates(startTime, endTime);
                            datetimeDiff.add(diff);
                        }
                    });
                    aggData[column.name] = diffToString(datetimeDiff);
                    break;
                case 'float':
                default:
                    const aggValues = [];
                    data.forEach(row => aggValues.push(row.attributes[column.name]));
                    aggData[column.name] = this.applyAggregation(column.aggregate, aggValues);
            }
        }
        return aggData;
    }

    loadMeta = (query = this.props.query) => {
        const { endpoint, columns: configCols, showFooter } = this.props.configuration;
        const params = { page: 1, pagesize: 1, ...query, exclude: ['total_matches'] };
        MdcWrapper.fetch(endpoint, params)
            .then(response => {
                const { attributes } = response.data.meta;
                let columns = [];
                let tableColumns = [];
                let columnsOrder = [];

                // Convert all the columns from the API to the array of objects
                if (attributes) {
                    Object.keys(attributes).forEach(key => {
                        const column = attributes[key];
                        const confCol = configCols.find(c => c.name === key);

                        tableColumns.push({
                            name: key,
                            label: column.title,
                            type: column.data_type.toLowerCase(),
                            numeric: column.data_type === "INTEGER" || column.data_type === "FLOAT",
                            description: column.description || '',
                            units: column.unit,
                            scale: column.scale || null,
                            sortable: true,
                            ...confCol
                        });
                    });
                }

                // Iterate over portlet config columns and collect them to display in a table
                configCols
                    //.filter(c => c.name !== 'beta_star') // TODO: Remove this line once it will be fixed in Agg Api
                    .forEach(confCol => {
                        const column = tableColumns.find(c => c.name === confCol.name);
                        if (column) {
                            columnsOrder.push(confCol.name); // Push only those columns which are defined in the api
                            columns.push(column);
                        } else {
                            // To keep the full list of columns push also the agg columns (eg. Duration)
                            const aggColumn = { ...confCol, description: null, sortable: false, units: null };
                            tableColumns.push(aggColumn);
                            columns.push(aggColumn);
                        }
                    });

                // Keep the order from portlet configs in all table columns
                tableColumns = columns.concat(tableColumns.filter(c => !columns.includes(c)));

                // Load columnsOrder from cookies
                const cookieOrder = cookie.load(this.state.columnsOrderCookieName) || null;
                if (cookieOrder) {
                    const filteredColumns = cookieOrder.map(column => tableColumns.find(c => c.name === column));
                    columns = filteredColumns;
                    columnsOrder = filteredColumns.filter(c => c.sortable).map(c => c.name);
                }

                return this.setState({
                    tableColumns: tableColumns,
                    columns: columns,
                    columnsOrder: columnsOrder,
                    orderBy: columnsOrder.length ? columnsOrder[0] : null,
                    showResetBtn: cookieOrder ? true : this.state.showResetBtn,
                    showFooter: showFooter || false,
                }, this.loadData);
            })
            .catch(error => this.props.onFailure(error));
    }

    loadData = (query = this.props.query) => {
        this.props.showLoader();
        const { page, rowSize, order, orderBy, filters, columnsOrder, showFooter } = this.state;
        const { endpoint } = this.props.configuration;

        let params = {
            page: page,
            pagesize: rowSize,
            sorting: orderBy ? [(order === 'asc' ? '' : '-') + orderBy] : null,
            filters: filters,
            fields: columnsOrder && columnsOrder.length ? columnsOrder : null,
            ...query
        };
        if (!showFooter) {
            params.exclude = ['total_matches'];
        }

        MdcWrapper.fetch(endpoint, params)
            .then(response => {
                const { data, meta } = response.data;
                return {
                    meta: meta,
                    data: data,
                    aggData: this.aggregateData(data),
                    columns: this.addColumnUnits(data, meta)
                };
            })
            .then(response => {
                const { data, aggData, meta, columns } = response;
                const { total_matches } = meta;
                const totalCount = total_matches > 0 ? total_matches : 1;

                this.setState({
                    loading: false,
                    data: data,
                    aggData: aggData,
                    count: totalCount,
                    pages: Math.ceil(totalCount / rowSize),
                    columns: columns,
                    searchableColumns: columns.filter(c => c.type === 'string' || c.type === 'integer'),
                });

                if (!data.length) return this.props.onEmpty();
                return this.props.hideLoader();
            })
            .catch(error => this.props.onFailure(error));
    }

    onSort = (event, property) => {
        const { order, orderBy } = this.state;
        const newOrder = (orderBy === property && order === 'desc') ? 'asc' : 'desc';
        this.setState({ loading: true, page: 1, order: newOrder, orderBy: property }, this.loadData);
    }

    onRowSizeChange = (event, index, newSize) => {
        const pages = Math.ceil(this.state.count / newSize);
        cookie.save(this.state.rowSizeCookieName, newSize, { path: '/' });
        this.setState({ loading: true, page: 1, pages: pages, rowSize: newSize, showResetBtn: true }, this.loadData);
    }

    onPageChange = (page) => {
        const newPage = parseInt(page, 10);
        if (newPage && newPage <= this.state.pages) {
            this.setState({ loading: true, page: newPage }, this.loadData);
        }
    }

    onReset = () => {
        const { rowSizeCookieName, columnsOrderCookieName } = this.state;
        cookie.remove(rowSizeCookieName, { path: '/' });
        cookie.remove(columnsOrderCookieName, { path: '/' });

        return this.setState({
            showResetBtn: false,
            rowSize: this.props.configuration.pagesize,
            loading: true,
            filters: null,
            page: 1,
        }, this.loadMeta);
    }

    onSearch = (filters) => {
        this.setState({ loading: true, page: 1, filters: filters }, this.loadData);
    }

    onColumnFilter = (columns, addColumn) => {
        cookie.save(this.state.columnsOrderCookieName, columns.map(c => c.name), { path: '/' });
        return this.setState({
            loading: true,
            showResetBtn: true,
            columnsOrder: columns.filter(c => c.sortable).map(c => c.name),
            columns: columns
        },
            addColumn ? this.loadData : () => this.setState({ loading: false }));
    }

    render() {
        const {
            data, aggData, columns, tableColumns, order, orderBy, showFooter,
            page, pages, rowSize, rowSizeList, searchableColumns, showResetBtn
        } = this.state;

        if (!data) return <div />;

        const { portletHeight, vertical } = this.props;
        return (
            <Datatable
                vertical={vertical || false}
                height={portletHeight}
                data={data}
                aggData={aggData}
                columns={columns}
                tableColumns={tableColumns}
                searchableColumns={searchableColumns}
                onColumnFilter={this.onColumnFilter}
                order={order}
                orderBy={orderBy}
                onSort={this.onSort}
                showFooter={showFooter}
                page={page}
                pages={pages}
                onPageChange={this.onPageChange}
                rowSize={rowSize}
                rowSizeList={rowSizeList}
                onRowSizeChange={this.onRowSizeChange}
                onSearch={this.onSearch}
                onReset={this.onReset}
                showResetBtn={showResetBtn}
            />
        );
    }
}

export default MdcTable;