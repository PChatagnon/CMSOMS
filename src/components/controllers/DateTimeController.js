import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import DatePicker from '../generic/DatePicker';
import { ControllerPrevButton, ControllerNextButton } from './ControllerNav';
import { formatUTCDatetimeURL, formatDatetimeString, toDateObject, formatDatetimeURL, getCurrentDate } from '../../utils/dateUtils';
import moment from 'moment';

const styles = {
    root: {
        display: 'flex',
    },
    group: {
        height: 290,
    },
    groupContainer: {
        display: 'inline-block',
        minWidth: 200,
    },
    textFieldContainer: {
        height: 80,
        display: 'flex',
        flexWrap: 'wrap',
    }
};


class DateTimeController extends Component {

    labels = {
        last_24_hours: "Last 24 hours",
        today: "Today (midnight to midnight)",
        last7: "Last 7AM to 7AM",
        one_week: "Current week (ISO week Monday to Sunday)",
        last_week: "Last week",
        last_2_weeks: "Last 2 weeks",
        last_4_weeks: "Last 4 weeks",
        wed_to_tues: "Wednesday to Tuesday",
        custom: "Custom"
    };

    state = {
        value: 'custom', //'last_24_hours',
        custom: true //false,
    };

    constructor(props) {
        super();
        if (props.configuration.initial) {
            let { date_range } = props.configuration.initial;
            if (date_range) {
                this.state.value = date_range;
                this.state.custom = date_range === 'custom' ? true : false;
            }
        }
    }

    static allSelectors = []; // needed for static function controllerStateToQuery: stores all filters of all class instances

    static controllerHeight = 225;

    static controllerInit(urlQuery, controller) {
        let controllerState = {};
        let overrideUrlQuery = false;

        if (controller.configuration) {
            if (controller.configuration.filters) {
                controller.configuration.filters.forEach(filter => {
                    Object.keys(filter).forEach(key => {
                        if (key !== 'name') {
                            controllerState[key] = filter[key];
                        }
                    });
                });
            }

            if (controller.configuration.initial) {
                let { date_range, datetime_from, datetime_to, override } = controller.configuration.initial;
                if (date_range) {
                    if (date_range === 'custom') {
                        if (datetime_from)
                            controllerState.datetime_from = datetime_from;
                        if (datetime_to)
                            controllerState.datetime_to = datetime_to;
                    }
                    else {
                        let range = DateTimeController.getDateFromTo(date_range);
                        controllerState.datetime_from = formatDatetimeURL(range.dateFrom);
                        controllerState.datetime_to = formatDatetimeURL(range.dateTo);
                    }
                }
                if (override)
                    overrideUrlQuery = true;

            }
        }

        if (urlQuery && !overrideUrlQuery) {
            if ('datetime_from' in urlQuery)
                controllerState.datetime_from = urlQuery.datetime_from;

            if ('datetime_to' in urlQuery)
                controllerState.datetime_to = urlQuery.datetime_to;
        }

        if (!('datetime_from' in controllerState))
            controllerState.datetime_from = formatDatetimeURL(getCurrentDate().subtract(24, 'hours'));

        if (!('datetime_to' in controllerState))
            controllerState.datetime_to = formatDatetimeURL(getCurrentDate());

        // needed for static function controllerStateToQuery: allows all filters of all class instances in query
        Object.keys(controllerState).forEach(key => {
            if (!(key in DateTimeController.allSelectors))
                DateTimeController.allSelectors.push(key);
        });

        return Promise.resolve({ state: { ...controllerState } });
    }

    static controllerQueryTitle(state) {
        return `Date Range: ${formatDatetimeString(state.datetime_from)} -- ${formatDatetimeString(state.datetime_to)}`;
    }

    static controllerStateToQuery(state) {
        Object.keys(state).forEach(key => {
            if (!(DateTimeController.allSelectors.includes(key))) delete state[key];
        });
        return state;
    }

    static getDateFromTo(date_range) {
        let dateFrom, dateTo = '';

        switch (date_range) {
            case 'today':
                dateFrom = getCurrentDate().startOf('day');
                dateTo = getCurrentDate().endOf('day');
                break;
            case 'last7':
                dateFrom = getCurrentDate().startOf('day').add(7, 'hours').subtract(24, 'hours');
                dateTo = getCurrentDate().startOf('day').add(7, 'hours');
                break;
            case 'one_week':
                dateFrom = getCurrentDate().isoWeekday(1).startOf('day');
                dateTo = getCurrentDate().isoWeekday(7).endOf('day');
                break;
            case 'last_week':
                dateFrom = getCurrentDate().subtract(7, 'days');
                dateTo = getCurrentDate();
                break;
            case 'last_2_weeks':
                dateFrom = getCurrentDate().subtract(14, 'days');
                dateTo = getCurrentDate();
                break;
            case 'last_4_weeks':
                dateFrom = getCurrentDate().subtract(28, 'days');
                dateTo = getCurrentDate();
                break;
            case 'wed_to_tues':
                dateFrom = getCurrentDate().day(-3).startOf('day');
                dateTo = getCurrentDate().day(2).endOf('day');
                break;
            case 'last_24_hours':
            default:
                dateFrom = getCurrentDate().subtract(24, 'hours');
                dateTo = getCurrentDate();
                break;
        }
        return { dateFrom: dateFrom, dateTo: dateTo };
    }

    onDateFromChange = date => {
        let { controllerState } = this.props;
        const from = moment.utc(date).endOf('day');
        controllerState.datetime_from = formatDatetimeURL(from);
        const to = moment.utc(controllerState.datetime_to);
        if (from > to)
            controllerState.datetime_to = formatDatetimeURL(from)
        this.props.updateState(controllerState);
    }

    onDateToChange = date => {
        let { controllerState } = this.props;
        const to = moment.utc(date).endOf('day');
        controllerState.datetime_to = formatDatetimeURL(to);
        const from = moment.utc(controllerState.datetime_from);
        if (from > to)
            controllerState.datetime_from = formatDatetimeURL(to)
        this.props.updateState(controllerState);
    }

    onRadioChange = event => {
        const { value } = event.target;
        let dateFrom, dateTo = '';
        let custom = false;

        if (value === 'custom') {
            custom = true;
            dateFrom = this.props.controllerState.datetime_from;
            dateTo = this.props.controllerState.datetime_to;
        }
        else {
            let range = DateTimeController.getDateFromTo(value);
            dateFrom = range.dateFrom
            dateTo = range.dateTo;
        }

        this.setState({ value: value, custom: custom });

        let { controllerState } = this.props;
        controllerState.datetime_from = formatUTCDatetimeURL(dateFrom);
        controllerState.datetime_to = formatUTCDatetimeURL(dateTo);
        this.props.updateState(controllerState);
    }

    shiftDate = (selector, side) => {
        let { controllerState } = this.props;
        const dateObj = moment.utc(controllerState[selector])
            .add(side === 'next' ? 1 : -1, 'days');

        controllerState[selector] = formatUTCDatetimeURL(dateObj);
        this.props.updateState(controllerState);
    }


    renderRadioButtons = () => {
        let { radio_buttons } = this.props.configuration;
        if (!radio_buttons)
            radio_buttons = ['custom'];
        return radio_buttons.reduce((accu, button) => {
            if (button in this.labels && button !== 'custom')
                accu.push(<FormControlLabel value={button} key={button} control={<Radio color="primary" />} label={this.labels[button]} />)
            return accu;
        }, []);
    }

    renderConfiguredFilter() {
        if (!this.props.configuration.filters)
            return '';

        let filterMessage = 'Configured Filter:\n'
        this.props.configuration.filters.forEach(filter => {
            Object.keys(filter).forEach(key => {
                if (key === 'name')
                    filterMessage += filter[key];
                else {
                    switch (key) {
                        case 'value_from':
                            filterMessage += ' >= ' + filter[key];
                            break;
                        case 'value_to':
                            filterMessage += ' <= ' + filter[key];
                            break;
                        case 'value_equals':
                            filterMessage += ' = ' + filter[key];
                            break;
                        default:
                            filterMessage += ' ? ' + filter[key];
                    }
                }
            });
        });
        return filterMessage;
    }

    render() {
        const { classes } = this.props;
        return (
            <div className={classes.root}>
                <FormControl component="fieldset" margin="dense" className={classes.groupContainer}>
                    <RadioGroup
                        name="datetimes"
                        className={classes.group}
                        value={this.state.value}
                        onChange={this.onRadioChange}
                    >
                        {this.renderRadioButtons()}
                    </RadioGroup>
                </FormControl>
                <FormControl component="fieldset" margin="dense" className={classes.groupContainer}>
                    <RadioGroup
                        name="datetimes"
                        className={classes.group}
                        value={this.state.value}
                        onChange={this.onRadioChange}
                    >
                        <FormControlLabel value='custom' key='custom' control={<Radio color="primary" />} label={this.labels['custom']} labelPlacement="start" />
                    </RadioGroup>
                </FormControl>
                <div className={classes.textFieldContainer}>
                    <ControllerPrevButton
                        handleClick={() => this.shiftDate('datetime_from', 'prev')}
                        title='Previous day'
                        disabled={!this.state.custom}
                        style={{ marginTop: 20 }}
                    />
                    <DatePicker
                        disabled={!this.state.custom}
                        onChange={this.onDateFromChange}
                        label='Date Range: From'
                        value={toDateObject(this.props.controllerState.datetime_from)}
                        styles={{ marginTop: 0 }}
                    />
                    <ControllerNextButton
                        handleClick={() => this.shiftDate('datetime_from', 'next')}
                        title='Next day'
                        disabled={!this.state.custom}
                        style={{ marginTop: 20 }}
                    />
                </div>
                <div className={classes.textFieldContainer}>
                    <ControllerPrevButton
                        handleClick={() => this.shiftDate('datetime_to', 'prev')}
                        title='Previous day'
                        disabled={!this.state.custom}
                        style={{ marginTop: 20 }}
                    />
                    <DatePicker
                        disabled={!this.state.custom}
                        onChange={this.onDateToChange}
                        label='Date Range: To'
                        value={toDateObject(this.props.controllerState.datetime_to)}
                        styles={{ marginTop: 0 }}
                    />
                    <ControllerNextButton
                        handleClick={() => this.shiftDate('datetime_to', 'next')}
                        title='Next day'
                        disabled={!this.state.custom}
                        style={{ marginTop: 20 }}
                    />
                    <div className={classes.textFieldContainer}
                        style={{ marginLeft: 20, marginTop:20 }}
                    >
                        {this.renderConfiguredFilter()}
                    </div>
                </div>
            </div >
        );
    }
}

export default withStyles(styles)(DateTimeController);
