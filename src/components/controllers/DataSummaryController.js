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
        minHeight: 290
    },
    groupContainer: {
        display: 'inline-block',
        minWidth: 460,
    },
    textFieldContainer: {
        minHeight: 80,
        display: 'flex',
        flexWrap: 'wrap',
    }
};

class DataSummaryController extends Component {

    state = {
        value: 'custom', //'last_24_hours',
        custom: true //false,
    };

    static controllerHeight = 425;

    static controllerInit(urlQuery) {

        const dateFrom = (urlQuery && 'datetime_from' in urlQuery) ?
            urlQuery.datetime_from :
            '2018-11-26T00:00:00Z'; //formatDatetimeURL(getCurrentDate().subtract(24, 'hours'));

        const dateTo = (urlQuery && 'datetime_to' in urlQuery) ?
            urlQuery.datetime_to :
            '2018-12-02T00:00:00Z'; //formatDatetimeURL(getCurrentDate());

        return Promise.resolve({
            state: {
                datetime_from: dateFrom,
                datetime_to: dateTo
            }
        });
    }

    static controllerQueryTitle(state) {
        return `Date Range: ${formatDatetimeString(state.datetime_from)}-${formatDatetimeString(state.datetime_to)}`;
    }

    static controllerStateToQuery(state) {
        Object.keys(state).forEach(key => {
            if (!(['datetime_from', 'datetime_to'].includes(key))) delete state[key];
        });
        return state;
    }

    onDateFromChange = date => {
        let { controllerState } = this.props;
        controllerState.datetime_from = formatDatetimeURL(moment(date).startOf('day'));
        this.props.updateState(controllerState);
    }

    onDateToChange = date => {
        let { controllerState } = this.props;
        controllerState.datetime_to = formatDatetimeURL(moment.utc(date).endOf('day'));
        this.props.updateState(controllerState);
    }

    onRadioChange = event => {
        const { value } = event.target;
        let dateFrom, dateTo = '';
        let custom = false;

        switch (value) {
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
            case 'wed_to_tues':
                dateFrom = getCurrentDate().day(-3).startOf('day');
                dateTo = getCurrentDate().day(2).endOf('day');
                break;
            case 'last_24_hours':
                dateFrom = getCurrentDate().subtract(24, 'hours');
                dateTo = getCurrentDate();
                break;
            case 'custom':
                custom = true;
                //dateFrom = getCurrentDate().startOf('day').subtract(24, 'hours');
                //dateTo = getCurrentDate().endOf('day');
                dateFrom = this.props.controllerState.datetime_from;
                dateTo = this.props.controllerState.datetime_to;
                break;
            default: return;
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
                        <FormControlLabel value="last_24_hours" control={<Radio color="primary" />} label="Last 24 hours" />
                        <FormControlLabel value="today" control={<Radio color="primary" />} label="Today (midnight to midnight)" />
                        <FormControlLabel value="last7" control={<Radio color="primary" />} label="Last 7AM to 7AM" />
                        <FormControlLabel value="one_week" control={<Radio color="primary" />} label="Current week (ISO week Monday to Sunday)" />
                        <FormControlLabel value="last_week" control={<Radio color="primary" />} label="Last week" />
                        <FormControlLabel value="wed_to_tues" control={<Radio color="primary" />} label="Wednesday to Tuesday" />
                        <FormControlLabel value="custom" control={<Radio color="primary" />} label="Custom" />
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
                </div>
            </div >
        );
    }
}

export default withStyles(styles)(DataSummaryController);