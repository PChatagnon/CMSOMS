import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import AutoComplete from '../generic/Autocomplete';
import DatePicker from '../generic/DatePicker';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import FormGroup from '@material-ui/core/FormGroup';
import Checkbox from '@material-ui/core/Checkbox';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import AggWrapper from '../providers/AggWrapper';
import { formatDate, getCurrentDate, toDateObject } from '../../utils/dateUtils';
import { autocompleteFills, autocompleteRuns } from '../providers/AggDataAccess';
import axios from 'axios';

const styles = {
    radioGroup: {
        float: 'left',
        maxWidth: 170,
        minWidth: 160,
    },
    radioButton: {
        marginTop: 36
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
        width: 200
    },
    autocomplete: {
        marginTop: 28
    },
    itemMenu: {
        width: 200,
    },
    selectField: {
        marginTop: 14,
        width: 200
    },
    checkboxContainer: {
        verticalAlign: 'top',
        maxWidth: 170,
        minWidth: 130,
        marginTop: 10
    },
    checkbox: {
        paddingTop: 2,
        paddingBottom: 1,
        '&&:hover': {
            backgroundColor: 'transparent',
        },
    },
    optionsContainer: {
        marginLeft: 30,
        marginTop: 15,
        display: 'inline-block',
        verticalAlign: 'top',
        maxWidth: 600,
        minWidth: 300
    }
};

class RunSummaryController extends Component {

    constructor() {
        super();
        this.state = {
            runsTo: [],
            runsFrom: [],
            runFromError: '',
            runToError: '',
            fills: [],
            fillsError: '',
        }
    }

    static controllerHeight = 370;

    static controllerInit(urlQuery) {

        // Default radio filter button
        let filterBy = 'cms_runRange';
        let sequences = [];
        let fill = '', lastFill = '';
        let runFrom = '', runTo = '', lastRun = '';
        let dateFrom, dateTo;
        let props = {};

        let sequence = 'GLOBAL-RUN';
        let runProps = {
            cms_run_castor: false,
            cms_run_csc: false,
            cms_run_ctpps_tot: false,
            cms_run_daq: false,
            cms_run_dcs: false,
            cms_run_dqm: false,
            cms_run_dt: false,
            cms_run_ecal: false,
            cms_run_es: false,
            cms_run_hcal: false,
            cms_run_hf: false,
            cms_run_pixel: false,
            cms_run_pixel_up: false,
            cms_run_rpc: false,
            cms_run_scal: false,
            cms_run_tcds: false,
            cms_run_tracker: false,
            cms_run_trg: false,
            cms_run_gem: false
        }

        let initData = () => {
            return {
                data: {
                    lastRun: lastRun,
                    lastFill: lastFill,
                    sequences: sequences
                },
                state: {
                    filterBy: filterBy,
                    cms_fill: fill,
                    cms_run_to: runTo,
                    cms_run_from: runFrom,
                    cms_date_to: dateTo,
                    cms_date_from: dateFrom,
                    cms_run_sequence: sequence,
                    runProps: runProps,
                    props: props
                }
            }
        }

        return axios.all([
            AggWrapper.fetch('fills', { page: 1, pagesize: 1, fields: ['fill_number'], include: ['turbo'] }),
            AggWrapper.fetch('runs', { page: 1, pagesize: 1, fields: ['run_number'], include: ['turbo'] }),
            AggWrapper.fetch('runs/sequences', { page: 1, pagesize: 1000, include: ['turbo'] }),
        ]).then(axios.spread((fillsResp, runsResp, seqResp) => {

            // Fill
            const fills = fillsResp.data.data;
            lastFill = (fills.length > 0) ? fills[0].attributes.fill_number : null;

            if (urlQuery && 'cms_fill' in urlQuery) {
                fill = urlQuery.cms_fill;
                filterBy = 'cms_fill';
            } else {
                fill = lastFill ? lastFill.toString() : null;
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
                dateFrom = formatDate(getCurrentDate().subtract(1, 'month'));
                dateTo = formatDate(getCurrentDate());
            }

            // Filter
            if (urlQuery && 'filter' in urlQuery) {
                filterBy = urlQuery.filter;
            }

            // Sequences
            sequences = seqResp.data.data.attributes.sequences;

            // Components included into Run, sequence
            Object.keys(runProps).forEach(key => {
                if (urlQuery && key in urlQuery) {
                    runProps[key] = urlQuery[key].toLowerCase() === 'true' ? true : false;
                }
            });

            if (urlQuery && 'cms_run_sequence' in urlQuery) {
                sequence = urlQuery.cms_run_sequence;
            } else {
                sequence = 'GLOBAL-RUN';
            }

            // Props
            props = urlQuery && 'props' in urlQuery ? urlQuery.props : {};

            return initData();
        }))
            .catch(err => initData());
    }

    static controllerStateToQuery(state) {
        switch (state.filterBy) {
            case 'cms_fill':
                Object.keys(state).forEach(key => {
                    if (!(['cms_fill', 'cms_run_sequence', 'runProps', 'props'].includes(key))) delete state[key];
                });
                break;
            case 'cms_runRange':
                Object.keys(state).forEach(key => {
                    if (!(['cms_run_to', 'cms_run_from', 'cms_run_sequence', 'runProps', 'props'].includes(key))) delete state[key];
                });
                break;
            case 'cms_dateRange':
                Object.keys(state).forEach(key => {
                    if (!(['cms_date_to', 'cms_date_from', 'cms_run_sequence', 'runProps', 'props'].includes(key))) delete state[key];
                });
                break;
            default:
                break;
        }
        // Removes properties which are False
        Object.entries(state.runProps).forEach(([key, value]) => {
            delete state.runProps[key];
            if (value) state[key] = value;
        });
        delete state.runProps;

        // Remove sequence selector if 'any' is selected
        if (state.cms_run_sequence === 'any') {
            delete state.cms_run_sequence;
        }

        return state;
    }

    static controllerQueryTitle(state) {
        switch (state.filterBy) {
            case 'cms_fill':
                return `Fill: ${state.cms_fill}`;
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
        if (!run) return;

        this.updateRunFrom(run);
        const { cms_run_sequence } = this.props.controllerState;
        const seq = cms_run_sequence === 'any' ? null : cms_run_sequence;
        autocompleteRuns(run, seq).then(resp => {
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
        if (!run) return;

        this.updateRunTo(run);
        const { cms_run_sequence } = this.props.controllerState;
        const seq = cms_run_sequence === 'any' ? null : cms_run_sequence;
        autocompleteRuns(run, seq).then(resp => {
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

    updateFill = fill => {
        let { controllerState } = this.props;
        controllerState.cms_fill = fill;
        this.props.updateState(controllerState);
    }

    onFillUpdate = (searchText) => {
        if (searchText.trim() === '') return this.updateFill('');

        const fill = this.validateFill(searchText);
        if (!fill) return; // this.setState({ fillsError: 'Please enter a valid Fill number.' });

        this.updateFill(fill);
        autocompleteFills(fill).then(resp => {
            const fills = resp.data.data.attributes.autocompletefills;
            this.setState({
                fills: fills.map(f => f.toString()),
                fillsError: '',
            });
        });
    }

    onFillChange = (searchText, index) => {
        const fill = this.validateFill(searchText);
        if (!fill) return;

        return this.updateFill(fill);
    }

    onFilterChange = (event, value) => {
        let { controllerState } = this.props;
        controllerState.filterBy = value;
        this.props.updateState(controllerState);
    }

    onRunPropsChange = name => event => {
        let { controllerState } = this.props;
        controllerState.runProps[name] = event.target.checked;
        this.props.updateState(controllerState);
    }

    onSequenceChange = event => {
        let { controllerState } = this.props;
        const { value } = event.target;
        controllerState.cms_run_sequence = value;
        this.props.updateState(controllerState);
    }

    renderSequences = () => {
        return this.props.controllerData.sequences.map((seq, index) =>
            <MenuItem value={seq} key={index}>{seq}</MenuItem>
        );
    }

    render() {
        const { filterBy, runProps } = this.props.controllerState;
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
                        <FormControlLabel value="cms_fill" control={<Radio color="primary" />} label="Fill" className={classes.radioButton} />
                        <FormControlLabel value="cms_runRange" control={<Radio color="primary" />} label="Run Range" className={classes.radioButton} />
                        <FormControlLabel value="cms_dateRange" control={<Radio color="primary" />} label="Date Range" className={classes.radioButton} />
                    </RadioGroup>
                </FormControl>

                <div className={classes.inputContainer}>
                    <AutoComplete
                        label='Fill'
                        value={this.props.controllerState.cms_fill.toString()}
                        disabled={filterBy !== 'cms_fill'}
                        suggestions={this.state.fills}
                        onInputChange={this.onFillUpdate}
                        onValueChange={this.onFillChange}
                        style={styles.autocomplete}
                        compact={true}
                    />
                    <div>
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
                    </div>
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
                <div className={classes.optionsContainer}>
                    <FormLabel component="legend">Components Online Status</FormLabel>
                    <FormControl component="fieldset">
                        <FormGroup className={classes.checkboxContainer}>
                            <FormControlLabel
                                label="Castor"
                                control={
                                    <Checkbox
                                        color="primary"
                                        checked={runProps.cms_run_castor}
                                        onChange={this.onRunPropsChange('cms_run_castor')}
                                        className={classes.checkbox}
                                        disableRipple
                                    />
                                }
                            />
                            <FormControlLabel
                                label="CSC"
                                control={
                                    <Checkbox
                                        color="primary"
                                        checked={runProps.cms_run_csc}
                                        onChange={this.onRunPropsChange('cms_run_csc')}
                                        className={classes.checkbox}
                                        disableRipple
                                    />
                                }
                            />
                            <FormControlLabel
                                label="CTPPS_TOT"
                                control={
                                    <Checkbox
                                        color="primary"
                                        checked={runProps.cms_run_ctpps_tot}
                                        onChange={this.onRunPropsChange('cms_run_ctpps_tot')}
                                        className={classes.checkbox}
                                        disableRipple
                                    />
                                }
                            />
                            <FormControlLabel
                                label="DAQ"
                                control={
                                    <Checkbox
                                        color="primary"
                                        checked={runProps.cms_run_daq}
                                        onChange={this.onRunPropsChange('cms_run_daq')}
                                        className={classes.checkbox}
                                        disableRipple
                                    />
                                }
                            />
                            <FormControlLabel
                                label="SCAL"
                                control={
                                    <Checkbox
                                        color="primary"
                                        checked={runProps.cms_run_scal}
                                        onChange={this.onRunPropsChange('cms_run_scal')}
                                        className={classes.checkbox}
                                        disableRipple
                                    />
                                }
                            />
                        </FormGroup>
                    </FormControl>

                    <FormControl component="fieldset">
                        <FormGroup className={classes.checkboxContainer}>
                            <FormControlLabel
                                label="PIXEL"
                                control={
                                    <Checkbox
                                        color="primary"
                                        checked={runProps.cms_run_pixel}
                                        onChange={this.onRunPropsChange('cms_run_pixel')}
                                        className={classes.checkbox}
                                        disableRipple
                                    />
                                }
                            />
                            <FormControlLabel
                                label="PIXEL_UP"
                                control={
                                    <Checkbox
                                        color="primary"
                                        checked={runProps.cms_run_pixel_up}
                                        onChange={this.onRunPropsChange('cms_run_pixel_up')}
                                        className={classes.checkbox}
                                        disableRipple
                                    />
                                }
                            />
                            <FormControlLabel
                                label="RPC"
                                control={
                                    <Checkbox
                                        color="primary"
                                        checked={runProps.cms_run_rpc}
                                        onChange={this.onRunPropsChange('cms_run_rpc')}
                                        className={classes.checkbox}
                                        disableRipple
                                    />
                                }
                            />
                            <FormControlLabel
                                label="DQM"
                                control={
                                    <Checkbox
                                        color="primary"
                                        checked={runProps.cms_run_dqm}
                                        onChange={this.onRunPropsChange('cms_run_dqm')}
                                        className={classes.checkbox}
                                        disableRipple
                                    />
                                }
                            />
                            <FormControlLabel
                                label="TRACKER"
                                control={
                                    <Checkbox
                                        color="primary"
                                        checked={runProps.cms_run_tracker}
                                        onChange={this.onRunPropsChange('cms_run_tracker')}
                                        className={classes.checkbox}
                                        disableRipple
                                    />
                                }
                            />
                        </FormGroup>
                    </FormControl>

                    <FormControl component="fieldset">
                        <FormGroup className={classes.checkboxContainer}>
                            <FormControlLabel
                                label="HCAL"
                                control={
                                    <Checkbox
                                        color="primary"
                                        checked={runProps.cms_run_hcal}
                                        onChange={this.onRunPropsChange('cms_run_hcal')}
                                        className={classes.checkbox}
                                        disableRipple
                                    />
                                }
                            />
                            <FormControlLabel
                                label="ECAL"
                                control={
                                    <Checkbox
                                        color="primary"
                                        checked={runProps.cms_run_ecal}
                                        onChange={this.onRunPropsChange('cms_run_ecal')}
                                        className={classes.checkbox}
                                        disableRipple
                                    />
                                }
                            />
                            <FormControlLabel
                                label="GEM"
                                control={
                                    <Checkbox
                                        color="primary"
                                        checked={runProps.cms_run_gem}
                                        onChange={this.onRunPropsChange('cms_run_gem')}
                                        className={classes.checkbox}
                                        disableRipple
                                    />
                                }
                            />
                            <FormControlLabel
                                label="ES"
                                control={
                                    <Checkbox
                                        color="primary"
                                        checked={runProps.cms_run_es}
                                        onChange={this.onRunPropsChange('cms_run_es')}
                                        className={classes.checkbox}
                                        disableRipple
                                    />
                                }
                            />
                            <FormControlLabel
                                label="HF"
                                control={
                                    <Checkbox
                                        color="primary"
                                        checked={runProps.cms_run_hf}
                                        onChange={this.onRunPropsChange('cms_run_hf')}
                                        className={classes.checkbox}
                                        disableRipple
                                    />
                                }
                            />
                        </FormGroup>
                    </FormControl>

                    <FormControl component="fieldset">
                        <FormGroup className={classes.checkboxContainer}>
                            <FormControlLabel
                                label="DT"
                                control={
                                    <Checkbox
                                        color="primary"
                                        checked={runProps.cms_run_dt}
                                        onChange={this.onRunPropsChange('cms_run_dt')}
                                        className={classes.checkbox}
                                        disableRipple
                                    />
                                }
                            />
                            <FormControlLabel
                                label="TRG"
                                control={
                                    <Checkbox
                                        color="primary"
                                        checked={runProps.cms_run_trg}
                                        onChange={this.onRunPropsChange('cms_run_trg')}
                                        className={classes.checkbox}
                                        disableRipple
                                    />
                                }
                            />
                        </FormGroup>
                    </FormControl>

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
            </div>
        );
    }
}
export default withStyles(styles)(RunSummaryController);
