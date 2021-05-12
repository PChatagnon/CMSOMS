import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import AutoComplete from '../generic/Autocomplete';
import DatePicker from '../generic/DatePicker';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import { formatDate, getCurrentDate, toDateObject } from '../../utils/dateUtils';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import FormGroup from '@material-ui/core/FormGroup';
import Checkbox from '@material-ui/core/Checkbox';
import AggWrapper from '../providers/AggWrapper';
import { autocompleteFills } from '../providers/AggDataAccess';
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
    },
    itemMenu: {
        width: 400,
    },
    selectField: {
        marginTop: 20,
        width: 400,
        marginLeft: 10,
    },
    selectFieldInput: {
        width: 420,
        fontSize: 14
    },
    checkboxContainer: {
        marginLeft: 30,
        verticalAlign: 'top',
        display: 'inline-block',
        maxWidth: 250,
        minWidth: 200,
    },
    checkbox: {
        paddingTop: 10,
        paddingBottom: 10
    },
    brCustom: {
        display: 'block',
        content: "",
        'margin-top': 10
   }
};

class FillSummaryController extends Component {

    constructor() {
        super();
        this.state = {
            fillsFrom: [],
            fillsTo: [],
            fillFromError: '',
            fillToError: ''
        }
    }

    static controllerHeight = 380;

    static controllerInit(urlQuery) {

        let filterBy = 'cms_fillRange';
        let lastFill = '', fillFrom = '', fillTo = '';
        let dateFrom, dateTo;
        let eraName;
        let eras = [];
        let props = {};

        let fillProps = {
            cms_fill_stableOnly: true,
            cms_fill_protonsOnly: false,
            cms_fill_ionsOnly: false,
            cms_fill_protonsIonsOnly: false,
            cms_fill_magnetOnOnly: false
        }

        let initData = () => {
            return {
                data: {
                    lastFill: lastFill,
                    eras: eras,
                },
                state: {
                    filterBy: filterBy,
                    cms_fill_to: fillTo,
                    cms_fill_from: fillFrom,
                    cms_date_to: dateTo,
                    cms_date_from: dateFrom,
                    cms_era_name: eraName,
                    fillProps: fillProps,
                    props: props
                }
            }
        }

        return axios.all([
            AggWrapper.fetch('fills', { page: 1, pagesize: 1, fields: ['fill_number'], include: ['turbo'] }),
            AggWrapper.fetch('eras', { page: 1, pagesize: 1000, include: ['turbo'], sorting: ['-start_fill'] }),
        ]).then(axios.spread((fillsResp, erasResp) => {

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
                dateFrom = formatDate(getCurrentDate().subtract(1, 'month'));
                dateTo = formatDate(getCurrentDate());
            }

            // Era
            eras = erasResp.data.data;

            if (urlQuery && 'cms_era_name' in urlQuery) {
                eraName = urlQuery.cms_era_name;
                filterBy = 'cms_era';
            } else {
                eraName = eras.length > 0 ? eras[0].attributes.name : null;
            }

            // Fill Properties
            Object.keys(fillProps).forEach(key => {
                if (urlQuery && key in urlQuery) {
                    fillProps[key] = urlQuery[key].toLowerCase() === 'true' ? true : false;
                }
            });

            // Props
            props = urlQuery && 'props' in urlQuery ? urlQuery.props : {};

            return initData();
        }))
            .catch(err => initData());
    }

    static controllerStateToQuery(state) {
        switch (state.filterBy) {
            case 'cms_fillRange':
                Object.keys(state).forEach(key => {
                    if (!(['cms_fill_to', 'cms_fill_from', 'fillProps', 'props'].includes(key))) delete state[key];
                });
                break;
            case 'cms_dateRange':
                Object.keys(state).forEach(key => {
                    if (!(['cms_date_to', 'cms_date_from', 'fillProps', 'props'].includes(key))) delete state[key];
                });
                break;
            case 'cms_era':
                Object.keys(state).forEach(key => {
                    if (!(['cms_era_name', 'fillProps', 'props'].includes(key))) delete state[key];
                });
                break;
            default:
                break;
        }
        // Removes properties which are False
        Object.entries(state.fillProps).forEach(([key, value]) => {
            delete state.fillProps[key];
            if (value) state[key] = value;
        });
        delete state.fillProps;
        return state;
    }

    static controllerQueryTitle(state) {
        switch (state.filterBy) {
            case 'cms_fillRange':
                return `Fill Range: ${state.cms_fill_from}-${state.cms_fill_to}`
            case 'cms_dateRange':
                return `Date Range: ${state.cms_date_from}-${state.cms_date_to}`;
            case 'cms_era':
                return `Era: ${state.cms_era_name}`;
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

    onEraChange = event => {
        let { controllerState } = this.props;
        controllerState.cms_era_name = event.target.value;
        this.props.updateState(controllerState);
    }

    onFilterChange = (event, value) => {
        let { controllerState } = this.props;
        controllerState.filterBy = value;
        this.props.updateState(controllerState);
    }

    // Fill Props (checkboxes)
    onFillPropsChange = name => event => {
        let { controllerState } = this.props;
        controllerState.fillProps[name] = event.target.checked;
        this.props.updateState(controllerState);
    }

    renderEras = () => {
        return this.props.controllerData.eras.map((era, index) => {
            era = era.attributes;
            const startDate = formatDate(era.start_time);
            const endDate = (era.end_time) ? formatDate(era.end_time) : 'present';
            const name = `${era.name}: ${startDate} - ${endDate}, Fills: ${era.start_fill} - ${(era.end_fill) ? era.end_fill : 'present'}`;
            return <MenuItem value={era.name} key={index}>{name}/</MenuItem>
        });
    }

    render() {
        const { filterBy, fillProps } = this.props.controllerState;
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
                        <FormControlLabel value="cms_era" control={<Radio color="primary" />} label="Era" className={classes.radioButton} />
                    </RadioGroup>
                </FormControl>

                <div className={classes.inputContainer}>
                    <div>
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
                    </div>
                    <div>
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
                    <div>
                    <br className={classes.brCustom}/>
                    <TextField
                        select
                        label="Era"
                        value={this.props.controllerState.cms_era_name}
                        disabled={filterBy !== 'cms_era'}
                        className={classes.selectField}
                        InputProps={{ className: classes.selectFieldInput }}
                        onChange={this.onEraChange}
                        SelectProps={{
                            MenuProps: {
                                className: classes.itemMenu,
                            },
                        }}
                    >
                        {this.renderEras()}
                    </TextField>
                    </div>
                </div>
                <div className={classes.checkboxContainer}>
                    <FormControl component="fieldset">
                        <FormLabel component="legend">Controller Options</FormLabel>
                        <FormGroup>
                            <FormControlLabel
                                label="Stable beams only"
                                control={
                                    <Checkbox
                                        color="primary"
                                        checked={fillProps.cms_fill_stableOnly}
                                        onChange={this.onFillPropsChange('cms_fill_stableOnly')}
                                        className={classes.checkbox}
                                    />
                                }
                            />
                            <FormControlLabel
                                label="Protons only"
                                control={
                                    <Checkbox
                                        color="primary"
                                        checked={fillProps.cms_fill_protonsOnly}
                                        onChange={this.onFillPropsChange('cms_fill_protonsOnly')}
                                        className={classes.checkbox}
                                    />
                                }
                            />
                            <FormControlLabel
                                label="Ions only"
                                control={
                                    <Checkbox
                                        color="primary"
                                        checked={fillProps.cms_fill_ionsOnly}
                                        onChange={this.onFillPropsChange('cms_fill_ionsOnly')}
                                        className={classes.checkbox}
                                    />
                                }
                            />
                            <FormControlLabel
                                label="Protons-Ions only"
                                control={
                                    <Checkbox
                                        color="primary"
                                        checked={fillProps.cms_fill_protonsIonsOnly}
                                        onChange={this.onFillPropsChange('cms_fill_protonsIonsOnly')}
                                        className={classes.checkbox}
                                    />
                                }
                            />
                        </FormGroup>
                    </FormControl>
                </div>
            </div>
        );
    }
}
export default withStyles(styles)(FillSummaryController);
