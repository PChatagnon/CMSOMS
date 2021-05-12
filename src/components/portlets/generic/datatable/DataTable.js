import React, { Component } from 'react';
import Datatable from './table/Table';
import cookie from 'react-cookies';
import fileDownload from 'js-file-download';
import { aggregateData, addColumnUnits, transformData } from './table/utils';
import AggProvider from '../../../providers/AggProvider';
import { createAdaptedSelectors } from '../../PortletUtils';
import { isEqual, difference } from 'lodash';

const MAX_SELECTIONS = 20;
const ROW_SIZE_LIST = [20, 50, 100, 1000];
const PAGE_SIZE = 20;


class DataTable extends Component {

    params = { page: 1, pagesize: 1, include: ['meta'] };

    constructor(props) {
        super(props);
        const {
            order: orderConfig, aggregate, selectable, selected, endpoint,
            rowIdColumn, hideProjection, vertical, pagesize, sortingToURL,
            exportCSV, rowsList = ROW_SIZE_LIST
        } = props.configuration;
        const { urlParams, fullscreen } = props;

        const selectedRows = urlParams && urlParams.selected && urlParams.selected.length ? urlParams.selected : selected;
        const selectableRows = fullscreen ? false : selectable;
        const headerChecked = urlParams && urlParams.headerChecked && urlParams.headerChecked === 'true' ? true : false;

        const order = orderConfig ? orderConfig[1] : 'desc';
        const orderBy = orderConfig ? orderConfig[0] : false;

        this.endpoint = endpoint;
        this.rowIdColumn = rowIdColumn;
        this.vertical = props.vertical || vertical || false;
        this.sortingToURL = sortingToURL || false;
        this.rowsList = rowsList;

        if (props.configuration.selectors) {
            const portletSelectors = props.selectors.in || [];
            this.params.selectors = createAdaptedSelectors(portletSelectors, props.configuration.selectors);
        }

        this.state = {
            loading: true,
            filters: headerChecked ? this.getFilterSelectedRows(rowIdColumn, selectedRows): null,
            orderBy: urlParams && 'orderBy' in urlParams ? urlParams.orderBy : orderBy,
            order: urlParams && 'order' in urlParams ? urlParams.order : order,
            orderCookieName: props.id + '_sorting',
            data: null,
            columns: [], // Filtered list of columns which are displayed in table
            tableColumns: [], // Full list of table columns
            columnsOrder: null, // Order of filtered columns for projection in API (without agg columns)
            columnsOrderCookieName: props.id + '_columns_order',
            searchableColumns: null,
            projectableColumns: null,
            page: 1,
            pages: null,
            count: null,
            rowSize: pagesize || PAGE_SIZE,
            rowSizeList: this.rowsList.includes(pagesize)
                ? this.rowsList
                : rowsList.concat(pagesize).sort((a, b) => a - b),
            rowSizeCookieName: props.id + '_row_size',
            aggregate: aggregate || false,
            aggData: null,
            showResetBtn: false,
            showFooter: false,
            exportCSV: exportCSV || false,
            hideProjection: hideProjection || false,
            hideFiltering: false,
            selectable: selectableRows || false,
            selected: selectedRows || [], // Selected rows data
            headerChecked: headerChecked
        };
    }

    componentDidMount() {
        const { rowSize, rowSizeCookieName, order, orderBy, orderCookieName } = this.state;
        const rowSizeCookie = cookie.load(rowSizeCookieName);
        const orderCookie = cookie.load(orderCookieName);
        const newRowSize = rowSizeCookie ? parseInt(rowSizeCookie, 10) : rowSize;

        return this.setState({
            showResetBtn: rowSizeCookie || orderCookie ? true : false,
            rowSize: newRowSize,
            order: orderCookie ? orderCookie.order : order,
            orderBy: orderCookie ? orderCookie.orderBy : orderBy
        }, this.loadMeta);
    }

    componentDidUpdate(prevProps) {

        const _this = this;

        async function doRefreshAndUpdate(requireLoad) {
            let loadExecuted = false;

            await new Promise( resolve => {
                _this.props.shouldRefresh(_this.props,
                    () => { _this.loadData(); loadExecuted = true; resolve() },
                    () => { resolve() }
                )
            });

            await new Promise( resolve => {
                _this.props.shouldUpdate(prevProps.query, _this.props.query, () => {
                    return _this.setState({
                        loading: true,
                        page: 1, count: null,
                        selected: (_this.props.query && _this.props.query.update === false) ? [] : _this.state.selected,
                    }, () => { loadExecuted = true ; resolve() ; _this.loadData() }, () => { resolve() } );
                });
            });

            //load data if not performed previously
            if (!loadExecuted && requireLoad) _this.loadData();
        }

        const isExtUpdate = prevProps.extUpdate!==this.props.extUpdate
        function getUrlParam(props,name,defaultVal) {
            return  (props.urlParams!==null && props.urlParams[name]!=null) ? props.urlParams[name] : defaultVal
        }
        let prevSelected = getUrlParam(prevProps,'selected',[]);
        let postSelected = getUrlParam(this.props,'selected',[]);
        let prevHeaderChecked = getUrlParam(prevProps,'headerChecked',false)==='true';
        let postHeaderChecked = getUrlParam(this.props,'headerChecked',false)==='true';

        //if ext update, remove everything added by click (including preselected parameters)
        if (isExtUpdate) {
            //prevSelected = Array.from(new Set(prevSelected.concat(_this.state.selected)));
            prevSelected = this.state.selected; 
            prevHeaderChecked = this.state.headerChecked;
        }
        const headerCheckedUpdated = (prevHeaderChecked!==postHeaderChecked);

        if (!isEqual(prevSelected,postSelected) || headerCheckedUpdated) {

            let newState = {
                selected: postSelected,
                headerChecked: postHeaderChecked
            }
            if (headerCheckedUpdated) {
                newState.loading = true
                newState.filters =  postHeaderChecked ? this.getFilterSelectedRows(this.rowIdColumn, postSelected) : null;
                newState.page = 1;
            }

            this.setState(newState, () => {

                //successive dispatch can just update props for the last one (this is behavior of redux).
                //Workaround for receiver to see all updates is to put small timeouts.
                //MD Protocol should be improved to provide information in one round, if possible by all tables in a page
                //page init does not seem to suffer, but at risk of breaking in the future
                //reference: https://stackoverflow.com/questions/40328932/javascript-es6-promise-for-loop/40329190
                const data = _this.state.data;

                const timeout = 1;
                (async function notifyMD() {

                    if (prevSelected.length) {
                        let toRemove = difference(prevSelected,postSelected);
                        for (let i = 0; i < toRemove.length; i++) {
                            const id = toRemove[i];
                            await new Promise(resolve => setTimeout(() => {
                                if (data===null) { resolve();return;}
                                const row = data.find(row => row.id.toString() === id.toString());
                                if (row)  _this.props.onRowSelect({ row: row, selected: false });
                                resolve();
                            }, timeout));
                        }
                    }
                    if (postSelected.length) {
                        let toAdd = difference(postSelected,prevSelected);
                        for (let i = 0; i < toAdd.length; i++) {
                            const id = toAdd[i];
                            await new Promise(resolve => setTimeout(() => {
                                if (data===null) { resolve();return;}
                                const row = data.find(row => row.id.toString() === id.toString());
                                if (row)  _this.props.onRowSelect({ row: row, selected: true });
                                resolve();
                           }, timeout));
                        }
                    }

                    //wait after all other selection changes
                    await new Promise(resolve => setTimeout(resolve,timeout));

                    doRefreshAndUpdate(headerCheckedUpdated);

                })();
            })
        }
        else {
            doRefreshAndUpdate();
        }
        if (this.props.shouldUpdateByMD && this.props.shouldUpdateByMD(prevProps))
            this.loadData();
    }



    loadMeta = () => {
        this.props.showLoader();
        const { columns: configCols, showFooter, hideFiltering } = this.props.configuration;

        AggProvider.fetch(this.endpoint + '/meta', this.props.configuration.aggpath ? { aggpath: this.props.configuration.aggpath }: {})   // trying first to get the metadata from /meta 
            .catch(error => this.props.fetchData(this.endpoint, this.params)) // if this fails ask for one row including meta data
            .then(response => {
                const { fields, fields_order } = response.data.meta;
                let columns = [];
                let tableColumns = [];
                let columnsOrder = [];

                // Convert all the columns from the API to the array of objects
                if (fields) {
                    Object.keys(fields).forEach(key => {
                        const column = fields[key];
                        const confCol = configCols ? configCols.find(c => c.name === key) : {};
                        const type = column.api_type ? column.api_type.toLowerCase() : '';

                        tableColumns.push({
                            name: key,
                            label: column.title,
                            type: type,
                            description: column.description,
                            units: column.units !== "" ? column.units : null,
                            sortable: column.sortable,
                            searchable: column.searchable,
                            projectable: column.projectable || true,
                            numeric: type === 'fraction' || type === 'integer',
                            custom: false,
                            ...confCol
                        });
                    });
                }

                // Add Checkbox column for rows selection if needed
                if (this.state.selectable) {
                    columns.push({
                        name: 'selection',
                        label: '',
                        type: 'selection',
                        description: '',
                        custom: true, // indicates that this column should not be used in api requests
                        units: null,
                        sortable: false,
                        searchable: false,
                        projectable: false,
                        numeric: false
                    });
                }

                // Iterate over portlet config columns and collect them to display in a table
                if (configCols) {
                    configCols
                        .forEach(confCol => {
                            const column = tableColumns.find(c => c.name === confCol.name);
                            if (column) {
                                columnsOrder.push(confCol.name); // Push only those columns which are defined in the api
                                columns.push(column);
                            } else {
                                // To keep the full list of columns push also the custom columns (eg. Duration, Rate vs Pile-up)
                                const customColumn = { ...confCol, description: null, sortable: false, units: null, custom: true };
                                tableColumns.push(customColumn);
                                columns.push(customColumn);
                            }
                        });
                } else {
                    // Use all table columns if the list is not defined in the config json
                    columns = tableColumns;
                    if (fields_order) {
                        columnsOrder = [...fields_order];
                        columns = columnsOrder.map(columnName => tableColumns.find(c2 => c2.name === columnName ));
                    }
                    else {
                        columns = tableColumns;
                        columnsOrder = tableColumns.map(c => c.name);
                    }
                }

                // Keep the order from portlet configs in all table columns
                tableColumns = columns.concat(tableColumns.filter(c => !columns.includes(c)));

                // Load columnsOrder from cookies
                const cookieOrder = cookie.load(this.state.columnsOrderCookieName) || null;
                if (cookieOrder) {
                    const filteredColumns = cookieOrder.map(column => tableColumns.find(c => c.name === column));
                    columns = filteredColumns;
                    columnsOrder = filteredColumns.map(c => c.name);
                }

                // Get the column to order by
                // It could be defined in the config or first sortable
                let orderBy = this.state.orderBy;
                if (!orderBy && columns.length) {
                    const firstSortable = columns.find(item => item.sortable);
                    orderBy = firstSortable ? firstSortable.name : null;
                }

                return this.setState({
                    tableColumns: tableColumns,
                    columns: columns,
                    columnsOrder: columnsOrder,
                    orderBy: orderBy,
                    showResetBtn: cookieOrder ? true : this.state.showResetBtn,
                    showFooter: showFooter || false,
                    hideFiltering: hideFiltering || false,
                }, () => {
                    this.loadData()
                        .then(() => this.initialSelectRows());
                });
            })
            .catch(error => {
                this.removeCookies();
                this.props.onFailure(error);
            });
    }

    fetchData = (endpoint = this.endpoint) => {
        const { page, rowSize, order, orderBy, filters, columnsOrder, tableColumns } = this.state;

        const params = {
            page: page,
            pagesize: rowSize,
            sorting: orderBy ? [(order === 'asc' ? '' : '-') + orderBy] : null,
            filters: filters,
            fields: columnsOrder && columnsOrder.length ?
                // Filter all custom columns (since it's not defined in the api)
                columnsOrder.filter(column => !tableColumns.find(c => c.name === column).custom)
                : null,
            include: ['meta', 'presentation_timestamp'],
            selectors: this.params.selectors,
            group: this.props.configuration.granularity ? { key: 'granularity', value: this.props.configuration.granularity } : null
        };
        if (this.props.getFilterMD && this.props.getFilterMD()) {
            if (!params.filters)
                params.filters = [];
            params.filters.push(this.props.getFilterMD());
        }

        if ( this.props.configuration.filters) {
            if (!params.filters)
                params.filters = [];
            this.props.configuration.filters.forEach( filter => {
                params.filters.push(filter);
            });
        }

        return this.props.fetchData(endpoint, params)
    }

    getQueryParam = (query,name,defaultVal) => {
        return  (query !== null && query[name]!=null) ? query[name] : defaultVal;
    };


    loadData = () => {
        const { dynamicTitle } = this.props.configuration;        
        this.props.showLoader();
        if (dynamicTitle && dynamicTitle.selectors && dynamicTitle.title) {
            let values = [];
            dynamicTitle.selectors.forEach(selector => {
                values.push(this.getQueryParam(this.props.query, selector, "unknown"))
            });
            let title = dynamicTitle.title;
            values.forEach( value => {
                title = title.replace('{}',value);
            });
            this.props.setTitle(title);
        }
        const { rowSize, tableColumns } = this.state;

        return this.fetchData().then(response => {
            const { data, meta } = response.data;
            return { data: transformData(data, meta, this.rowIdColumn, this.props.nested), meta: meta };
        })
            .then(response => { return { ...response, columns: addColumnUnits(response.data, this.state.columns) } })
            .then(response => { return { ...response, aggData: aggregateData(response.data, response.columns, this.state.aggregate) } })
            .then(response => {
                const { data, aggData, meta, columns } = response;
                const { totalResourceCount } = meta;
                const totalCount = totalResourceCount > 0 ? totalResourceCount : 1;

                this.setState({
                    loading: false,
                    data: aggData ? data.concat(aggData) : data,
                    count: totalCount,
                    pages: Math.ceil(totalCount / rowSize),
                    columns: columns,
                    searchableColumns: columns.filter(c => c.searchable),
                    projectableColumns: tableColumns.filter(c => c.projectable),
                });
                if (!data.length && !this.state.headerChecked) return this.props.onEmpty();
                return this.props.hideLoader();
            })
            .catch(error => {
                this.removeCookies();
                this.props.onFailure(error);
            });
    }

    onSort = (event, property) => {
        const { order, orderBy } = this.state;
        const newOrder = (orderBy === property && order === 'desc') ? 'asc' : 'desc';
        cookie.save(this.state.orderCookieName, { order: newOrder, orderBy: property }, { path: '/' });
        if (this.sortingToURL) {
            this.props.addUrlParam({ [this.props.id]: { order: newOrder, orderBy: property } });
        }
        this.setState({ loading: true, page: 1, order: newOrder, orderBy: property, showResetBtn: true }, this.loadData);
    }

    onRowSizeChange = value => {
        const pages = Math.ceil(this.state.count / value);
        cookie.save(this.state.rowSizeCookieName, value, { path: '/' });
        this.setState({ loading: true, page: 1, pages: pages, rowSize: value, showResetBtn: true }, this.loadData);
    }

    onAllRowSizeChange = () => {
        this.setState({ loading: true, page: 1, pages: 1, rowSize: 10000, showResetBtn: true }, this.loadData);
    }

    onPageChange = (page) => {
        const newPage = parseInt(page, 10);
        if (newPage && newPage <= this.state.pages) {
            this.setState({ loading: true, page: newPage }, this.loadData);
        }
    }

    onExportCSV = () => {
        return this.fetchData(this.endpoint + '/csv')
            .then(resp => fileDownload(resp.data, 'data.csv'));
    }

    onReset = () => {
        this.removeCookies();
        const { pagesize, order } = this.props.configuration;
        if (this.sortingToURL) {
            this.props.addUrlParam({ [this.props.id]: {} });
        }
        return this.setState({
            showResetBtn: false,
            rowSize: pagesize || PAGE_SIZE,
            orderBy: order ? order[0] : false,
            order: order ? order[1] : 'desc',
            loading: true,
            filters: null,
            page: 1,
            headerChecked: false
        }, this.loadMeta);
    }

    onSearch = (filters) => {
        this.setState({ loading: true, page: 1, filters: filters, headerChecked: false }, this.loadData);
    }

    onColumnOrderChange = (columns) => {
        cookie.save(this.state.columnsOrderCookieName, columns.map(c => c.name), { path: '/' });
        return this.setState({
            loading: true,
            showResetBtn: true,
            columnsOrder: columns.map(c => c.name),
            columns: columns
        });
    }

    onColumnFilter = (columns, addColumn) => {
        cookie.save(this.state.columnsOrderCookieName, columns.map(c => c.name), { path: '/' });
        return this.setState({
            loading: true,
            showResetBtn: true,
            columnsOrder: columns.map(c => c.name),
            columns: columns
        },
            addColumn ? this.loadData : () => this.setState({ loading: false }));
    }

    removeCookies = () => {
        const { rowSizeCookieName, columnsOrderCookieName, orderCookieName } = this.state;
        cookie.remove(orderCookieName, { path: '/' });
        cookie.remove(rowSizeCookieName, { path: '/' });
        cookie.remove(columnsOrderCookieName, { path: '/' });
    }

    // Dispatch row selection event to master-details channel
    // for initial selected rows list declared in the json config
    // as well as selected prop from the url params

    initialSelectRows = () => {
        const { selected, headerChecked } = this.state;

        if (!selected.length) return;
        if (!this.state.data || !this.state.data.length) return;

        // Load selected rows which are not yet fetched (selected in different pages)
        const unfound = selected.filter(s => !this.state.data.find(row => row.id.toString() === s.toString()));
        unfound.forEach(id => {
            const endpoint = this.rowIdColumn ? this.endpoint : this.endpoint + '/' + id;
            const params = this.rowIdColumn ? {
                fields: [this.rowIdColumn],
                filters: [{
                    attribute: this.rowIdColumn,
                    operator: 'EQ',
                    value: id
                }]
            } : {};

            this.props.fetchData(endpoint, params)
                .then(resp => this.props.onRowSelect({ row: resp.data.data[0], selected: true }));
        });

        // Select rows which are already fetched
        selected.forEach(id => {
            const row = this.state.data.find(row => row.id.toString() === id.toString());
            if (!row) return;
            this.props.onRowSelect({ row: row, selected: true });
        });
        if (headerChecked)
            this.props.addUrlParam({ [this.props.id]: { headerChecked, selected: selected } });
        else
            this.props.addUrlParam({ [this.props.id]: { selected: selected } });
    }

    onRowClick = id => {
        const { headerChecked, selected } = this.state;
        let newSelected = [];

        const found = this.isSelected(id);
        if (found) {
            newSelected = selected.filter(s => s !== id);
        } else {

            // Allow only limited selection of rows
            if (selected.length >= MAX_SELECTIONS) {
                this.props.openSnackbar("It's only allowed to select maximum " + MAX_SELECTIONS + " rows per table");
                return;
            }
            newSelected = [...selected, id];
        }
        this.setState({ selected: newSelected });
        this.props.onRowSelect({
            row: this.state.data.find(row => row.id.toString() === id.toString()),
            selected: found ? false : true
        });
        if (headerChecked)
            this.props.addUrlParam({ [this.props.id]: { headerChecked, selected: newSelected } });
        else
            this.props.addUrlParam({ [this.props.id]: { selected: newSelected } });
    };

    isSelected = id => this.state.selected.includes(id);

    getFilterSelectedRows = (rowIdColumn, selected) =>  {
        if (selected === undefined) selected = [];
        const filters = [{
            attribute: this.rowIdColumn,
            operator: 'IN',
            value: selected.join(',')
        }];
        return filters;
    };

    onHeaderCheckboxClick = () => {
        const { headerChecked, selected } = this.state;
        let newChecked = !headerChecked;
        if (newChecked)
            this.props.addUrlParam({ [this.props.id]: {headerChecked: newChecked, selected } });
        else
            this.props.addUrlParam({ [this.props.id]: { selected } });
        const filters = newChecked ? this.getFilterSelectedRows(this.rowIdColumn, selected) : null;
        this.setState({ loading: true, page: 1, filters: filters, headerChecked: newChecked }, this.loadData);
    };


    render() {
        const {
            data, columns, tableColumns, order, orderBy, showFooter,
            page, pages, rowSize, rowSizeList, searchableColumns, projectableColumns,
            showResetBtn, hideProjection, hideFiltering, selected, exportCSV, headerChecked
        } = this.state;

        const { checkboxDisabled } = this.props.configuration;

        if (!data) return <div />;

        const { portletHeight } = this.props;
        return (
            <Datatable
                vertical={this.vertical}
                height={portletHeight}
                data={data}
                columns={columns}
                tableColumns={tableColumns}
                searchableColumns={searchableColumns}
                projectableColumns={projectableColumns}
                onColumnFilter={this.onColumnFilter}
                onColumnOrderChange={this.onColumnOrderChange}
                order={order}
                orderBy={orderBy}
                onSort={this.onSort}
                showFooter={showFooter}
                hideProjection={hideProjection}
                hideFiltering={hideFiltering}
                exportCSV={exportCSV}
                onExportCSV={this.onExportCSV}
                page={page}
                pages={pages}
                onPageChange={this.onPageChange}
                rowSize={rowSize}
                rowSizeList={rowSizeList}
                onRowSizeChange={this.onRowSizeChange}
                onAllRowSizeChange={this.onAllRowSizeChange}
                onSearch={this.onSearch}
                onReset={this.onReset}
                showResetBtn={showResetBtn}
                onRowClick={this.onRowClick}
                onHeaderCheckboxClick={this.onHeaderCheckboxClick}
                headerChecked={headerChecked}
                checkboxDisabled={checkboxDisabled}
                onPopover={this.props.onPopover}
                selected={selected}
            />
        );
    }
}

export default DataTable;
