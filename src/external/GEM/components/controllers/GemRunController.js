import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import AutoComplete from '../../../../components/generic/Autocomplete';
import AggProvider from '../../../../components/providers/AggProvider';
import { ControllerPrevButton, ControllerNextButton } from '../../../../components/controllers/ControllerNav';


const styles = {
    container: {
        marginTop: 20
    }
}



class GemRunController extends Component {

    constructor(props) {
        super();
        this.state = {
            runs: [],
            runsError: '',
        }
    }

    static controllerHeight = 220;

    // these are the 2 functions retrieving info from the database. The rest is mainly a copy of the core run controller
    autocompleteRuns = (run) => {
        const queryParams = {
            page: 1,
            pagesize: 20,   // LIKE operator returns also runs which do not start with the given number but have this number anywhere in the run number
                            // just a guess that pagesize of 20 returns at least 5 runs which start with the given number
            fields: [this.props.configuration.runNumberAttribute],
            filters: [{
                attribute: this.props.configuration.runNumberAttribute,
                operator: 'LIKE',
                value: run
            }],
            sorting: []
        };
        if (this.props.configuration.sortHelperAttribute)
            queryParams.sorting.push(this.props.configuration.sortHelperAttribute);
        queryParams.sorting.push(this.props.configuration.runNumberAttribute)
        if (this.props.configuration.aggpath)
            queryParams.aggpath = this.props.configuration.aggpath;

        return AggProvider.fetch(this.props.configuration.runListEndpoint, queryParams);
    }

    shiftRun = (run, side = 'right') => {
        if (run === '') return Promise.resolve();

        const queryParams = {
            page: 1,
            pagesize: 1,
            fields: [this.props.configuration.runNumberAttribute],
            filters: [{
                attribute: this.props.configuration.runNumberAttribute,
                operator: side === 'right' ? 'GT' : 'LT',
                value: run
            }],
            sorting: [(side === 'right' ? '' : '-') + this.props.configuration.runNumberAttribute]
        };
        if (this.props.configuration.aggpath)
            queryParams.aggpath = this.props.configuration.aggpath;

        return AggProvider.fetch(this.props.configuration.runListEndpoint, queryParams)
            .then(response => {
                const runs = response.data.data;
                return (runs.length > 0) ? runs[0].attributes.run_number : null;
            });
    }



    static controllerInit(urlQuery, controller) {

        let run = '', lastRun = '';

        let initData = () => {
            return {
                data: { lastRun: lastRun },
                state: {
                    gem_run: run
                }
            }
        }
        
        if (urlQuery && 'gem_run' in urlQuery) {
            run = urlQuery.gem_run;
            return Promise.resolve( initData() );
        }

        const queryParams = {
            page: 1,
            pagesize: 1,
            sorting: ['-' + controller.configuration.runNumberAttribute]
        };
        if ( controller.configuration.aggpath )
            queryParams.aggpath = controller.configuration.aggpath;
        return AggProvider.fetch(controller.configuration.runListEndpoint, queryParams)
            .then(response => {
                const runs = response.data.data;
                lastRun = (runs.length > 0) ? runs[0].attributes.run_number : null;
                run = lastRun ? lastRun.toString() : null;

                return initData();
            })
            .catch(err => initData());
    }

    static controllerQueryTitle(state) {
        return `Run: ${state.gem_run}`;
    }

    static controllerStateToQuery(state) {
        Object.keys(state).forEach(key => {
            if (!(['gem_run'].includes(key))) delete state[key];
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
        controllerState.gem_run = run;
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
        this.autocompleteRuns(run).then(resp => {
            let runs = [];
            resp.data.data.forEach(row => {
                let runString = row.attributes[this.props.configuration.runNumberAttribute].toString();
                if (runs.length < 5 && runString.startsWith(run.toString()) && !runs.includes(runString))
                    runs.push(runString);
            });
            this.setState({
                runs: runs.map(run => run.toString()),
                runsError: '',
            });
        });
    }



    runShift = (side) => {
        const { gem_run } = this.props.controllerState;
        this.shiftRun(gem_run, side).then(resp => this.onRunChange(resp));
    }

    render() {
        const { classes } = this.props;
        return (
            <div className={classes.container}>
                <ControllerPrevButton handleClick={() => this.runShift('left')} />
                <AutoComplete
                    label='Run'
                    value={this.props.controllerState.gem_run.toString()}
                    suggestions={this.state.runs}
                    onInputChange={this.onRunUpdate}
                    onValueChange={this.onRunChange}
                />
                <ControllerNextButton handleClick={() => this.runShift('right')} />
            </div>
        );
    }
}
export default withStyles(styles)(GemRunController);
