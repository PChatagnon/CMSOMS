import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import AutoComplete from '../generic/Autocomplete';
import DatePicker from '../generic/DatePicker';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import AggWrapper from '../providers/AggWrapper';
import { autocompleteFills, autocompleteRuns } from '../providers/AggDataAccess';
import { formatDate, getCurrentDate, toDateObject } from '../../utils/dateUtils';
import axios from 'axios';

const styles = {
    radioGroup: {
        float: 'left',
        maxWidth: 170,
        minWidth: 160,
    },
    radioButton: {
        marginTop: 36,
    },
    inputContainer: {
        display: 'inline-block',
        maxWidth: 450,
        minWidth: 400,
    },
    textField: {
        width: 200,
        fontSize: 14
    },
    inputField: {
        display: 'inline-block',
        marginLeft: 10,
        marginRight: 10,
        marginTop: 5,
        verticalAlign: 'top',
        width: 200,
    },
    autocomplete: {
        marginTop: 28
    }
};

const fillQueryParams = {
    page: 1, pagesize: 1,
    fields: ['fill_number'],
    include: ['turbo'],
    filters: [{
        attribute: 'stable_beams',
        operator: 'EQ',
        value: true
    }]
};

const runQueryParams = {
    page: 1, pagesize: 1,
    fields: ['run_number'],
    include: ['turbo'],
    filters: [{
        attribute: 'sequence',
        operator: 'EQ',
        value: 'GLOBAL-RUN'
    }]
};

class DeadtimesController extends Component {

    constructor() {
        super();
        this.state = {
            fillsFrom: [],
            fillsTo: [],
            fillFromError: '',
            fillToError: '',
            runsTo: [],
            runsFrom: [],
            runFromError: '',
            runToError: '',
        }
    }

    static controllerHeight = 370;

    static controllerInit(urlQuery) {

        let filterBy = 'cms_fillRange';
        let lastFill = '', fillFrom = '', fillTo = '';
        let runFrom = '', runTo = '', lastRun = '';
        let dateFrom, dateTo;

        let initData = () => {
            return {
                data: {
                    lastRun: lastRun,
                    lastFill: lastFill,
                },
                state: {
                    filterBy: filterBy,
                    cms_fill_to: fillTo,
                    cms_fill_from: fillFrom,
                    cms_date_to: dateTo,
                    cms_date_from: dateFrom,
                    cms_run_to: runTo,
                    cms_run_from: runFrom
                }
            }
        }

        return axios.all([
            AggWrapper.fetch('fills', fillQueryParams),
            AggWrapper.fetch('runs', runQueryParams),
        ]).then(axios.spread((fillsResp, runsResp) => {

            // Fill range
            const fills = fillsResp.data.data;
            lastFill = (fills.length > 0) ? fills[0].attributes.fill_number : null;

            if (urlQuery && 'cms_fill_from' in urlQuery && 'cms_fill_to' in urlQuery) {
                fillFrom = urlQuery.cms_fill_from;
                fillTo = urlQuery.cms_fill_to;
                filterBy = 'cms_fillRange';
            } else {
                fillTo = lastFill ? lastFill.toString() : null;
                fillFrom = lastFill ? (lastFill - 100).toString() : null;
            }

            // Run range
            const runs = runsResp.data.data;
            lastRun = (runs.length > 0) ? runs[0].attributes.run_number : null;

            if (urlQuery && 'cms_run_from' in urlQuery && 'cms_run_to' in urlQuery) {
                runFrom = urlQuery.cms_run_from;
                runTo = urlQuery.cms_run_to;
                filterBy = 'cms_runRange';
            } else {
                runTo = lastRun ? lastRun.toString() : 'null';
                runFrom = lastRun ? (lastRun - 100).toString() : 'null';
            }

            // Date range
            if (urlQuery && 'cms_date_from' in urlQuery && 'cms_date_to' in urlQuery) {
                dateFrom = urlQuery.cms_date_from;
                dateTo = urlQuery.cms_date_to;
                filterBy = 'cms_dateRange';
            } else {
                dateFrom = formatDate(getCurrentDate().subtract(10, 'days'));
                dateTo = formatDate(getCurrentDate());
            }

            return initData();
        }))
            .catch(err => initData());
    }

    static controllerStateToQuery(state) {
        switch (state.filterBy) {
            case 'cms_fillRange':
                Object.keys(state).forEach(key => {
                    if (!(['cms_fill_to', 'cms_fill_from'].includes(key))) delete state[key];
                });
                break;
            case 'cms_runRange':
                Object.keys(state).forEach(key => {
                    if (!(['cms_run_to', 'cms_run_from'].includes(key))) delete state[key];
                });
                break;
            case 'cms_dateRange':
                Object.keys(state).forEach(key => {
                    if (!(['cms_date_to', 'cms_date_from'].includes(key))) delete state[key];
                });
                break;
            default:
                break;
        }
        return state;
    }

    static controllerQueryTitle(state) {
        switch (state.filterBy) {
            case 'cms_fillRange':
                return `Fill Range: ${state.cms_fill_from}-${state.cms_fill_to}`
            case 'cms_runRange':
                return `Run Range: ${state.cms_run_from}-${state.cms_run_to}`;
            case 'cms_dateRange':
                return `Date Range: ${state.cms_date_from}-${state.cms_date_to}`;
            default:
                return 'Controller';
        }
    }

    onDateFromChange = date => {
        let { controllerState } = this.props;
        controllerState.cms_date_from = formatDate(date);
        this.props.updateState(controllerState);
    }

    onDateToChange = date => {
        let { controllerState } = this.props;
        controllerState.cms_date_to = formatDate(date);
        this.props.updateState(controllerState);
    }

    validateRun = (runString) => {
        const run = Number(runString);
        if (!run) return;

        const { lastRun } = this.props.controllerData;
        if (run > 0 && run <= lastRun) {
            return run;
        }
        return false;
    }

    updateRunFrom = run => {
        let { controllerState } = this.props;
        controllerState.cms_run_from = run;
        this.props.updateState(controllerState);
    }

    updateRunTo = run => {
        let { controllerState } = this.props;
        controllerState.cms_run_to = run;
        this.props.updateState(controllerState);
    }

    onRunFromChange = (searchText, index) => {
        const run = this.validateRun(searchText);
        if (!run) return;

        return this.updateRunFrom(run);
    }

    onRunToChange = (searchText, index) => {
        const run = this.validateRun(searchText);
        if (!run) return;

        return this.updateRunTo(run);
    }

    onRunFromUpdate = (searchText) => {
        if (searchText.trim() === '') return this.updateRunFrom('');

        const run = this.validateRun(searchText);
        if (!run) return; // this.setState({ runFromError: 'Please enter a valid Run number.' });

        this.updateRunFrom(run);
        autocompleteRuns(run).then(resp => {
            const runs = resp.data.data.attributes.autocompleteruns;
            this.setState({
                runsFrom: runs.map(run => run.toString()),
                runFromError: '',
            });
        });
    }

    onRunToUpdate = (searchText) => {
        if (searchText.trim() === '') return this.updateRunTo('');

        const run = this.validateRun(searchText);
        if (!run) return; // this.setState({ runToError: 'Please enter a valid Run number.' });

        this.updateRunTo(run);
        autocompleteRuns(run).then(resp => {
            const runs = resp.data.data.attributes.autocompleteruns;
            this.setState({
                runsTo: runs.map(run => run.toString()),
                runToError: '',
            });
        });
    }

    validateFill = (fillString) => {
        const fill = Number(fillString);
        if (!fill) return;

        const { lastFill } = this.props.controllerData;
        if (fill > 0 && fill <= lastFill) {
            return fill;
        }
        return false;
    }

    updateFillFrom = fill => {
        let { controllerState } = this.props;
        controllerState.cms_fill_from = fill;
        this.props.updateState(controllerState);
    }

    updateFillTo = fill => {
        let { controllerState } = this.props;
        controllerState.cms_fill_to = fill;
        this.props.updateState(controllerState);
    }

    onFillFromUpdate = (searchText) => {
        if (searchText.trim() === '') return this.updateFillFrom('');

        const fill = this.validateFill(searchText);
        if (!fill) return; // this.setState({ fillFromError: 'Please enter a valid Fill number.' });

        this.updateFillFrom(fill);
        autocompleteFills(fill).then(resp => {
            const fills = resp.data.data.attributes.autocompletefills;
            this.setState({
                fillsFrom: fills.map(f => f.toString()),
                fillFromError: '',
            });
        });
    }

    onFillToUpdate = (searchText) => {
        if (searchText.trim() === '') return this.updateFillTo('');

        const fill = this.validateFill(searchText);
        if (!fill) return; // this.setState({ fillToError: 'Please enter a valid Fill number.' });

        this.updateFillTo(fill);
        autocompleteFills(fill).then(resp => {
            const fills = resp.data.data.attributes.autocompletefills;
            this.setState({
                fillsTo: fills.map(f => f.toString()),
                fillToError: '',
            });
        });
    }

    onFillFromChange = (searchText, index) => {
        const fill = this.validateFill(searchText);
        if (!fill) return;

        return this.updateFillFrom(fill);
    }

    onFillToChange = (searchText, index) => {
        const fill = this.validateFill(searchText);
        if (!fill) return;

        return this.updateFillTo(fill);
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
                <FormControl component="fieldset">
                    <RadioGroup
                        name="filterBy"
                        className={classes.radioGroup}
                        value={filterBy}
                        onChange={this.onFilterChange}
                    >
                        <FormControlLabel value="cms_fillRange" control={<Radio color="primary" />} label="Fill Range" className={classes.radioButton} />
                        <FormControlLabel value="cms_runRange" control={<Radio color="primary" />} label="Run Range" className={classes.radioButton} />
                        <FormControlLabel value="cms_dateRange" control={<Radio color="primary" />} label="Date Range" className={classes.radioButton} />
                    </RadioGroup>
                </FormControl>

                <div className={classes.inputContainer}>
                    <AutoComplete
                        label='Fill Range: From'
                        value={this.props.controllerState.cms_fill_from.toString()}
                        disabled={filterBy !== 'cms_fillRange'}
                        suggestions={this.state.fillsFrom}
                        onInputChange={this.onFillFromUpdate}
                        onValueChange={this.onFillFromChange}
                        style={styles.autocomplete}
                        compact={true}
                    />
                    <AutoComplete
                        label='Fill Range: To'
                        value={this.props.controllerState.cms_fill_to.toString()}
                        disabled={filterBy !== 'cms_fillRange'}
                        suggestions={this.state.fillsTo}
                        onInputChange={this.onFillToUpdate}
                        onValueChange={this.onFillToChange}
                        style={styles.autocomplete}
                        compact={true}
                    />
                    <AutoComplete
                        label='Run Range: From'
                        value={this.props.controllerState.cms_run_from.toString()}
                        disabled={filterBy !== 'cms_runRange'}
                        suggestions={this.state.runsFrom}
                        onInputChange={this.onRunFromUpdate}
                        onValueChange={this.onRunFromChange}
                        style={styles.autocomplete}
                        compact={true}
                    />
                    <AutoComplete
                        label='Run Range: To'
                        value={this.props.controllerState.cms_run_to.toString()}
                        disabled={filterBy !== 'cms_runRange'}
                        suggestions={this.state.runsTo}
                        onInputChange={this.onRunToUpdate}
                        onValueChange={this.onRunToChange}
                        style={styles.autocomplete}
                        compact={true}
                    />
                    <DatePicker
                        disabled={filterBy !== 'cms_dateRange'}
                        onChange={this.onDateFromChange}
                        label='Date Range: From'
                        value={toDateObject(this.props.controllerState.cms_date_from)}
                    />
                    <DatePicker
                        disabled={filterBy !== 'cms_dateRange'}
                        onChange={this.onDateToChange}
                        label='Date Range: To'
                        value={toDateObject(this.props.controllerState.cms_date_to)}
                    />
                </div>
            </div>
        );
    }
}
export default withStyles(styles)(DeadtimesController);
