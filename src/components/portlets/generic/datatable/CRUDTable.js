import React, { Component } from 'react';
import Datatable from './table/Table';
import cookie from 'react-cookies';
import fileDownload from 'js-file-download';
//import { isEqual, difference } from 'lodash';

const ROW_SIZE_LIST = [10, 20, 30, 50];
const PAGE_SIZE = 10;

class CRUDTable extends Component {

    constructor(props) {
        super(props);
        //const {
        //    orderConfig = 'desc',
        //    hideProjection = false, vertical=  false, pagesize = PAGE_SIZE, sortingToURL = false,
        //    exportCSV = false, rowsList = ROW_SIZE_LIST
        //} = props.configuration;
        //
        const orderConfig = [false, 'desc']
        const hideProjection = false
        const vertical = false
        const pagesize = PAGE_SIZE
        const sortingToURL = false
        const exportCSV = false
        const rowsList = ROW_SIZE_LIST
        //} = props.configuration;

        const { urlParams } = props;

        const order = orderConfig ? orderConfig[1] : 'desc';
        const orderBy = orderConfig ? orderConfig[0] : false;

        this.vertical = props.vertical || vertical || false;
        this.sortingToURL = sortingToURL || false;
        this.rowsList = rowsList;

        this.state = {
            loading: false,
            filters: null,  // ?
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
            aggData: null,
            showResetBtn: false,
            showFooter: false,
            exportCSV: exportCSV || false,
            hideProjection: hideProjection || false,
            hideFiltering: false,
            selected: [],
        };
    }

    componentDidMount() {
//        const { order, orderBy, orderCookieName } = this.state;
//        const orderCookie = cookie.load(orderCookieName);

        return this.setState({
              showResetBtn: false
//            showResetBtn: orderCookie ? true : false,
//            order: orderCookie ? orderCookie.order : order,
//            orderBy: orderCookie ? orderCookie.orderBy : orderBy
        }, this.loadMeta);
    }

    componentDidUpdate(prevProps) {


        this.props.shouldUpdate(prevProps.query, this.props.query, () => {
            this.props.onRowClick(null, null, null);
            return this.setState({
                loading: true,
                page: 1, count: null,
                selected: []
                }, () => { this.loadData() } );
        })
    }

    loadMeta = () => {
        //this.props.showLoader();
        //const { configCols, showFooter, hideFiltering } = this.props.configuration;
        const { configCols, hideFiltering } = this.props.configuration;
        const showFooter = true;
//        const { configCols, showFooter, hideFiltering } = this.props;
        const { fields } = this.props; //from source

        //const { fields, fields_order } = response.data.meta;
        let columns = [];
        let tableColumns = [];
        let columnsOrder = [];

        // Convert all the columns from the API to the array of objects
        if (fields && fields.length) {
            fields.forEach(column => {
                const confCol = configCols ? configCols.find(c => c.name === column.name) : {};
                const type = column.api_type ? column.api_type.toLowerCase() : '';

                tableColumns.push({
                    name: column.name,
                    label: column.label,
                    type: type,
                    description: column.description,
                    units: column.units !== "" ? column.units : null,
                    sortable: column.sortable,
                    searchable: column.searchable,
                    projectable: column.projectable || true,
                    numeric: type === 'fraction' || type === 'integer',
                    render: type === 'html' ? column.render : null,
                    custom: false,
                    ...confCol
                });
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
            columnsOrder = tableColumns.map(c => c.name);
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
        });
        //.catch(error => {
        //    this.removeCookies();
        //    this.props.onFailure(error);
        //});
    }

    transformData = (data, meta) => {

        return data.map(row => {
          if (!row.id) row.id = row.attributes.name;
          return row;
        });
    }

    fetchData = (suffix) => {
        //const { page, rowSize, order, orderBy, filters, columnsOrder, tableColumns } = this.state;
        const { page, rowSize, order, orderBy } = this.state;

        //TODO: columns, row order, and table columns
        const url = this.props.getEndpoint({page:page, pageSize: rowSize, order: order, orderBy: orderBy }) + suffix;
        return this.props.fetchData(url)
    }

    getQueryParam = (query,name,defaultVal) => {
        return  (query !== null && query[name]!=null) ? query[name] : defaultVal;
    };

    onQueryChange = (resetPage, resetSelected, setLoading) => {
        if (resetPage)
          this.setState({ loading: true, page: 1, selected: []}, this.loadData);
        else {
         if (resetSelected)
           this.setState({ loading: true, selected: []}, this.loadData);
         else
           this.setState({ loading: setLoading }, this.loadData);
        }
    }

    loadData = () => {
        this.props.showLoader();
        //this.props.setTitle(title);
        //const { rowSize, tableColumns } = this.state;
        const { rowSize } = this.state;

        return this.fetchData('').then(response => {
                const { data } = response;
                const totalResourceCount = response.totalCount;
                const totalCount = totalResourceCount > 0 ? totalResourceCount : 1;

                this.setState({
                    loading: false,
                    data: data,
                    count: totalCount,
                    pages: Math.ceil(totalCount / rowSize),
                    page: response.page
                    //columns: columns,
                    //searchableColumns: this.state.columns.filter(c => c.searchable),
                    //projectableColumns: tableColumns.filter(c => c.projectable),
                }, () => {if (this.props.postLoadData) this.props.postLoadData(data)} );
                this.props.hideLoader();
                if (!data.length) return this.props.onEmpty ? this.props.onEmpty(): null;
            })
            .catch(error => {
                this.props.hideLoader();
                this.removeCookies();
                this.props.onFailure(error);
            });
    }

    onSort = (event, property) => {
        const { order, orderBy } = this.state;
        const newOrder = (orderBy === property && order === 'desc') ? 'asc' : 'desc';
        cookie.save(this.state.orderCookieName, { order: newOrder, orderBy: property }, { path: '/' });
        //if (this.sortingToURL) {
        //    this.props.addUrlParam({ [this.props.id]: { order: newOrder, orderBy: property } });
        //}
        this.setState({ loading: true, page: 1, order: newOrder, orderBy: property, showResetBtn: true }, this.loadData);
    }

    onPageChange = (page) => {
        const newPage = parseInt(page, 10);
        if (newPage && newPage <= this.state.pages) {
            this.props.onRowClick(null,null,null);
            this.setState({ loading: true, page: newPage, selected: [] }, this.loadData); //see about unselected prop callback
        }
    }

    onExportCSV = () => {
        return this.fetchData('/csv')
            .then(resp => fileDownload(resp.data, 'data.csv'));
    }

    onReset = () => {
        //TODO:
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
            loading: false,
            filters: null,
            page: 1
        }, this.loadMeta);
    }

    onSearch = (filters) => {
        this.setState({ loading: true, page: 1, filters: filters }, this.loadData);
    }

    removeCookies = () => {
        const { orderCookieName } = this.state;
        cookie.remove(orderCookieName, { path: '/' });
    }

    onFullRowClick = (event, id) => {
        const rows = this.state.data.filter(row => row.id === id);

        //doubleclick prevention ( < 0.5s)
        const ct = new Date().getTime();
        if( this.state.lastClicked && (ct - this.state.lastClicked.time < 500) && this.state.lastClicked.id === id)
            return;

        if (rows.length) {
            this.setState({selected: this.isSelected(id) ? []: [id], lastClicked: {time:ct, id:id}}, () => {
                if (rows.length)
                    this.props.onRowClick(event, id, rows[0].attributes);
            });
        }
    }

    onRowSizeChange = value => {
        this.setState({ loading: true, page: 1, rowSize: value }, this.loadData);
    }


    isSelected = id => this.state.selected.includes(id);

    render() {
        const {
            data, columns, tableColumns, order, orderBy, showFooter,
            page, pages, rowSize, rowSizeList, searchableColumns, projectableColumns,
            showResetBtn, hideProjection, hideFiltering, selected, exportCSV,
        } = this.state;

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
                onColumnFilter={() => {}}
                onColumnOrderChange={() => {}}
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
                hideRowsPerPage={this.props.hideRowsPerPage}
                rowSize={rowSize}
                rowSizeList={rowSizeList}
                onSearch={this.onSearch}
                onReset={this.onReset}
                onRowSizeChange={this.onRowSizeChange}
                showResetBtn={showResetBtn}
                onFullRowClick={this.onFullRowClick}
                onHeaderCheckboxClick={ () => {} }
                headerChecked={false}
                checkboxDisabled={true}
                onPopover={this.props.onPopover}
                selected={selected}
                renderCustomFilterInputs={this.props.renderCustomFilterInputs}


            />
        );
    }
}

export default CRUDTable;
