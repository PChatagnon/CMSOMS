import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import AggProvider from '../providers/AggProvider';
import moment from 'moment';

const styles = {
    container: {
        marginTop: 20
    }
}

const queryParams = {
    page: 1, pagesize: 1,
    fields: ['run_number','last_lumisection_number', 'end_time', 'last_update'],
    filters: [{
        attribute: 'sequence',
        operator: 'EQ',
        value: 'GLOBAL-RUN'
    }],
    sorting: ['-run_number']
};

class CurrentRunController extends Component {

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

        let run = '', lastRun = '', lumisection = '', lastLS = '', props = {}, run_ended = false, update = true;

        let initData = () => {
            return {
                data: { lastRun: lastRun, lastLS: lastLS,
                    dt: -1, last_update: -1 },
                state: {
                    cms_run: run,
                    cms_ls: lumisection,
                    update: update,
                    run_ended: run_ended,
                    props: props
                }
            }
        }

        return AggProvider.fetch('runs', queryParams)
            .then(response => {
                const runs = response.data.data;
                lastRun = (runs.length > 0) ? runs[0].attributes.run_number : null;
                run = lastRun ? lastRun.toString() : null;
                lastLS = (runs.length > 0 && runs[0].attributes.number_of_lumisections > 0) ? runs[0].attributes.number_of_lumisections : 0;
                lumisection = lastLS ? lastLS.toString() : 0;
                run_ended = (runs.length > 0) ? runs[0].attributes.end_time != null : false;

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
        if (state.cms_ls > 0) {
            if (!state.run_ended)            
                return `Run: ${state.cms_run} Lumisection: ${state.cms_ls}`;
            else
                return `Run: ${state.cms_run} ended, Lumisection: ${state.cms_ls}`;
        }
        else
            return `Run: ${state.cms_run}`;
    }

    static controllerStateToQuery(state) {
        Object.keys(state).forEach(key => {
            if (!(['cms_run', 'cms_ls', 'update', 'props'].includes(key))) delete state[key];
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

        return AggProvider.fetch('runs', queryParams)
            .then(response => {
                const runs = response.data.data;
                const latestRun = (runs.length > 0) ? runs[0].attributes.run_number : null;
                const latestLS = (runs.length > 0 && runs[0].attributes.last_lumisection_number > 0) ? runs[0].attributes.last_lumisection_number : 0;

                let { controllerData, controllerState } = this.props;
                controllerState.run_ended = (runs.length > 0) ? runs[0].attributes.end_time != null : false;
                controllerData.last_update = runs[0].attributes.last_update;
                const date1 = moment.utc(controllerData.last_update);
                const date2 = moment.utc();
                controllerData.dt = moment.duration(date2.diff(date1)).asSeconds();

                if (latestRun > controllerData.lastRun || latestLS > controllerData.lastLS) {
                    controllerData.lastRun = latestRun;
                    controllerData.lastLS = latestLS;
                    
                    controllerState.cms_run = latestRun;
                    controllerState.cms_ls = latestLS;


                    this.props.updateQuery(controllerState, this.props.componentName, this.props.getSearch());
                    this.props.updateState(controllerState);
                    this.props.updateControllerData(controllerData);
                }
            });
    }

    render() {
        const { classes } = this.props;
        return (
            <div className={classes.root}>
              <div className={classes.textFieldContainer}
                style={{ marginLeft: 20, marginTop:20 }}>
                {this.props.controllerData.dt}
              </div>
            </div>
        );
    }
}
export default withStyles(styles)(CurrentRunController);
