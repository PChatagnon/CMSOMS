import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import AutoComplete from '../generic/Autocomplete';
import AggWrapper from '../providers/AggWrapper';

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
    }, {
        attribute: 'l1_triggers_counter',
        operator: 'GT',
        value: 0
    }]
};

class L1CurrentRatesController extends Component {

    constructor() {
        super();
        this.timer = null;
        this.state = {
            runs: [],
            runsError: '',
            update: true,
        }
    }

    static controllerHeight = 220;

    static controllerInit(urlQuery) {

        let run = '', lastRun = '', props = {}, update = true;

        let initData = () => {
            return {
                data: { lastRun: lastRun },
                state: {
                    cms_run: run,
                    update: update,
                    props: props
                }
            }
        }

        return AggWrapper.fetch('runs', queryParams)
            .then(response => {
                const runs = response.data.data;
                lastRun = (runs.length > 0) ? runs[0].attributes.run_number : null;
                run = lastRun ? lastRun.toString() : null;

                // Props
                props = urlQuery && 'props' in urlQuery ? urlQuery.props : {};

                return initData();
            })
            .catch(err => initData());
    }

    static controllerURLQuery(query) {
        if (query.update) {
            delete query.cms_run;
        }
        return query;
    }

    static declareControllerURLParams() {
        return ["cms_run"]
    }

    static controllerQueryTitle(state) {
        return `Run: ${state.cms_run}`;
    }

    static controllerStateToQuery(state) {
        Object.keys(state).forEach(key => {
            if (!(['cms_run', 'update', 'props'].includes(key))) delete state[key];
        });
        return state;
    }

    componentDidMount() {
        this.toggleRunUpdate();
    }

    componentWillUnmount() {
        this.toggleRunUpdate(false);
    }

    toggleRunUpdate(toUpdate = this.props.controllerState.update) {
        if (toUpdate) {
            this.timer = setInterval(this.fetchLatestRun, 5500);
        } else {
            clearInterval(this.timer);
        }
    }

    fetchLatestRun = () => {
        if (!('lastRun' in this.props.controllerData)) return;

        return AggWrapper.fetch('runs', queryParams)
            .then(response => {
                const runs = response.data.data;
                const latestRun = (runs.length > 0) ? runs[0].attributes.run_number : null;

                let { controllerData, controllerState } = this.props;

                if (latestRun > controllerData.lastRun) {
                    controllerData.lastRun = latestRun;
                    controllerState.cms_run = latestRun;

                    this.props.updateQuery(controllerState, this.props.componentName, this.props.getSearch());
                    this.props.updateState(controllerState);
                    this.props.updateControllerData(controllerData);
                }
            });
    }

    render() {
        const { classes } = this.props;
        return (
            <div className={classes.container}>
                <AutoComplete
                    label='Run'
                    value={this.props.controllerState.cms_run.toString()}
                    suggestions={this.state.runs}
                    onInputChange={this.onRunUpdate}
                    onValueChange={this.onRunChange}
                />
            </div>
        );
    }
}
export default withStyles(styles)(L1CurrentRatesController);
