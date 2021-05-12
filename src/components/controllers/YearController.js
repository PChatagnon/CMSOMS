import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import { getCurrentDate } from '../../utils/dateUtils';

const styles = {
    container: {
        marginTop: 20
    },
    selectField: {
        marginRight: 20,
        display: 'inline-block',
        verticalAlign: 'top',
        fontSize: 14,
        width: 200,
    },
    selectFieldMenu: {
        fontSize: 13,
        minHeight: 28,
        lineHeight: '28px'
    },
    textField: {
        width: 200,
        fontSize: 14
    }
}

const RUNTIME_TYPES = ['PROTONS', 'PROTONS_IONS', 'IONS'];

class YearController extends Component {

    static controllerHeight = 210;

    static controllerInit(urlQuery) {

        let year;
        let runtime_type;

        if (urlQuery) {
            if ('year' in urlQuery) {
                year = Number(urlQuery.year);
            }
            if ('runtime_type' in urlQuery && RUNTIME_TYPES.includes(urlQuery.runtime_type)) {
                runtime_type = urlQuery.runtime_type;
            }
        }

        if (!year) { year = getCurrentDate().year(); }
        if (!runtime_type) { runtime_type = RUNTIME_TYPES[0] }

        return Promise.resolve({
            state: {
                year: year,
                runtime_type: runtime_type
            }
        });
    }

    static controllerQueryTitle(state) {
        return `Year ${state.year} : ${state.runtime_type}`;
    }

    static controllerStateToQuery(state) {
        Object.keys(state).forEach(key => {
            if (!(['year', 'runtime_type'].includes(key))) delete state[key];
        });
        return state;
    }

    onRuntimeTypeChange = event => {
        let { controllerState } = this.props;
        controllerState.runtime_type = event.target.value;
        this.props.updateState(controllerState);
    }

    onYearChange = event => {
        let { controllerState } = this.props;
        controllerState.year = event.target.value;
        this.props.updateState(controllerState);
    }

    renderYears = () => {
        const years = [];
        for (let i = getCurrentDate().year(); i >= 2010; i--) {
            years.push(<MenuItem value={i} key={i}>{`Year ${i}`}</MenuItem>);
        }
        return years;
    }

    renderRuntimeTypes = () => {
        return RUNTIME_TYPES.map((runtime_type, index) =>
            <MenuItem value={runtime_type} key={index}>{runtime_type}</MenuItem>
        );
    }

    render() {
        const { classes } = this.props;
        return (
            <div className={classes.container}>
                <TextField
                    select
                    label="Year"
                    value={this.props.controllerState.year}
                    className={classes.selectField}
                    InputProps={{ className: classes.textField }}
                    onChange={this.onYearChange}
                    SelectProps={{
                        MenuProps: {
                            className: classes.itemMenu,
                        },
                    }}
                >
                    {this.renderYears()}
                </TextField>
                <TextField
                    select
                    label="Runtime Type"
                    value={this.props.controllerState.runtime_type}
                    className={classes.selectField}
                    InputProps={{ className: classes.textField }}
                    onChange={this.onRuntimeTypeChange}
                    SelectProps={{
                        MenuProps: {
                            className: classes.itemMenu,
                        },
                    }}
                >
                    {this.renderRuntimeTypes()}
                </TextField>
            </div>
        );
    }
}
export default withStyles(styles)(YearController);
