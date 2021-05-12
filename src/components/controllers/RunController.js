import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import AutoComplete from '../generic/Autocomplete';
import AggWrapper from '../providers/AggWrapper';
import { ControllerPrevButton, ControllerNextButton } from './ControllerNav';
import { autocompleteRuns, shiftRun } from '../providers/AggDataAccess';

const styles = {
    container: {
        marginTop: 20
    }
}

const queryParams = {
    page: 1, pagesize: 1,
    fields: ['run_number'],
    include: ['turbo'],
    filters: [{
        attribute: 'sequence',
        operator: 'EQ',
        value: 'GLOBAL-RUN'
    }]
};

class RunController extends Component {

    constructor() {
        super();
        this.state = {
            runs: [],
            runsError: '',
        }
    }

    static controllerHeight = 220;

    static controllerInit(urlQuery) {

        let run = '', lastRun = '';

        let initData = () => {
            return {
                data: { lastRun: lastRun },
                state: {
                    cms_run: run
                }
            }
        }

        return AggWrapper.fetch('runs', queryParams)
            .then(response => {
                const runs = response.data.data;
                lastRun = (runs.length > 0) ? runs[0].attributes.run_number : null;

                // Run (by default last run)
                if (urlQuery && 'cms_run' in urlQuery) {
                    run = urlQuery.cms_run;
                } else {
                    run = lastRun ? lastRun.toString() : null;
                }

                return initData();
            })
            .catch(err => initData());
    }

    static controllerQueryTitle(state) {
        return `Run: ${state.cms_run}`;
    }

    static controllerStateToQuery(state) {
        Object.keys(state).forEach(key => {
            if (!(['cms_run'].includes(key))) delete state[key];
        });
        return state;
    }

    validateRun = (runString) => {
        const run = Number(runString);
        if (!run) return;

        if (run > 0) {
            return run;
        }
        return false;
    }

    updateRun = run => {
        let { controllerState } = this.props;
        controllerState.cms_run = run;
        this.props.updateState(controllerState);
    }

    onRunChange = (searchText, index) => {
        const run = this.validateRun(searchText);
        if (!run) return;

        return this.updateRun(run);
    }

    onRunUpdate = (searchText) => {
        if (searchText.trim() === '') return this.updateRun('');

        const run = this.validateRun(searchText);
        if (!run) return; // this.setState({ runsError: 'Please enter a valid Run number.' });

        this.updateRun(run);
        autocompleteRuns(run).then(resp => {
            const runs = resp.data.data.attributes.autocompleteruns;
            this.setState({
                runs: runs.map(run => run.toString()),
                runsError: '',
            });
        });
    }

    runShift = (side) => {
        const { cms_run } = this.props.controllerState;
        shiftRun(cms_run, side).then(resp => this.onRunChange(resp));
    }

    render() {
        const { classes } = this.props;
        return (
            <div className={classes.container}>
                <ControllerPrevButton handleClick={() => this.runShift('left')} />
                <AutoComplete
                    label='Run'
                    value={this.props.controllerState.cms_run.toString()}
                    suggestions={this.state.runs}
                    onInputChange={this.onRunUpdate}
                    onValueChange={this.onRunChange}
                />
                <ControllerNextButton handleClick={() => this.runShift('right')} />
            </div>
        );
    }
}
export default withStyles(styles)(RunController);