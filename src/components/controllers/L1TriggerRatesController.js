import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import AutoComplete from '../generic/Autocomplete';
import AggWrapper from '../providers/AggWrapper';
import { ControllerPrevButton, ControllerNextButton } from './ControllerNav';
import { autocompleteRuns, shiftRun } from '../providers/AggDataAccess';
import { Radio, RadioGroup, FormControl, FormControlLabel } from '@material-ui/core';

const styles = {
    container: {
        marginTop: 20
    },
    radioButton: {
        marginTop: 8,
        marginLeft: 0,
        minWidth: 200,
    },
    inputContainer: {
        display: 'inline-block',
        maxWidth: 450,
        minWidth: 400,
    },
    groupContainer: {
        display: 'inline-block',
        minWidth: 200,
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
    }, {
        attribute: 'l1_triggers_counter',
        operator: 'GT',
        value: 0
    }]
};

class L1TriggerRatesController extends Component {

    constructor() {
        super();
        this.timer = null;
        this.state = {
            runs: [],
            runsError: '',
        }
    }

    static controllerHeight = 300;

    static controllerInit(urlQuery, controller, clearProps, propsToReplace = {}) {

        let run = '', lastRun = '', props = {};
        let filterBy = 'cms_fullrun';
        let lsFrom = null, lsTo = null;

        let initData = () => {
            if (clearProps)
                props = propsToReplace
            return {
                data: { lastRun: lastRun },
                state: {
                    filterBy: filterBy,
                    cms_run: run,
                    cms_ls_from: lsFrom,
                    cms_ls_to: lsTo,
                    props: props
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

                lsFrom = lsTo = null;
                filterBy = 'cms_fullrun';
                // LS mode and range (by default full run)
                /*
                if (urlQuery && 'cms_ls_from' in urlQuery && 'cms_ls_to' in urlQuery) {
                    lsFrom = urlQuery.cms_ls_from;
                     lsTo = urlQuery.cms_ls_to;
                     filterBy = 'cms_lumisectionrange';
                }
                */

                // Props
                props = urlQuery && 'props' in urlQuery ? urlQuery.props : {};

                return initData();
            })
            .catch(err => initData());
    }

    static declareControllerURLParams() {
        //return ['cms_run', 'cms_ls_from', 'cms_ls_to']
        return ['cms_run']
    }

    static controllerQueryTitle(state) {
        return `Run: ${state.cms_run}`;
    }

    static controllerStateToQuery(state) {
        switch (state.filterBy) {
            case 'cms_fullrun':
                Object.keys(state).forEach(key => {
                    if (!(['cms_run', 'props'].includes(key))) delete state[key];
                });
                break;
            case 'cms_lumisectionrange':
                Object.keys(state).forEach(key => {
                    if (!(['cms_run', 'cms_ls_from', 'cms_ls_to', 'props'].includes(key))) delete state[key];
                    //if (!(['cms_run', 'props'].includes(key))) delete state[key];
                });
                break;
            default:
                break;
        }
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
        if (controllerState.cms_run !== run) {
            controllerState.filterBy = "cms_fullrun";
            controllerState.cms_ls_from = null;
            controllerState.cms_ls_to = null;
        }
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

    validateLS = lsString => {
        const ls = Number(lsString);
        if (!ls) return;

        //const { lastLS } = this.props.controllerData;
        //if (ls > 0 && fill <= lastLS) {
        if (ls > 0) {
            return ls;
        }
        return false;
    }

    updateLSFrom = ls => {
        let { controllerState } = this.props;
        controllerState.cms_ls_from = ls;
        this.props.updateState(controllerState);
    }

    updateLSTo = ls => {
        let { controllerState } = this.props;
        controllerState.cms_ls_to = ls;
        this.props.updateState(controllerState);
    }

    onLSFromChange = (searchText, index) => {
        const ls = this.validateLS(searchText);
        if (!ls) return;

        return this.updateLSFrom(ls);
    }

    onLSToChange = (searchText, index) => {
        const ls = this.validateLS(searchText);
        if (!ls) return;

        return this.updateLSTo(ls);
    }

    onLSFromUpdate = searchText => {
        if (searchText.trim() === '') return this.updateLSFrom('');

        const ls = this.validateLS(searchText);
        if (!ls) return; // this.setState({ lsFromError: 'Please enter a valid Fill number.' });

        this.updateLSFrom(ls);
    }

    onLSToUpdate = searchText => {
        if (searchText.trim() === '') return this.updateLSTo('');

        const ls = this.validateLS(searchText);
        if (!ls) return; // this.setState({ lsToError: 'Please enter a valid Fill number.' });

        this.updateLSTo(ls);
    }

    onFilterChange = (event, value) => {
        let { controllerState } = this.props;
        controllerState.filterBy = value;
        this.props.updateState(controllerState);
    }

    render() {
        const { filterBy } = this.props.controllerState;
        const { classes } = this.props;
        return (
            <div>
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

                <FormControl component="fieldset" margin="dense" className={classes.groupContainer}>
                    <RadioGroup
                        name="filterBy"
                        value={filterBy}
                        onChange={this.onFilterChange}
                    >
                        <FormControlLabel value="cms_fullrun" control={<Radio color="primary" />} label="Full Run" className={classes.radioButton} />
                        <FormControlLabel value="cms_lumisectionrange" control={<Radio color="primary" />} label="Lumisection Range" className={classes.radioButton}/>
                    </RadioGroup>
                </FormControl>
                <div className={classes.inputContainer}>
                    <br/>
                    <br/>
                    <br/>
                    <div>
                        <AutoComplete
                            label='Lumisection: From'
                            value={this.props.controllerState.cms_ls_from ? this.props.controllerState.cms_ls_from.toString(): ''}
                            disabled={filterBy !== 'cms_lumisectionrange'}
                            suggestions={[]}
                            onInputChange={this.onLSFromUpdate}
                            onValueChange={this.onLSFromChange}
                            style={styles.autocomplete}
                            compact={true}
                        />
                        <AutoComplete
                            label='Lumisection: To'
                            value={this.props.controllerState.cms_ls_to ? this.props.controllerState.cms_ls_to.toString(): ''}
                            disabled={filterBy !== 'cms_lumisectionrange'}
                            suggestions={[]}
                            onInputChange={this.onLSToUpdate}
                            onValueChange={this.onLSToChange}
                            style={styles.autocomplete}
                            compact={true}
                        />
                    </div>
                </div>
            </div>
        );
    }
}
export default withStyles(styles)(L1TriggerRatesController);
