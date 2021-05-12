import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';

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

class TriggerModesController extends Component {

    static controllerHeight = 210;

    static controllerInit(urlQuery) {
        let trigger_version = '1';

        if (urlQuery && 'trigger_version' in urlQuery) {
            trigger_version = urlQuery.trigger_version;
        }

        return Promise.resolve({
            state: {
                trigger_version: trigger_version
            }
        });
    }

    static controllerQueryTitle(state) {
        const version = state.trigger_version === 'ALL' ? 'All' : 'Current';
        return `Version: ${version}`;
    }

    static controllerStateToQuery(state) {
        Object.keys(state).forEach(key => {
            if (!(['trigger_version'].includes(key))) delete state[key];
        });
        // Remove Version selector if ALL is selected
        if (state.trigger_version === 'ALL') {
            delete state.trigger_version;
        }
        return state;
    }

    onCurrentChange = event => {
        let { controllerState } = this.props;
        controllerState.trigger_version = event.target.value;
        this.props.updateState(controllerState);
    }

    render() {
        const { classes } = this.props;
        return (
            <div className={classes.container}>
                <TextField
                    select
                    label="Trigger Version"
                    value={this.props.controllerState.trigger_version}
                    className={classes.selectField}
                    InputProps={{ className: classes.textField }}
                    onChange={this.onCurrentChange}
                    SelectProps={{
                        MenuProps: {
                            className: classes.itemMenu,
                        },
                    }}
                >
                    <MenuItem value={'1'}>Current</MenuItem>
                    <MenuItem value={'ALL'}>All</MenuItem>
                </TextField>
            </div>
        );
    }
}

export default withStyles(styles)(TriggerModesController);
