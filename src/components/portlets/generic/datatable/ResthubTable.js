import React, { Component } from 'react';
import Datatable from './table/Table';
import Resthub from '../../../providers/Resthub';
//import cookie, { select } from 'react-cookies';
import cookie from 'react-cookies';
import { difference } from 'lodash';

class ResthubTable extends Component {

    constructor(props) {
        super(props);

        this.state = { data: null };

        const { configuration } = props;
        this.resthubUrl = 'resthubUrl' in configuration ? configuration.resthubUrl : 'http://localhost:9091';

	console.log("resthubUrl table" + this.resthubUrl);

        const order = 'sort' in configuration ? configuration.sort.order : 'desc';
        const orderBy = 'sort' in configuration ? configuration.sort.column : null;

        this.columnsCookieName = props.id + '_columns_order';
        this.rowSizeCookieName = props.id + '_row_size';
        this.showResetBtn = false;

        this.params = {
            queryId: null,
            order: order,
            orderBy: orderBy,
            filter: null,
            page: 1,
            pages: null,
            count: null,
            rowSize: 10,
            rowSizeList: [10, 25, 50, 100],
        };

        this.columns = {
            columns: [], // Filtered list of columns which are displayed in table  
            tableColumns: null, // Full list of table columns
        };

        this.defaultParams = { ...this.params };
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (this.state.data === nextState.data) {
            return true;
        }
        return false;
    }

    componentDidMount() {
        this.loadMeta();
    }

    componentDidUpdate(prevProps) {
        this.props.shouldRefresh(this.props, () => {
            this.params = { ...this.defaultParams };
            this.loadData();
        });

        this.props.shouldUpdate(prevProps.query, this.props.query, (nextQuery) => {
            this.params = { ...this.defaultParams };
            this.loadData(nextQuery);
        });
    }

    loadMeta = () => {
        const { configuration } = this.props;
        return Resthub.query("SELECT * FROM ( " + configuration.query + " ) t  ", this.resthubUrl)
            .then(response => {
                return Resthub.meta(response.data, this.resthubUrl)
                    .then(response => {
                        this.columns.tableColumns = response.data.columns.map(column => {
                            return {
                                title: column.name,
                                name: column.jname,
                                label: column.name,
                                type: column.type.toLowerCase(),
                                description: null,
                                units: null,
                                sortable: true,
                            }
                        });
                        const { tableColumns } = this.columns;

                        // Load rowSize from cookie
                        const rowSizeCookie = cookie.load(this.rowSizeCookieName);
                        this.params.rowSize = rowSizeCookie ? parseInt(rowSizeCookie, 10) : this.params.rowSize;
                        this.showResetBtn = rowSizeCookie ? true : false;

                        // Load columns from cookie
                        const cookieColumns = cookie.load(this.columnsCookieName) || null;
                        if (cookieColumns) {
                            const filteredColumns = cookieColumns.map(column => tableColumns.find(c => c.name === column));
                            this.columns.columns = filteredColumns;
                            this.showResetBtn = true;
                            return;
                        }

                        // Load columns from portlet config
                        const { columns } = configuration;
                        if (columns && columns.length) {
                            const filteredColumns = columns.map(column => tableColumns.find(c => c.name === column));
                            this.columns.columns = filteredColumns;
                            return;
                        }

                        // Load all columns
                        this.columns.columns = [...tableColumns];
                    })
                    .then(() => this.loadData());
            }).catch(error => this.props.onFailure(error));
    }

    createQuery = (sqlParams) => {
        if (this.params.queryId) return Promise.resolve();

        const { orderBy, order, filter, rowSize } = this.params;
        const { columns, tableColumns } = this.columns;
        let sql = 'SELECT ';

        // SELECT
        const diff = difference(Object.keys(tableColumns), columns.map(c => c.name));

        if (columns.length && diff.length) {
            sql += columns.map(c => 't.' + c.title).join(', '); // Appends "t." to column names
        }
        else sql += ' * ';

        // FROM
        sql += ` FROM ( ${this.props.configuration.query} ) t `;

        // WHERE
        const filterColumn = filter ? tableColumns.find(c => c.name === filter[0].attribute) : null;
        if (filterColumn) {
            const title = filterColumn.type === 'string' ? `LOWER (t.${filterColumn.title})` : `t.${filterColumn.title}`;
            const value = filter[0].value.toLowerCase();
            sql += ` WHERE ${title} LIKE '%${value}%' `;
        }

        // ORDER BY
        if (orderBy) {
            const orderColumn = tableColumns.find(c => c.name === orderBy);
            this.params.orderBy = orderColumn.name;
            this.params.order = order;
            sql += orderColumn ? ` ORDER BY t.${orderColumn.title} ${order}` : '';
        }

        return Resthub.query(sql, this.resthubUrl)
            .then(response => {
                const queryId = response.data;
                return Resthub.count(queryId, sqlParams, this.resthubUrl)
                    .then(countResponse => {
                        const totalCount = countResponse.data > 0 ? countResponse.data : 1;
                        this.params.queryId = queryId;
                        this.params.count = totalCount;
                        this.params.pages = Math.ceil(totalCount / rowSize);
                    });
            });
    }

    fetchData = (sqlParams) => {
        const { queryId, rowSize, page } = this.params;
        console.log('cia ', queryId, rowSize, page)
        Resthub.json_fast(queryId, sqlParams, rowSize, page, this.resthubUrl)
        // Resthub.json_fast(queryId, sqlParams, rowSize, page, this.resthubUrl)
            .then(response => {
                const data = response.data.data.map(row => {
                    return {
                        attributes: row,
                        units: null,
                    }
                });
                this.setState({ data: data });
                this.props.hideLoader();
            })
            .catch(error => this.props.onFailure(error));
    }

    loadData = (query = this.props.query) => {
        this.props.showLoader();

        const { configuration } = this.props;
        let sqlParams = {};

        if (configuration.parameters) {
            Object.entries(configuration.parameters).forEach(([param, selector]) => {
                try {
                    if (query.hasOwnProperty(selector.selector)) {
                        sqlParams[param] = query[selector.selector];
                    }
                }
                catch (e) {
                    console.log("problem with parameter" + param);
                }
            });
        }
        return this.createQuery(sqlParams).then(() => this.fetchData(sqlParams));
    }

    onReset = () => {
        cookie.remove(this.columnsCookieName, { path: '/' });
        cookie.remove(this.rowSizeCookieName, { path: '/' });
        this.showResetBtn = false;
        this.params = { ...this.defaultParams };
        this.loadMeta();
    }

    onColumnFilter = (columns, addColumn) => {
        this.columns.columns = columns;
        this.params.queryId = null;
        this.showResetBtn = true;
        cookie.save(this.columnsCookieName, columns.map(c => c.name), { path: '/' });
        this.loadData();
    }

    onSearch = (filters) => {
        this.params.filter = filters;
        this.params.page = 1;
        this.params.queryId = null;
        this.loadData();
    }

    onSort = (event, property) => {
        const { order, orderBy } = this.params;
        const newOrder = (orderBy === property && order === 'desc') ? 'asc' : 'desc';

        this.params.page = 1;
        this.params.queryId = null;
        this.params.order = newOrder;
        this.params.orderBy = property;
        this.loadData();
    }

    onPageChange = (page) => {
        const newPage = parseInt(page, 10);
        if (newPage && newPage <= this.params.pages) {
            this.params.page = newPage;
            this.loadData();
        }
    }

    onRowSizeChange = (event, index, newSize) => {
        const pages = Math.ceil(this.params.count / newSize);
        this.params.page = 1;
        this.params.pages = pages;
        this.params.rowSize = newSize;
        this.showResetBtn = true;
        cookie.save(this.rowSizeCookieName, newSize, { path: '/' });
        this.loadData();
    }

    render() {
        const { data } = this.state;
        if (!data) return <div />;

        const { order, orderBy, page, pages, rowSize, rowSizeList } = this.params;
        const { tableColumns, columns } = this.columns;
        const { portletHeight, configuration } = this.props;
        const showFooter = 'showFooter' in configuration ? configuration.showFooter : true; // Shows footer by default

        return (
            <Datatable
                height={portletHeight}
                data={data}
                columns={columns}
                tableColumns={tableColumns}
                searchableColumns={columns}
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
                showResetBtn={this.showResetBtn}
                hideFiltering={false}
                projectableColumns={tableColumns}
            />
        );
    }
}

export default ResthubTable;