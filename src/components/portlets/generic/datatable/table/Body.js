import React, { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import { parse } from 'qs';
import { withStyles } from '@material-ui/core/styles';
import Checkbox from '@material-ui/core/Checkbox';
import LinearProgress from '@material-ui/core/LinearProgress';
import {
    TableBody,
    TableCell,
    TableRow,
} from '@material-ui/core';
import grey from '@material-ui/core/colors/grey';
import green from '@material-ui/core/colors/green';
import red from '@material-ui/core/colors/red';
import blue from '@material-ui/core/colors/blue';
import { prettyFloat } from '../../../../../utils/prettyUtils';
import { diffDatetime } from '../../../../../utils/dateUtils';
import { stringFormatter, toUrlQuery } from '../../../../../utils/utils';
import { getRowColumnScale } from './utils';
import katex from 'katex';
import { LinkWrapper } from '../../../../generic/ExtLink.js';

const styles = theme => ({
    tableRow: {
        height: 32,
    },
    aggRow: {
        height: 32,
        backgroundColor: grey[200],
    },
    selectableCell: {
        whiteSpace: 'nowrap',
        minWidth: 1,
    },
    tableCell: {
        whiteSpace: 'nowrap',
        paddingRight: 10,
        paddingLeft: 10,
        '&:last-child': {
            paddingRight: 10,
        }
    },
    tableVCell: {
        textAlign: 'left',
        paddingRight: theme.spacing(1),
        paddingLeft: theme.spacing(1),
        whiteSpace: 'nowrap'
    },
    tableVCellArray: {
        textAlign: 'left',
        paddingRight: theme.spacing(1),
        paddingLeft: theme.spacing(1),
        whiteSpace: 'normal',
        wordWrap: 'break-word'
    },
    checkbox: {
        width: 24,
        height: 24,
        padding: 4,
    },
    link: {
        color: theme.palette.primary.main
    },
    popover: {
        color: theme.palette.primary.main,
        cursor: 'pointer',
        textDecoration: 'underline'
    }
});

const FLOAT_PRECISION = 3; // digits after dot for float cells

class Body extends PureComponent {

    renderUnits = (column, row) => {
        // Use katex to display math formula on web
        // https://facebook.github.io/react/docs/dom-elements.html#dangerouslysetinnerhtml

        if (!column.show_units) return '';
        if (!row) return '';
        if (!this.props.vertical && column.units) return '';

        // Check if column unit is specified in the row meta
        const rowUnits = 'units' in row && column.name in row.units ? row.units[column.name].units : null;

        const units = !rowUnits && column.units ? column.units : rowUnits;
        if (!units) return '';

        return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(units) }} />;
    }

    renderScale = (column, row) => {
        if (!row) return '';

        const columnScale = getRowColumnScale(row, column);
        if (!columnScale) return '';
        return <span>10<sup style={{ fontSize: 9 }}>{columnScale}</sup></span>;
    }

    //TODO: remove String() once prescales will be flatten in l1algorithmtriggers
    renderCellData = (cellData, column, row, cellColor = null) => {
        if (cellColor) {
            return <div style={{color: cellColor}}>{String(cellData)} {cellData ? this.renderScale(column, row) : ''}{cellData !== null ? this.renderUnits(column, row) : ''}</div>;
        } else {
            return <div>{String(cellData)} {cellData ? this.renderScale(column, row) : ''}{cellData !== null ? this.renderUnits(column, row) : ''}</div>;
        }
    }

    renderCell = (rowData, column, row = null) => {
        if (!rowData) return <span />;
        if (column.color_flag) return <span>&nbsp;</span>;

        let cellData = rowData[column.name];
        if (cellData === "EMPTY_AGG_CELL") return <span />;

        const props = column.props ? column.props : null;
        const type = props ? props.type : column.type;

        switch (type) {

            case 'float':
            case 'fraction':
            case 'efficiency':
                const precision = props && props.ndigits ? props.ndigits : FLOAT_PRECISION;
                const cellValue = prettyFloat(cellData, precision);
                return this.renderCellData(cellValue, column, row);

            case 'range_link':
                const rangeValues = props.params ? props.params.map(param => rowData[param]) : [''];
                cellData = (rangeValues[0] && rangeValues[1])
                    ? `${rangeValues[0]} - ${rangeValues[1]}` : '';

            /* falls through */

            case 'link':
                if (cellData == null) return <span />;
                const linkValues = props.params ? props.params.map(param => rowData[param]) : [''];
                const href = stringFormatter(props.href, linkValues);
                return (
                    <div>
                        <LinkWrapper to={href}
                            target={props.target ? props.target : null}
                            className={this.props.classes.link}
                        >
                            <span>{cellData}</span>
                        </LinkWrapper> {cellData !== null ? this.renderUnits(column, row) : ''}
                    </div >
                );

            case 'cell_click':
                if (cellData == null) return <span />;
                const showLink = row.props && row.props[column.name] ? row.props[column.name].show_link : null;
                if (!showLink) return this.renderCellData(cellData, column, row);
                return (
                    <div>
                        <Link to={location => location} onClick={() => props.clickHandler(rowData)} className={this.props.classes.link}>
                            <span>{cellData}</span>
                        </Link> {cellData !== null ? this.renderUnits(column, row) : ''}
                    </div >
                );

            case 'link_click':
                if (cellData == null) return <span />;
                return (
                    <div>
                        <Link to={location => location} onClick={() => props.clickHandler(rowData)} className={this.props.classes.link}>
                            <span>{cellData}</span>
                        </Link> {cellData !== null ? this.renderUnits(column, row) : ''}
                    </div >
                );

            case 'link_query':
                if (cellData == null) return <span />;
                const queryValues = props.params.map(param => rowData[param]);
                const { query } = props;
                const newQuery = JSON.parse(stringFormatter(query, queryValues));
                return (
                    <div>
                        <Link className={this.props.classes.link}
                            target="_self"
                            to={location => ({
                                ...location,
                                query: query ? { ...(parse(location.search,{ ignoreQueryPrefix: true, allowDots: true })), ...newQuery } : {},
                                search: query ? toUrlQuery({ ...(parse(location.search,{ ignoreQueryPrefix: true, allowDots: true })), ...newQuery }) : '',
                                state:'resetApp'
                            })}
                        >
                            <span>{cellData}</span>
                        </Link> {cellData !== null ? this.renderUnits(column, row) : ''}
                    </div >
                );

            case 'duration':
                return <div>{cellData ? diffDatetime(0, cellData) : ''}</div>;

            case 'ratio':
                const parsedFloat = parseFloat(rowData[props.numeratorName]) / parseFloat(rowData[props.denominatorName]);
                return <div>{prettyFloat(parsedFloat, props.ndigits)}</div>;

            case 'link_array':
                const separator = (props && props.separator) ? props.separator : ', ';
                const lastIndex = cellData.length - 1;
                return <div style={{ whiteSpace: 'normal' }}>
                    {cellData.map((key, index) =>
                        <span key={key}>
                            <LinkWrapper to={stringFormatter(props.href, [key])} className={this.props.classes.link}>
                                {key}
                            </LinkWrapper>{index === lastIndex ? '' : separator}
                        </span>
                    )}
                </div>;

            case 'array':
                return <span>{cellData ? cellData.join((props && props.separator) ? props.separator : ', ') : ''}</span>;

            case 'boolean':
                return <span>{cellData ? 'True' : 'False'}</span>;

            case 'selection':
                return <Checkbox
                    className={this.props.classes.checkbox}
                    checked={this.isSelected(row.id)}
                    onChange={event => this.props.onRowClick(row.id)}
                    disableRipple
                    color='primary'
                />;

            case 'linear_progress':
                return <span>
                    {prettyFloat(cellData, 0)}%<br />
                    <LinearProgress variant="determinate" value={cellData} />
                </span>;

            case 'popover':
                return <span
                    className={this.props.classes.popover}
                    onClick={(event) => this.props.onPopover(event, row)}
                >
                    {props.label || this.renderCellData(cellData, column, row)}
                </span>;
            case 'html':
                return column.render(rowData);
                
            case 'colormap':
                const colorMap = props.colorMap ? props.colorMap : {};
                const cellValueCM = Array.isArray(cellData) ? cellData[0] : cellData;
                const cellStateCM = (Array.isArray(cellData) && cellData.length === 2) ? cellData[1] : 'default';
                const cellColor = (cellStateCM in colorMap)? colorMap[cellStateCM]: null;
                return this.renderCellData(cellValueCM, column, row, cellColor);

            default:
                return this.renderCellData(cellData, column, row);
        }
    }

    colorizeCell = cellData => {
        switch (cellData) {
            case false:
                return red[500];
            case true:
                return green[500];
            default:
                return grey[200];
        }
    }

    colorizeRow = cellData => {
        return blue[200];
    }

    renderRows = () => {
        const { data, columns, classes } = this.props;
        if (!data) return;
        return data.map((row, key) => {
            return (
                <TableRow
                    className={row.id === 'agg' ? classes.aggRow : classes.tableRow}
                    key={key}
                    tabIndex='-1'
                    hover
                    selected={this.isSelected(row.id)}
                    onClick={!this.props.onRowClick && this.props.onFullRowClick ? event => this.props.onFullRowClick(event, row.id) : undefined}
                    style = {this.props.onFullRowClick && this.isSelected(row.id) && columns.length ? {backgroundColor: this.colorizeRow()}: {} }
                >
                    {columns.map((column, key) => {
                        if (column.hidden) return null;
                        const numeric = key === 0 ? false : column.numeric;
                        return (
                            <TableCell
                                key={key}
                                size="small"
                                align={numeric ? "right" : "inherit"}
                                style={column.color_flag ? {
                                    backgroundColor: this.colorizeCell(row.attributes[column.name]),
                                    border: '1px solid #ccc'
                                } : {}}
                                classes={{
                                    root: key === 0 ? classes.selectableCell : classes.tableCell
                                }}
                                padding={key === 0 ? 'none' : 'default'}
                            >
                                {this.renderCell(row.attributes, column, row)}
                            </TableCell>
                        );
                    })}
                </TableRow>
            );
        });
    }

    renderVerticalRows = () => {
        const { data, columns, classes } = this.props;

        return columns.map((column, key) => {
            if (column.hidden) return null;
            const type = column.props ? column.props.type : null;
            return (
                <TableRow
                    className={classes.tableRow}
                    key={key}
                    tabIndex='-1'
                    hover
                >
                    <TableCell className={classes.tableVCell} size="small" style={'style' in column ? column.style : null}>
                        {column.label}
                    </TableCell>
                    {data.length > 0 &&
                        <TableCell
                            size="small"
                            className={type === 'array' ? classes.tableVCellArray : classes.tableVCell}
                            style={'valueStyle' in column ? column.valueStyle : null}
                        >
                            {this.renderCell(data[0].attributes, column, data[0])}
                        </TableCell>
                    }
                </TableRow>
            );
        });
    }

    isSelected = id => this.props.selected && this.props.selected.includes(id);

    render() {
        const { vertical } = this.props;
        return (
            <TableBody>
                {!vertical && this.renderRows()}
                {vertical && this.renderVerticalRows()}
            </TableBody>
        );
    }
}

export default withStyles(styles)(Body);
