import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import AutoComplete from '../generic/Autocomplete';
import AggWrapper from '../providers/AggWrapper';
import { ControllerPrevButton, ControllerNextButton } from './ControllerNav';
import { autocompleteFills, shiftFill } from '../providers/AggDataAccess';

const styles = {
    container: {
        marginTop: 20
    }
}

const queryParams = {
    page: 1, pagesize: 1,
    fields: ['fill_number'],
    include: ['turbo'],
    filters: [{
        attribute: 'stable_beams',
        operator: 'EQ',
        value: true
    }]
};

class FillReportController extends Component {

    static controllerHeight = 220;

    constructor() {
        super();
        this.state = {
            fills: [],
            fillsError: ''
        }
    }

    static controllerInit(urlQuery) {

        let fill = '', lastFill = '';

        let initData = () => {
            return {
                data: { lastFill: lastFill },
                state: {
                    cms_fill: fill,
                }
            }
        }

        return AggWrapper.fetch('fills', queryParams)
            .then(response => {
                const fills = response.data.data;
                lastFill = (fills.length > 0) ? fills[0].attributes.fill_number : null;

                // Fill
                if (urlQuery && 'cms_fill' in urlQuery) {
                    fill = urlQuery.cms_fill;
                } else {
                    fill = lastFill ? lastFill.toString() : null;
                }

                return initData();
            })
            .catch(err => initData());
    }

    static controllerStateToQuery(state) {
        Object.keys(state).forEach(key => {
            if (!(['cms_fill'].includes(key))) delete state[key];
        });
        return state;
    }

    static controllerQueryTitle(state) {
        return `Fill: ${state.cms_fill}`;
    }

    validateFill = fillString => {
        const fill = Number(fillString);
        if (!fill) return;

        if (fill > 0) {
            return fill;
        }
        return false;
    }

    updateFill = fill => {
        let { controllerState } = this.props;
        controllerState.cms_fill = fill;
        this.props.updateState(controllerState);
    }

    onFillChange = (searchText, index) => {
        const fill = this.validateFill(searchText);
        if (!fill) return;

        return this.updateFill(fill);
    }

    onFillUpdate = (searchText) => {
        if (searchText.trim() === '') return this.updateFill('');

        const fill = this.validateFill(searchText);
        if (!fill) return; //this.setState({ fillsError: 'Please enter a valid Fill number.' });

        this.updateFill(fill);
        autocompleteFills(fill).then(resp => {
            const fills = resp.data.data.attributes.autocompletefills;
            this.setState({
                fills: fills.map(f => f.toString()),
                fillsError: '',
            });
        });
    }

    fillShift = (side) => {
        const { cms_fill } = this.props.controllerState;
        shiftFill(cms_fill, side).then(resp => this.onFillChange(resp));
    }

    render() {
        const { classes } = this.props;
        return (
            <div className={classes.container}>
                <ControllerPrevButton handleClick={() => this.fillShift('left')} />
                <AutoComplete
                    label='Fill'
                    value={this.props.controllerState.cms_fill.toString()}
                    suggestions={this.state.fills}
                    onInputChange={this.onFillUpdate}
                    onValueChange={this.onFillChange}
                />
                <ControllerNextButton handleClick={() => this.fillShift('right')} />
            </div>
        );
    }
}
export default withStyles(styles)(FillReportController);