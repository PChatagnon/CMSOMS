import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import FirstPageIcon from '@material-ui/icons/FirstPage';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import LastPageIcon from '@material-ui/icons/LastPage';
import FilterIcon from '@material-ui/icons/FilterList';
import DownloadIcon from '@material-ui/icons/CloudDownload';
import ClearIcon from '@material-ui/icons/Clear';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import Toolbar from '@material-ui/core/Toolbar';
import AutoComplete from '../../../../generic/Autocomplete';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import SearchIcon from '@material-ui/icons/Search';
import InputAdornment from '@material-ui/core/InputAdornment';
import SortableList from '../../../../generic/SortableList';
import Popover from '@material-ui/core/Popover';
import Box from '@material-ui/core/Box';
import { arrayMove } from 'react-sortable-hoc';

//const styles = theme => ({
const styles = ({
    footer: {
        background: 'white',
        borderTop: '1px solid rgb(224, 224, 224)',
        padding: 0,
        minHight: 0,
        height: 64,
        overflowY: 'hidden',
        overflowX: 'auto',
        display: 'flex',
    },
    footerItems: {
        marginLeft: 'auto',
        position: 'relative',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rowsPerPage: {
        color: 'rgb(158, 158, 158)',
        fontSize: 12
    },
    footerActions: {
        marginLeft: 8,
        marginRight: 8,
    },
    textField: {
        fontSize: 12
    },
    selectField: {
        marginLeft: 10,
        marginRight: 40
    },
    flex: {
        display: 'flex'
    },
    autocomplete: {
        marginLeft: 10,
        marginRight: 20,
        width: 100
    },
    autocompleteInput: {
        fontSize: 12,
        width: 100
    },
    sortableListItem: {
        cursor: 'row-resize'
    },
    searchToolbarGroup: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
    },
    paper: {
//        padding: theme.spacing(1),
        padding: 10,
    },
    buttondiv: {
        '& > *': {
//            margin: theme.spacing(1)
            margin: 10
        }
    }
});

class Footer extends Component {

    constructor() {
        super();
        this.searchValueTimer = undefined;
        this.state = {
            filterMode: false,
            filterButtonEl: null,
            searchValue: '',
            searchColumn: null,
            searchColumnEl: null,
            orderButtonEl: null,
            expPopoverEl: null,
            expPopoverOpen: false
        };
    }

    onFilterClick = () => {
        const { filterMode, searchValue } = this.state;
        const mode = !filterMode;

        this.setState({
            filterMode: mode,
            searchValue: '',
        });

        if (mode && searchValue !== '') {
            this.props.onSearch(null);
        }
    }

    onSearch = (value) => {
        const { searchColumn } = this.state;
        if (value === '') return this.props.onSearch(null);

        this.props.onSearch([{
            attribute: searchColumn.name,
            operator: 'LIKE',
            value: value,
        }]);
    }

    onSearchValueChange = event => {
        const { value } = event.target;
        this.setState({ searchValue: value });
        clearTimeout(this.searchValueTimer);
        this.searchValueTimer = setTimeout(() => this.onSearch(value.trim()), 500);
    }

    onSearchColumnChange = event => {
        const { searchValue } = this.state;
        if (searchValue !== '') {
            this.props.onSearch(null);
        }
        const column = this.props.searchableColumns.find(c => c.name === event.target.dataset.column);
        this.setState({ searchColumn: column, searchValue: '' });
    }

    onClearClick = () => {
        const { searchValue } = this.state;
        if (searchValue !== '') {
            this.setState({ searchValue: '' });
            return this.props.onSearch(null);
        }
        this.setState({ searchColumn: null });
    }

    onColumnProjectionChange = event => {
        const { columns, tableColumns } = this.props;
        const column = tableColumns.find(c => c.name === event.target.dataset.column);
        const index = tableColumns.findIndex(c => c.name === column.name);
        const found = columns.find(c => c.name === column.name);

        if (found && column.hidden) {
            column.hidden = false;
            return this.props.onColumnFilter([...columns], false);
        }

        const addColumn = found ? false : true;
        const newColumns = found
            ? columns.filter(c => c.name !== column.name)
            : [...columns.slice(0, index), column, ...columns.slice(index)]

        return this.props.onColumnFilter(newColumns, addColumn);
    }

    onSortEnd = ({ oldIndex, newIndex }) => {
        this.props.onColumnOrderChange(
            arrayMove(this.props.columns, oldIndex, newIndex)
        );
    }

    handleExpPopoverOpen = (event) => {
        this.setState({expPopoverEl: event.currentTarget, expPopoverOpen: true});
    }

    handleExpPopoverClose = () => {
        this.setState({expPopoverEl: null, expPopoverOpen:false});
    }

    handleExpCurrent = () => {
        this.handleExpPopoverClose();
        this.props.onExportCSV();
    }

    handleExpAll = () => {
        this.handleExpPopoverClose();
        this.props.onAllRowSizeChange();
        // load all !
        //this.props.onExportCSV();
    }


    renderFilterInputs = filterMode => {
        if (!filterMode) return;
        const {
            searchValue, searchColumn, searchColumnEl, filterButtonEl, orderButtonEl
        } = this.state;
        const {
            searchableColumns, projectableColumns, columns,
            showResetBtn, hideProjection, hideFiltering, classes
        } = this.props;
        return (
            <div style={styles.searchToolbarGroup}>
                {searchableColumns.length > 0 && !hideFiltering &&
                    <div>
                        <Tooltip title='Individual column filtering'>
                            <Button
                                aria-owns={searchColumnEl ? 'searchColumnMenu' : undefined}
                                aria-haspopup="true"
                                onClick={event => this.setState({ searchColumnEl: event.currentTarget })}
                                id='footerFilterBtn'
                                size="medium"
                                color="primary"
                            >
                                Filter
                            </Button>
                        </Tooltip>
                        <Menu
                            id="searchColumnMenu"
                            anchorEl={searchColumnEl}
                            open={Boolean(searchColumnEl)}
                            onClose={() => this.setState({ searchColumnEl: null })}
                            onClick={() => this.setState({ searchColumnEl: null })}
                        >
                            {searchableColumns.map((column, key) => {
                                return (
                                    <MenuItem
                                        key={key}
                                        value={column.name}
                                        data-column={column.name}
                                        selected={searchColumn === column}
                                        onClick={this.onSearchColumnChange}
                                    >
                                        {column.label}
                                    </MenuItem>);
                            })}
                        </Menu>
                    </div>
                }
                {searchColumn &&
                    <div style={styles.searchToolbarGroup}>
                        <TextField
                            id="footerSearchField"
                            value={searchValue}
                            onChange={this.onSearchValueChange}
                            placeholder={`Search in ${searchColumn.label}`}
                            InputProps={{
                                className: classes.textField,
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                )
                            }}
                        />
                        <Tooltip title='Clear search field'>
                            <IconButton
                                size="medium"
                                onClick={this.onClearClick}
                                id='footerSearchBtn'
                            >
                                <ClearIcon />
                            </IconButton>
                        </Tooltip>
                    </div>
                }
                {projectableColumns.length > 0 && !hideProjection &&
                    <div>
                        <Tooltip title='Column projection'>
                            <Button
                                aria-owns={filterButtonEl ? 'filterColumnMenu' : undefined}
                                aria-haspopup="true"
                                onClick={event => this.setState({ filterButtonEl: event.currentTarget })}
                                id='footerProjectionBtn'
                                size="medium"
                                color="primary"
                            >
                                Columns
                            </Button>
                        </Tooltip>
                        <Menu
                            id="filterColumnMenu"
                            anchorEl={filterButtonEl}
                            open={Boolean(filterButtonEl)}
                            onClose={() => this.setState({ filterButtonEl: null })}
                        >
                            {projectableColumns.map((column, key) => {
                                return (
                                    <MenuItem
                                        key={key}
                                        value={column.name}
                                        data-column={column.name}
                                        selected={columns.find(c => c.name === column.name && !c.hidden) ? true : false}
                                        onClick={this.onColumnProjectionChange}
                                    >
                                        {column.label}
                                    </MenuItem>);
                            })}
                        </Menu>
                    </div>
                }
                <div>
                    <Tooltip title='Change column order'>
                        <Button
                            aria-owns={orderButtonEl ? 'orderMenu' : undefined}
                            aria-haspopup="true"
                            onClick={event => this.setState({ orderButtonEl: event.currentTarget })}
                            id='footerOrderBtn'
                            size="medium"
                            color="primary"
                        >
                            Order
                        </Button>
                    </Tooltip>
                    <Menu
                        id="orderMenu"
                        anchorEl={orderButtonEl}
                        open={Boolean(orderButtonEl)}
                        onClose={() => this.setState({ orderButtonEl: null })}
                    >
                        <SortableList
                            items={columns}
                            onSortEnd={this.onSortEnd}
                            helperClass={'sortableHelper'}
                            dense={true}
                            styles={{ listItem: styles.sortableListItem }}
                        />
                    </Menu>
                </div>
                {showResetBtn &&
                    <Tooltip title='Default table configurations'>
                        <Button
                            onClick={this.props.onReset}
                            size="medium"
                            color="primary"
                        >
                            Reset
                        </Button>
                    </Tooltip>
                }
            </div>
        );
    }

    render() {
        const {
            page, pages, pageInputText, onPageChange, rowSize,
            rowSizeList, onRowSizeChange, handlePageInputUpdate,
            classes, exportCSV
        } = this.props;
        const { filterMode } = this.state;
        const range = [...Array(pages).keys()].map(k => (k + 1).toString());

        return (
            <Toolbar className={classes.footer} id='tableFooter'>

                { !this.props.renderCustomFilterInputs &&

                <div data-tut='footerConfigToolbar' className={classes.flex}>
                    <Tooltip title='Table configurations'>
                        <IconButton
                            size="medium"
                            onClick={this.onFilterClick}
                            id='footerConfigBtn'
                        >
                            <FilterIcon color={filterMode ? 'primary' : 'action'} />
                        </IconButton>
                    </Tooltip>
                    {this.renderFilterInputs(filterMode)}
                </div>
                }
                {
                    this.props.renderCustomFilterInputs && this.props.renderCustomFilterInputs()
                }

                {exportCSV && (
                    <div>
                    <IconButton
                            size="medium"
                            onClick={this.handleExpPopoverOpen}
                        >
                            <DownloadIcon />
                    </IconButton>

                    <Popover
                        id="mouse-over-popover"
                        classes={{
                            paper: classes.paper
                        }}
                        open={this.state.expPopoverOpen}
                        anchorEl={this.state.expPopoverEl}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                        }}
                        transformOrigin={{
                            vertical: 'bottom',
                            horizontal: 'center',
                        }}
                    >
                        <Box className={classes.buttondiv}>
                            <div>
                                Export as CSV
                            </div>

                            <Button
                                variant={"outlined"}
                                onClick={event => {this.handleExpCurrent()} }
                                id='loadAllBtn'
                                size="medium"
                                color="primary"
                            >
                                Export current table
                            </Button>
                            <Tooltip title='Limited to up to 10000 entries. It can take time and temporarily block or slow down the browser. User can export table after loading.'>
                            <Button
                                variant={"outlined"}
                                onClick={event => {this.handleExpAll()} }
                                id='loadAllBtn'
                                size="medium"
                                color="primary"
                            >
                                Load all rows
                            </Button>
                            </Tooltip>
                            <Button
                                variant={"outlined"}
                                onClick={event => {this.handleExpPopoverClose()} }
                                id='loadAllBtn'
                                size="medium"
                                color="primary"
                            >
                                Cancel
                            </Button>

                        </Box>
                    </Popover>
                    </div>
                    )

                }

                <div className={classes.footerItems}>

                    { !this.props.hideRowsPerPage && 

                        <div className={classes.rowsPerPage}>
                            <div>Rows per page:</div>
                        </div>
                    }

                    { !this.props.hideRowsPerPage && 
                        <TextField
                            id='footerRowSize'
                            select
                            value={rowSize}
                            className={classes.selectField}
                            InputProps={{ className: classes.textField }}
                            onChange={onRowSizeChange}
                        >
                            {rowSizeList.map((sizeItem, key) => {
                                return (
                                    <MenuItem
                                        key={key}
                                        value={sizeItem}
                                    >
                                        {sizeItem}
                                    </MenuItem>
                                );
                            })}
                        </TextField>
                    }

                    <Tooltip title='Page number'>
                        <AutoComplete
                            id='footerPageNumber'
                            placeholder={`Page ${page} of ${pages}`}
                            value={pageInputText}
                            suggestions={range}
                            onInputChange={handlePageInputUpdate}
                            onValueChange={onPageChange}
                            style={styles.autocomplete}
                            inputStyle={styles.autocompleteInput}
                        />
                    </Tooltip>

                    <div className={classes.footerActions}>
                        <Tooltip title='First page'>
                            <span>
                                <IconButton
                                    key={'first'}
                                    size="medium"
                                    onClick={() => onPageChange(1)}
                                    disabled={page === 1}
                                    id='footerFirstPageBtn'
                                >
                                    <FirstPageIcon />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title='Previous page'>
                            <span>
                                <IconButton
                                    key={'prev'}
                                    size="medium"
                                    onClick={() => onPageChange(page - 1)}
                                    disabled={page < 2}
                                    id='footerPrevPageBtn'
                                >
                                    <ChevronLeftIcon />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title='Next page'>
                            <span>
                                <IconButton
                                    key={'next'}
                                    size="medium"
                                    onClick={() => onPageChange(page + 1)}
                                    disabled={(pages - page) < 1}
                                    id='footerNextPageBtn'
                                >
                                    <ChevronRightIcon />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title='Last page'>
                            <span>
                                <IconButton
                                    key={'last'}
                                    size="medium"
                                    onClick={() => onPageChange(pages)}
                                    disabled={(pages - page) < 1}
                                    id='footerLastPageBtn'
                                >
                                    <LastPageIcon />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </div>
                </div>
            </Toolbar>
        );
    }
}

export default withStyles(styles)(Footer);
