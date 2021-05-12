import React, { PureComponent } from 'react';
import { withStyles } from '@material-ui/core/styles';
import {
    TableCell,
    TableHead,
    TableRow,
    TableSortLabel,
} from '@material-ui/core';
import Tooltip from '@material-ui/core/Tooltip';
import Checkbox from '@material-ui/core/Checkbox';
import katex from 'katex';

const styles = theme => ({
    tableHeader: {
        height: 34,
        fontSize: 13,
    },
    firstCell: {
        paddingTop: 4,
    },
    tableCell: {
        paddingRight: 10,
        paddingLeft: 10,
        '&:last-child': {
            paddingRight: 10,
        }
    },
    fixedTableCell: {
        backgroundColor: '#fff',
        verticalAlign: 'top',
        position: 'sticky',
        fontSize: 13.5,
        top: 0,
        zIndex: 10,
    },
    checkbox: {
        width: 24,
        height: 24,
        padding: 4,
        paddingTop: 0
    },
});

class Header extends PureComponent {

    handleSort = property => event => this.props.onSort(event, property);

    render() {
        const { columns, order, orderBy, classes } = this.props;
        if (!columns) return null;

        return (
            <TableHead>
                <TableRow className={classes.tableHeader}>
                    {columns.map((column, key) => {
                        if (column.hidden) return null;
                        const numeric = key === 0 ? false : column.numeric;
                        const tooltip = column.type === 'selection' ? 'check to show selected rows only' : '';
                        return (
                            <Tooltip key={key} title={column.description ? column.description : tooltip}>
                                <TableCell
                                    size="small"
                                    align={numeric ? "right" : "inherit"}
                                    style={'style' in column ? column.style : null}
                                    classes={{ root: key === 0 ? classes.firstCell : classes.tableCell }}
                                    className={classes.fixedTableCell}
                                    padding={key === 0 ? 'none' : 'default'}
                                >
                                    {column.type === 'selection' &&
                                        <Checkbox
                                            className={this.props.classes.checkbox}
                                            checked={this.props.headerChecked}
                                            onChange={event => this.props.onCheckboxClick()}
                                            disabled={this.props.checkboxDisabled ? true : false}
                                        />
                                    }
                                    {column.sortable &&
                                        <TableSortLabel
                                            active={orderBy === column.name}
                                            direction={order}
                                            onClick={this.handleSort(column.name)}
                                        >
                                            {column.label}
                                        </TableSortLabel>
                                    }
                                    {!column.sortable && (
                                        column.color_flag ?
                                            <div className={'rotate'}>{column.label}</div> : column.label
                                    )}

                                    {column.units && column.show_units && <div
                                        style={{ fontSize: 13 }}
                                        dangerouslySetInnerHTML={{ __html: katex.renderToString(column.units || '') }}
                                    />}
                                </TableCell>
                            </Tooltip>
                        );
                    })}
                </TableRow>
            </TableHead >
        );
    }
}

export default withStyles(styles)(Header);
