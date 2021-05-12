import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import AutoComplete from '../generic/Autocomplete';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import AggWrapper from '../providers/AggWrapper';
import { ControllerPrevButton, ControllerNextButton } from './ControllerNav';
import { autocompleteRuns, shiftRun } from '../providers/AggDataAccess';

const styles = {
    container: {
        marginTop: 20
    },
    textField: {
        width: 300,
        fontSize: 14
    },
    itemMenu: {
        width: 300,
    },
    selectField: {
        marginTop: 2,
        width: 300,
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

class L1AlgoTriggerReportController extends Component {

    static controllerHeight = 220;

    constructor() {
        super();
        this.state = {
            runs: [],
            runsError: '',
        }
        this.searchValueTimer = undefined;
    }

    static controllerInit(urlQuery) {

        let run = '', lastRun = '';
        let bit = '0', bitName = '', bits = [];

        let initData = () => {
            return {
                data: {
                    lastRun: lastRun,
                    bits: bits,
                    fetching: false
                },
                state: {
                    cms_run: run,
                    cms_l1_bit: bit,
                    cms_l1_bit_name: bitName
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

                const params = {
                    fields: ['name', 'bit'],
                    page: 1, pagesize: 1000,
                    sorting: ['bit'],
                    group: { key: 'granularity', value: 'run' },
                    filters: [{
                        attribute: 'run_number',
                        operator: 'EQ',
                        value: run
                    }]
                };
                return AggWrapper.fetch('l1algorithmtriggers', params)
                    .then(resp => {
                        bits = resp.data.data;

                        // Bit
                        if (urlQuery && 'cms_l1_bit' in urlQuery) {
                            bit = urlQuery.cms_l1_bit;
                            if ('cms_l1_bit_name' in urlQuery)
                                bitName = urlQuery.cms_l1_bit_name;
                        } else {
                            bit = (bits.length > 0) ? bits[0].attributes.bit.toString() : '0';
                            bitName = (bits.length > 0) ? bits[0].attributes.name : '';
                        }
                        return initData();
                    })
                    .catch(err => initData());
            })
            .catch(err => initData());
    }

    static controllerQueryTitle(state) {
        return `Run: ${state.cms_run}, Bit ${state.cms_l1_bit} - ${state.cms_l1_bit_name}`;
    }

    static controllerStateToQuery(state) {
        Object.keys(state).forEach(key => {
            if (!(['cms_run', 'cms_l1_bit', 'cms_l1_bit_name'].includes(key))) delete state[key];
        });
        return state;
    }

    findBitName = (bit_str) => {
        const bit = Number(bit_str);
        const { bits } = this.props.controllerData;
        if (bits.length > bit) {
            if (bits[bit].attributes.bit === bit)
                return bits[bit].attributes.name;
        }
        const i = bits.findIndex(row => row.attributes.bit === bit); 
        if (i >= 0)
            return bits[i].attributes.name;    
        return '';
    }

    fetchTriggerNames = (run) => {
        this.props.updateControllerData({
            ...this.props.controllerData,
            fetching: true
        });

        const params = {
            fields: ['name', 'bit'],
            sorting: ['bit'],
            group: { key: 'granularity', value: 'run' },
            filters: [{
                attribute: 'run_number',
                operator: 'EQ',
                value: run
            }]
        };
        return AggWrapper.fetch('l1algorithmtriggers', params)
            .then(resp => this.updateBits(resp.data.data));
    }

    validateRun = (runString) => {
        const run = Number(runString);
        if (!run) return;
        return (run > 0) ? run : false;
    }

    updateRun = run => {
        let { controllerState } = this.props;
        controllerState.cms_run = run;
        this.props.updateState(controllerState);
    }

    onRunChange = (searchText, index) => {
        clearTimeout(this.searchValueTimer);

        const run = this.validateRun(searchText);
        if (!run) return this.updateBits([]);

        this.fetchTriggerNames(run)
            .then(() => this.updateRun(run));
    }

    onRunUpdate = (searchText) => {
        clearTimeout(this.searchValueTimer);
        if (searchText.trim() === '') return this.updateRun('');

        const run = this.validateRun(searchText);
        if (!run) return; // this.setState({ runsError: 'Please enter a valid Run number.' });

        this.updateRun(run);
        this.searchValueTimer = setTimeout(() => this.onRunChange(run), 1500);

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

    onBitChange = event => {
        this.props.updateState({
            ...this.props.controllerState,
            cms_l1_bit: event.target.value,
            cms_l1_bit_name: this.findBitName(event.target.value)
        });
    }

    updateBits = (bits) => {
        this.props.updateControllerData({
            ...this.props.controllerData,
            fetching: false,
            bits
        });

        this.props.updateState({
            ...this.props.controllerState,
            cms_l1_bit: (bits.length > 0) ? bits[0].attributes.bit.toString() : '0',
            cms_l1_bit_name: (bits.length > 0) ? bits[0].attributes.name : ''
        });
    }

    renderBits = () => {
        const { bits } = this.props.controllerData;
        if (!bits.length) {
            return <MenuItem value={'0'}>None</MenuItem>
        }

        return bits.map((algo, bindex) => {
            algo = algo.attributes;
            return <MenuItem value={algo.bit.toString()} key={bindex}>{`Bit (${algo.bit}) ${algo.name}`}</MenuItem>
        });
    }

    render() {
        if (!this.props.controllerState) {
            return (<div></div>);
        }
        const { classes } = this.props;
        return (
            <div className={classes.container}>
                <ControllerPrevButton handleClick={() => this.runShift('left')} />
                <AutoComplete
                    label='Run'
                    disabled={this.props.controllerData.fetching}
                    value={this.props.controllerState.cms_run.toString()}
                    suggestions={this.state.runs}
                    onInputChange={this.onRunUpdate}
                    onValueChange={this.onRunChange}
                />
                <ControllerNextButton handleClick={() => this.runShift('right')} />
                <TextField
                    select
                    disabled={this.props.controllerData.fetching}
                    label="Bit"
                    value={this.props.controllerState.cms_l1_bit}
                    className={classes.selectField}
                    InputProps={{ className: classes.textField }}
                    onChange={this.onBitChange}
                    SelectProps={{
                        MenuProps: {
                            className: classes.itemMenu,
                        },
                    }}
                >
                    {this.renderBits()}
                </TextField>
            </div>
        );
    }
}
export default withStyles(styles)(L1AlgoTriggerReportController);