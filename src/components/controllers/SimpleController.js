import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
//import MenuItem from '@material-ui/core/MenuItem';

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

class SimpleController extends Component {

    static controllerHeight = 210;

    static controllerInit(urlQuery, controller) {
        let state = {};
        controller.selectors.forEach(selector => {
            state[selector.name] = undefined;
        });
        if (urlQuery) {
            //const keys = Object.keys(urlQuery);
            Object.keys(state).forEach(key => {
                if (key in state)
                    state[key] = urlQuery[key];
            });
        }

        return Promise.resolve({
            state: state
        });
    }

    static controllerQueryTitle(state) {
        let title = '';
        Object.keys(state).forEach(key => {
            title += key + ': ' + state[key] + '  ';
        });
        return title;
    }

    static controllerStateToQuery(state) {
        /* don't know selector(s) here. No idea what to delete from state
        Object.keys(state).forEach(key => {
            if (!(['trigger_version'].includes(key))) delete state[key];
        });
        // Remove Version selector if ALL is selected
        if (state.trigger_version === 'ALL') {
            delete state.trigger_version;
        }
        */
        return state;
    }

    onCurrentChange = event => {
        let { controllerState } = this.props;
        controllerState[Object.keys(controllerState)[0]] = event.target.value;
        this.props.updateState(controllerState);
    }



    render() {
        const { classes } = this.props;
        const label = Object.keys(this.props.controllerState)[0];
        return (
            <div className={classes.container}>
                <TextField
                    label={label}
                    defaultValue={this.props.controllerState[label]}
                    onChange={this.onCurrentChange}
                >
                </TextField>
            </div>
        );
    }
}

export default withStyles(styles)(SimpleController);
