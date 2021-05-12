import React, { PureComponent } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Table } from '@material-ui/core';
import TableHeader from './Header';
import TableBody from './Body';
import TableFooter from './Footer';

const styles = {
    tableContainer: {
        width: '100%',
        overflowX: 'auto',
        paddingLeft: 2,
    },
};

class DataTable extends PureComponent {

    constructor() {
        super();
        this.state = {
            footerInputText: '',
        };
    }

    handleSort = (event, property) => {
        const { onSort } = this.props;
        if (!onSort) return;
        onSort(event, property);
    }

    handleRowSizeChange = (event) => {
        const { onRowSizeChange } = this.props;
        if (!onRowSizeChange) return;
        onRowSizeChange(event.target.value);
    }

    handlePageChange = (page) => {
        this.setState({ footerInputText: '' });
        const { onPageChange } = this.props;
        if (!onPageChange) return;
        onPageChange(page);
    }

    handleSearch = (value) => {
        const { onSearch } = this.props;
        if (!onSearch) return;
        onSearch(value);
    }

    handleColumnFilter = (columns, addColumn) => {
        const { onColumnFilter } = this.props;
        if (!onColumnFilter) return;
        onColumnFilter(columns, addColumn);
    }

    handleColumnOrderChange = (columns) => {
        const { onColumnOrderChange } = this.props;
        if (!onColumnOrderChange) return;
        onColumnOrderChange(columns);
    }

    handlePageInputUpdate = (inputText) => {
        const inputInt = parseInt(inputText, 10);
        this.setState({ footerInputText: inputInt ? Math.abs(inputInt).toString() : '' });
    }

    handleReset = () => {
        const { onReset } = this.props;
        if (!onReset) return;
        onReset();
    }

    render() {
        const {
            height, data, order, orderBy, columns, searchableColumns,
            projectableColumns, showFooter, classes, page, pages, rowSize, rowSizeList,
            tableColumns, hideFiltering, showResetBtn, hideProjection, vertical,
            hideHeader, exportCSV, onExportCSV, headerChecked, checkboxDisabled
        } = this.props;
        const { footerInputText } = this.state;

        const footerHeight = showFooter ? 60 : 0; // Table Footers height 60px
        const tableHeight = height - footerHeight + 'px';
        return (
            <div>
                <div
                    className={classes.tableContainer}
                    style={{ height: tableHeight }}>
                    <Table classes={{ root: classes.tableContainer }}>
                        {!vertical && !hideHeader &&
                            <TableHeader
                                order={order}
                                orderBy={orderBy}
                                onSort={this.handleSort}
                                onCheckboxClick={this.props.onHeaderCheckboxClick}
                                headerChecked={headerChecked}
                                checkboxDisabled={checkboxDisabled}
                                columns={columns}
                            />
                        }
                        <TableBody
                            data={data}
                            columns={columns}
                            vertical={vertical}
                            onRowClick={this.props.onRowClick}
                            onFullRowClick={this.props.onFullRowClick}
                            selected={this.props.selected}
                            onPopover={this.props.onPopover}
                        />
                    </Table>
                </div>
                {showFooter &&
                    <TableFooter
                        searchableColumns={searchableColumns}
                        projectableColumns={projectableColumns}
                        tableColumns={tableColumns}
                        columns={columns}
                        onColumnFilter={this.handleColumnFilter}
                        onColumnOrderChange={this.handleColumnOrderChange}
                        page={page}
                        pages={pages}
                        pageInputText={footerInputText}
                        handlePageInputUpdate={this.handlePageInputUpdate}
                        hideRowsPerPage={this.props.hideRowsPerPage}
                        rowSize={rowSize}
                        rowSizeList={rowSizeList}
                        onRowSizeChange={this.handleRowSizeChange}
                        onAllRowSizeChange={this.props.onAllRowSizeChange}
                        onPageChange={this.handlePageChange}
                        onSearch={this.handleSearch}
                        onReset={this.handleReset}
                        showResetBtn={showResetBtn}
                        hideProjection={hideProjection}
                        hideFiltering={hideFiltering}
                        exportCSV={exportCSV}
                        onExportCSV={onExportCSV}
                        renderCustomFilterInputs={this.props.renderCustomFilterInputs}
                    />
                }
            </div>
        );
    }
}

export default withStyles(styles)(DataTable);
