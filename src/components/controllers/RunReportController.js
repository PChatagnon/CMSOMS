import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import AutoComplete from '../generic/Autocomplete';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import AggWrapper from '../providers/AggWrapper';
import { ControllerPrevButton, ControllerNextButton } from './ControllerNav';
import { autocompleteRuns, shiftRun } from '../providers/AggDataAccess';
import axios from 'axios';

const styles = {
    container: {
        marginTop: 20
    },
    textField: {
        width: 200,
        fontSize: 14
    },
    itemMenu: {
        width: 200,
    },
    selectField: {
        marginTop: 2,
        width: 200,
        marginLeft: 40,
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

class RunReportController extends Component {

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
        let sequences = [];
        let sequence = 'GLOBAL-RUN';

        let initData = () => {
            return {
                data: {
                    lastRun: lastRun,
                    sequences: sequences
                },
                state: {
                    cms_run: run,
                    cms_run_sequence: sequence,
                }
            }
        }

        return axios.all([
            AggWrapper.fetch('runs', queryParams),
            AggWrapper.fetch('runs/sequences', { page: 1, pagesize: 1000, include: ['turbo'] }),
        ]).then(axios.spread((runsResp, seqResp) => {

            const runs = runsResp.data.data;
            lastRun = (runs.length > 0) ? runs[0].attributes.run_number : null;

            // Run (by default last run)
            if (urlQuery && 'cms_run' in urlQuery) {
                run = urlQuery.cms_run;
            } else {
                run = lastRun ? lastRun.toString() : null;
            }

            // Sequences
            sequences = seqResp.data.data.attributes.sequences;

            if (urlQuery && 'cms_run_sequence' in urlQuery) {
                sequence = urlQuery.cms_run_sequence;
            } else {
                sequence = 'GLOBAL-RUN';
            }

            return initData();
        }))
            .catch(err => initData());
    }

    static controllerQueryTitle(state) {
        return `Run: ${state.cms_run}`;
    }

    static controllerStateToQuery(state) {
        Object.keys(state).forEach(key => {
            if (!(['cms_run', 'cms_run_sequence'].includes(key))) delete state[key];
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
        const { cms_run_sequence } = this.props.controllerState;
        autocompleteRuns(run, cms_run_sequence).then(resp => {
            const runs = resp.data.data.attributes.autocompleteruns;
            this.setState({
                runs: runs.map(run => run.toString()),
                runsError: '',
            });
        });
    }

    runShift = (side) => {
        const { cms_run, cms_run_sequence } = this.props.controllerState;
        shiftRun(cms_run, side, cms_run_sequence).then(resp => this.onRunChange(resp));
    }

    onSequenceChange = event => {
        let { controllerState } = this.props;
        const { value } = event.target;
        controllerState.cms_run_sequence = value === 'any' ? null : value;
        this.props.updateState(controllerState);
    }

    renderSequences = () => {
        return this.props.controllerData.sequences.map((seq, index) =>
            <MenuItem value={seq} key={index}>{seq}</MenuItem>
        );
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
                <TextField
                    select
                    label="Sequence"
                    value={this.props.controllerState.cms_run_sequence || 'any'}
                    className={classes.selectField}
                    InputProps={{ className: classes.textField }}
                    onChange={this.onSequenceChange}
                    SelectProps={{
                        MenuProps: {
                            className: classes.itemMenu,
                        },
                    }}
                >
                    <MenuItem value={'any'}>Any</MenuItem>
                    {this.renderSequences()}
                </TextField>
            </div>
        );
    }
}
export default withStyles(styles)(RunReportController);