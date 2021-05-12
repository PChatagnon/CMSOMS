import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import AutoComplete from '../generic/Autocomplete';
import DatePicker from '../generic/DatePicker';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormLabel from '@material-ui/core/FormLabel';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import Box from '@material-ui/core/Box';

import FormControl from '@material-ui/core/FormControl';
import AggWrapper from '../providers/AggWrapper';
import { formatDate, getCurrentDate, toDateObject } from '../../utils/dateUtils';
import { autocompleteFills } from '../providers/AggDataAccess';
import axios from 'axios';

const CRUD_API_URL = "/crud-api";

const styles = {
    radioGroup: {
        float: 'left',
        maxWidth: 170,
        minWidth: 160
    },
    radioButton: {
        marginTop: 36,
    },
    inputContainer: {
        display: 'inline-block',
        maxWidth: 450,
        minWidth: 400,
    },
    checkboxContainer: {
        marginLeft: 30,
        marginTop: 10,
        verticalAlign: 'top',
        display: 'inline-block',
        maxWidth: 250,
        minWidth: 200,
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
    },
    autocomplete: {
        marginTop: 28
    },
    dropdown: {
        width: 160,
        marginBottom: 5
    },
    selectField: {
        marginTop: 28,
        width: 402,
        marginLeft: 10,
    },
    marginUpper: {
        marginTop: 74,
        width: 100,
        marginLeft: 0,
        marginBottom: 28
    },
    sbLabel: {
        marginTop: 7,
        marginBottom: 4
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

class DowntimeManipulationController extends Component {

    constructor() {
        super();
        this.state = {
            fillsFrom: [],
            fillsTo: [],
            fillFromError: '',
            fillToError: '',
            isAdmin: false //to be updated
        }
    }

    static controllerHeight = 360;

    static controllerInit(urlQuery, controller) {

        let filterBy = 'downtime_48h';
        let lastFill = '', fillFrom = '', fillTo = '';
        let dateFrom, dateTo;
        let eraName;
        let eras = [];
        let eraMap = {};
        let stableBeams = false;

        let groupData = null;
        let subsystemData = null;
        let groupNames = {};
        let categoryNames = {};
        let subsystemNames = {};
        let isOperator = false;
        let isAdmin = false;

        let fullMode = !(controller.configuration && controller.configuration.liveMode);

        let initData = () => {
            return {
                data: {
                    lastFill: lastFill,
                    eras: eras
                },
                //static data passed to the panel portlet
                exportData: {
                    groupData: groupData,
                    subsystemData: subsystemData,
                    nameMapping: { groupNames, categoryNames, subsystemNames },
                    isOperator : isOperator,
                    isAdmin : isAdmin,
                    autoQueryStates: ['downtime_48h'],
                    fullMode: fullMode,
                    eraMap: eraMap
                },
                state: {
                    filterBy: filterBy,
                    stop_fill_number: fillTo,
                    start_fill_number: fillFrom,
                    cms_date_to: dateTo,
                    cms_date_from: dateFrom,
                    cms_era_name: eraName,
                    stable_beams_only: stableBeams,
                    group_id: null,
                    category_id: null,
                    subsystem_id: null
                }
            }
        }

        return axios.all([
            AggWrapper.fetch('fills', fillQueryParams),
            AggWrapper.fetch('eras', { page: 1, pagesize: 1000, include: ['turbo'], sorting: ['-start_fill'] }),
            axios.get(CRUD_API_URL + "/downtime_groups?page[size]=1000"),
            axios.get(CRUD_API_URL + "/downtime_subsystems?page[size]=1000")
        ]).then(axios.spread((fillsResp, erasResp, groupsResp, subsysResp) => {

            if (groupsResp.headers.hasOwnProperty("api-roles")) {
                if (groupsResp.headers["api-roles"].includes("DOWNTIME_ADMIN")) {
                    isOperator = isAdmin = true;
                    fullMode = true;
                }
            }

            //crud-api groups
            if (groupsResp.headers.hasOwnProperty("api-roles")) {
                if (groupsResp.headers["api-roles"].includes("DOWNTIME_OPERATOR")) {
                    isOperator = true;
                }
            }

            // Fill range
            const fills = fillsResp.data.data;
            lastFill = (fills.length > 0) ? fills[0].attributes.fill_number : null;

            filterBy = 'downtime_48h';
            if (fullMode && urlQuery && 'start_fill_number' in urlQuery && 'stop_fill_number' in urlQuery
                && !isNaN(urlQuery.start_fill_number) && !isNaN(urlQuery.stop_fill_number)) {
                fillFrom = urlQuery.start_fill_number;
                fillTo = urlQuery.stop_fill_number;
                filterBy = 'downtime_fillRange';
            } else {
                fillTo = lastFill ? lastFill.toString() : null;
                fillFrom = lastFill ? (lastFill - 100).toString() : null;
            }

            // Date range
            if (fullMode && urlQuery && 'cms_date_from' in urlQuery && 'cms_date_to' in urlQuery
                && urlQuery.cms_date_from && urlQuery.cms_date_to) {

                dateFrom = urlQuery.cms_date_from;
                dateTo = urlQuery.cms_date_to;
                filterBy = 'cms_dateRange';
            } else {
                dateFrom = formatDate(getCurrentDate().subtract(730, 'days'));
                dateTo = formatDate(getCurrentDate());
            }

            if (urlQuery && "stable_beams_only" in urlQuery) {
                stableBeams = urlQuery.stable_beams_only.toLowerCase() === 'true' ? true : false;
            }

            // Era
            eras = erasResp.data.data;
            eras.forEach( item => { eraMap[item.attributes.name]=item.attributes; });

            if (fullMode && urlQuery && 'cms_era_name' in urlQuery) {
                eraName = urlQuery.cms_era_name;
                filterBy = 'cms_era';
            } else {
                eraName = eras.length > 0 ? eras[0].attributes.name : null;
            }

            groupData = groupsResp.data.data;

            if (groupData)
                groupData.forEach( g => {
                    groupNames[g.id] = g.attributes.name;
                    if (g.attributes.categories)
                        g.attributes.categories.forEach( c => {
                            categoryNames[c.id] = c.attributes.name;
                        });
                });

            subsystemData = subsysResp.data.data;

            if (subsystemData)
                subsystemData.forEach( s => {
                    subsystemNames[s.id] = s.attributes.name;
                });

            return initData();
        }))
            .catch(err => { console.log(err); return initData()});
    }

    static controllerStateToQuery(state) {
        switch (state.filterBy) {
            case 'downtime_48h':
                Object.keys(state).forEach(key => {
                    if (!(['filterBy','stable_beams_only','group_id','category_id','subsystem_id'].includes(key))) delete state[key];
                });
                break;
            case 'downtime_fillRange':
                Object.keys(state).forEach(key => {
                    if (!(['filterBy','start_fill_number', 'stop_fill_number', 'stable_beams_only','group_id','category_id','subsystem_id'].includes(key))) delete state[key];
                    if (isNaN(state.start_fill_number) || isNaN(state.stop_fill_number)) {
                      delete state['start_fill_number'];
                      delete state['stop_fill_number'];
                    }
                });
                break;
            case 'cms_dateRange':
                Object.keys(state).forEach(key => {
                    if (!(['filterBy','cms_date_to', 'cms_date_from', 'stable_beams_only','group_id','category_id','subsystem_id'].includes(key))) delete state[key];

                    if (!(state.cms_date_from) || !(state.cms_date_to)) {
                      delete state['cms_date_from'];
                      delete state['cms_date_to'];
                    }
                });
                break;
            case 'cms_era':
                Object.keys(state).forEach(key => {
                    if (!(['filterBy','cms_era_name','group_id','category_id','subsystem_id'].includes(key))) delete state[key];
                });
                break;
            default:
                break;
        }

        if (!state.stable_beams_only) delete state['stable_beams_only'];
        if (state.group_id === null) delete state['group_id'];
        if (state.category_id === null) delete state['category_id'];
        if (state.subsystem_id === null) delete state['subsystem_id'];

        return state;
    }

    static controllerQueryTitle(state) {
        switch (state.filterBy) {
            case 'downtime_48h':
                return `Live`
            case 'downtime_fillRange':
                return `Fill Range: ${state.start_fill_number}-${state.stop_fill_number}`;
            case 'cms_dateRange':
                return `Date Range: ${state.cms_date_from}-${state.cms_date_to}`;
            case 'cms_era':
                return `Era: ${state.cms_era_name}`;
            default:
                return 'Controller';
        }
    }

    onStableBeamsChange = event => {
        let { controllerState } = this.props;
        controllerState.stable_beams_only = event.target.checked;
        this.props.updateState(controllerState);
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

    validateFill = fillString => {
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
        controllerState.start_fill_number = fill;
        this.props.updateState(controllerState);
    }

    updateFillTo = fill => {
        let { controllerState } = this.props;
        controllerState.stop_fill_number = fill;
        this.props.updateState(controllerState);
    }

    onFillFromUpdate = searchText => {
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

    onFillToUpdate = searchText => {
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

    renderEras = () => {
        return this.props.controllerData.eras.map((era, index) => {
            era = era.attributes;
            const startDate = formatDate(era.start_time);
            const endDate = (era.end_time) ? formatDate(era.end_time) : 'present';
            const name = `${era.name}: ${startDate} - ${endDate}, Fills: ${era.start_fill} - ${(era.end_fill) ? era.end_fill : 'present'}`;
            return <MenuItem value={era.name} key={index}>{name}/</MenuItem>
        });
    }

    renderGroupEntries = () => {
        const groupData = this.props.controllerExportData.groupData;
        if (!groupData) return;
        return groupData.map( group => {
            return (
                <option key={group.id} value={group.id}>{group.attributes.name}</option>
            )
        });
    }

    renderCategoryEntries = () => {
        let { controllerState, controllerExportData } = this.props;
        const groupData = controllerExportData.groupData;
        if (!controllerState.group_id) return;
        if (!groupData) return;
        const groups = groupData.filter(g => g.id === controllerState.group_id)
        groupData.forEach( g => {console.log(g.id)});
        if (!groups || !groups.length) return;
        if (!groups[0].attributes || !groups[0].attributes.categories) return;
        return groups[0].attributes.categories.map( category => {
            return (
                <option key={category.id} value={category.id}>{category.attributes.name}</option>
            )
        });
    }

    renderSubsystemEntries = () => {
        const subsystemData = this.props.controllerExportData.subsystemData;
        if (!subsystemData) return;
        return subsystemData.map( subsystem => {
            return (
                <option key={subsystem.id} value={subsystem.id}>{subsystem.attributes.name}</option>
            )
        });
    }

    handleCategoryChange = (event) => {
        let { controllerState } = this.props;
        if (!isNaN(event.target.value)) {
            controllerState.category_id = parseInt(event.target.value);
            this.props.updateState(controllerState);
        }
    }

    handleGroupChange = (event) => {
        let { controllerState } = this.props;
        if (!isNaN(event.target.value)) {
            controllerState.group_id = parseInt(event.target.value);
            //reset category when group changes
            controllerState.category_id = null;
            this.props.updateState(controllerState);
        }
    }

    handleSubsystemChange = (event) => {
        let { controllerState } = this.props;
        if (!isNaN(event.target.value)) {
            controllerState.subsystem_id = parseInt(event.target.value);
            this.props.updateState(controllerState);
        }
    }

    render() {
        const { filterBy } = this.props.controllerState;
        const { classes } = this.props;
        const { fullMode } = this.props.controllerExportData;
        return (
            <div>
                <FormControl component="fieldset">
                    <RadioGroup
                        name="filterBy"
                        className={classes.radioGroup}
                        value={filterBy}
                        onChange={this.onFilterChange}
                    >
                        <FormControlLabel value="downtime_48h" control={<Radio color="primary" />} label="Live" className={classes.radioButton} />
                        <FormControlLabel value="downtime_fillRange" control={<Radio color="primary" />} label="Fill Range" className={classes.radioButton} disabled={!fullMode}/>
                        <FormControlLabel value="cms_dateRange" control={<Radio color="primary" />} label="Date Range" className={classes.radioButton} disabled={!fullMode}/>
                        <FormControlLabel value="cms_era" control={<Radio color="primary" />} label="Era" className={classes.radioButton} disabled={!fullMode}/>
                    </RadioGroup>
                </FormControl>
                <div className={classes.inputContainer}>
                    <Box
                        style={styles.marginUpper}
                        disabled
                    >
                    </Box>

                    <AutoComplete
                        label='Fill Range: From'
                        value={this.props.controllerState.start_fill_number.toString()}
                        disabled={filterBy !== 'downtime_fillRange'}
                        suggestions={this.state.fillsFrom}
                        onInputChange={this.onFillFromUpdate}
                        onValueChange={this.onFillFromChange}
                        style={styles.autocomplete}
                        compact={true}
                    />
                    <AutoComplete
                        label='Fill Range: To'
                        value={this.props.controllerState.stop_fill_number.toString()}
                        disabled={filterBy !== 'downtime_fillRange'}
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

                <div className={classes.checkboxContainer}>
                    <FormLabel component="legend">Controller Options</FormLabel>
                    <FormControlLabel
                        className={classes.sbLabel}
                        label="Stable beams only"
                        control={
                            <Checkbox
                                color="primary"
                                checked={this.props.controllerState.stable_beams_only}
                                onChange={this.onStableBeamsChange}
                                className={classes.checkbox}
                            />
                        }
                    />
                    <InputLabel htmlFor="group-label">Group</InputLabel>
                    <FormControl>
                        <Select
                            native
                            disabled={!fullMode}
                            className={classes.dropdown}
                            value={this.state.group_id}
                            onChange={this.handleGroupChange}
                            inputProps={{
                                name: 'group',
                                id: 'group-label',
                            }}
                        >
                            <option aria-label="None" value="" />
                            {this.renderGroupEntries()}
                        </Select>
                    </FormControl>

                    <InputLabel htmlFor="category-label">Category</InputLabel>
                    <FormControl>

                        <Select
                            native
                            disabled={!fullMode}
                            className={classes.dropdown}
                            value={this.state.category_id}
                            onChange={this.handleCategoryChange}
                            inputProps={{
                                name: 'category',
                                id: 'category-label',
                            }}
                        >
                            <option aria-label="None" value="" />
                            {this.renderCategoryEntries()}
                        </Select>
                    </FormControl>

                    <InputLabel htmlFor="subsystem-label">Subsystem</InputLabel>
                    <FormControl>

                        <Select
                            native
                            disabled={!fullMode}
                            className={classes.dropdown}
                            value={this.state.subsystem_id}
                            onChange={this.handleSubsystemChange}
                            inputProps={{
                                name: 'subsystem',
                                id: 'subsystem-label',
                            }}
                        >
                            <option aria-label="None" value="" />
                            {this.renderSubsystemEntries()}
                        </Select>
                    </FormControl>
                </div>
            </div>
        );
    }
}
export default withStyles(styles)(DowntimeManipulationController);
