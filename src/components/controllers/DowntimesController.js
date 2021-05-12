import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import AutoComplete from '../generic/Autocomplete';
import DatePicker from '../generic/DatePicker';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import AggWrapper from '../providers/AggWrapper';
import { formatDate, getCurrentDate, toDateObject } from '../../utils/dateUtils';
import { autocompleteFills } from '../providers/AggDataAccess';
import axios from 'axios';

const styles = {
    radioGroup: {
        float: 'left',
        maxWidth: 170,
        minWidth: 160
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
        width: 200,
    },
    autocomplete: {
        marginTop: 28
    },
    checkboxContainer: {
        verticalAlign: 'top',
        display: 'inline-block',
        maxWidth: 250,
        minWidth: 200,
    },
    itemMenu: {
        width: 200,
    },
    selectField: {
        marginTop: 30,
        width: 200,
        marginLeft: 40,
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

class DowntimesController extends Component {

    constructor() {
        super();
        this.state = {
            fillsFrom: [],
            fillsTo: [],
            fillFromError: '',
            fillToError: ''
        }
    }

    static controllerHeight = 320;

    static controllerInit(urlQuery) {

        let filterBy = 'cms_fillRange';
        let lastFill = '', fillFrom = '', fillTo = '';
        let dateFrom, dateTo;
        let downtimeGroup = 'ALL';
        let downtimeGroups = [];

        let initData = () => {
            return {
                data: {
                    lastFill: lastFill,
                    downtimeGroups: downtimeGroups
                },
                state: {
                    filterBy: filterBy,
                    cms_fill_to: fillTo,
                    cms_fill_from: fillFrom,
                    cms_date_to: dateTo,
                    cms_date_from: dateFrom,
                    cms_downtime_group: downtimeGroup
                }
            }
        }

        return axios.all([
            AggWrapper.fetch('fills', fillQueryParams),
            AggWrapper.fetch('downtimes/groups', { page: 1, pagesize: 1000, include: ['turbo'] })
        ]).then(axios.spread((fillsResp, groupsResp) => {

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

            // Date range
            if (urlQuery && 'cms_date_from' in urlQuery && 'cms_date_to' in urlQuery) {
                dateFrom = urlQuery.cms_date_from;
                dateTo = urlQuery.cms_date_to;
                filterBy = 'cms_dateRange';
            } else {
                dateFrom = formatDate(getCurrentDate().subtract(10, 'days'));
                dateTo = formatDate(getCurrentDate());
            }

            // Downtime Group
            downtimeGroups = 'attributes' in groupsResp.data.data ? groupsResp.data.data.attributes.groups : [];
            downtimeGroups.unshift('ALL');

            if (urlQuery && 'cms_downtime_group' in urlQuery) {
                downtimeGroup = urlQuery.cms_downtime_group;
            }

            return initData();
        }))
            .catch(err => initData());
    }

    static controllerStateToQuery(state) {
        switch (state.filterBy) {
            case 'cms_fillRange':
                Object.keys(state).forEach(key => {
                    if (!(['cms_fill_to', 'cms_fill_from', 'cms_downtime_group'].includes(key))) delete state[key];
                });
                break;
            case 'cms_dateRange':
                Object.keys(state).forEach(key => {
                    if (!(['cms_date_to', 'cms_date_from', 'cms_downtime_group'].includes(key))) delete state[key];
                });
                break;
            default:
                break;
        }
        // Remove Downtime Group selector if ALL is selected
        if (state.cms_downtime_group === 'ALL') {
            delete state.cms_downtime_group;
        }
        return state;
    }

    static controllerQueryTitle(state) {
        switch (state.filterBy) {
            case 'cms_fillRange':
                return `Fill Range: ${state.cms_fill_from}-${state.cms_fill_to}`
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
        autocompleteFills(fill, true).then(resp => {
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
        autocompleteFills(fill, true).then(resp => {
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

    onGroupChange = event => {
        let { controllerState } = this.props;
        controllerState.cms_downtime_group = event.target.value;
        this.props.updateState(controllerState);
    }

    renderGroups = () => {
        return this.props.controllerData.downtimeGroups.map((group, index) => <MenuItem value={group} key={index}>{group}</MenuItem>);
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
                <div className={classes.checkboxContainer}>
                    <TextField
                        select
                        label="Downtime Groups"
                        value={this.props.controllerState.cms_downtime_group}
                        className={classes.selectField}
                        InputProps={{ className: classes.textField }}
                        onChange={this.onGroupChange}
                        SelectProps={{
                            MenuProps: {
                                className: classes.itemMenu,
                            },
                        }}
                    >
                        {this.renderGroups()}
                    </TextField>
                </div>
            </div >
        );
    }
}
export default withStyles(styles)(DowntimesController);
