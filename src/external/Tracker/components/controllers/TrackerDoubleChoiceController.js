import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import AutoComplete from '../../../../components/generic/Autocomplete';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import Resthub from '../../../../components/providers/Resthub';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControl from '@material-ui/core/FormControl';
import Radio from '@material-ui/core/Radio';
import FormControlLabel from '@material-ui/core/FormControlLabel';

const styles = {
    radioGroup: {
        float: 'left',
        maxWidth: 170,
        minWidth: 160,
    },
    radioButton: {
        marginTop: 12
    },
    inputContainer: {
        display: 'inline-block',
        maxWidth: 700,
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
        width: 200
    },
    autocomplete: {
        marginTop: 10
    },
    itemMenu: {
        width: 200,
    },
    selectField: {
        marginTop: 10,
        width: 200
    },
    optionsContainer: {
        marginLeft: 30,
        marginTop: 10,
        display: 'inline-block',
        verticalAlign: 'top',
        maxWidth: 1000,
        minWidth: 300
    }
}

const RESTHUB_URL = '/tracker-resthub';

class TrackerDoubleChoiceController extends Component {

    static controllerHeight = 320;

    constructor() {
        super();
        this.state = {
            errMessage: '',
            sensorTypes: [],
            url: ''
        }
    }

    static controllerInit(urlQuery, controller) {

        let sensorType = '', lastSensorType = '';
        let run = '', runData = [];
        let runTypeNumber = '';
	//let runTypeNumbers = [];
        let filterBy = 'runName';


        let initData = () => {
            return {
                data: {
                    runs: runData
                },
                state: {
                    filterBy: filterBy,
                    tracker_sensorType: sensorType,
                    tracker_runName: run,
                    tracker_runTypeNumber: runTypeNumber
                }
            }
        }
        
        let { url } = controller.configuration;
        return Resthub.json2("SELECT t.SENSOR FROM " + url + " t ORDER BY t.SENSOR DESC ", null, 1, 1, RESTHUB_URL)
            .then(resp => {
                const respData = resp.data.data;
                const sensorTypes = respData.length ? respData.map(s => s.sensor) : null;
                lastSensorType = sensorTypes ? sensorTypes[0] : null;
                sensorType = lastSensorType ? lastSensorType : null

                return Resthub.json2("SELECT DISTINCT t.RUN_NAME, t.RUN_TYPE_NUMBER FROM " + url + " t WHERE t.SENSOR = '" + sensorType + "' ", null, null, null, RESTHUB_URL)
                    .then(resp => {
                        runData = resp.data.data;
                        if (runData[0].runName) {
                            const lastRun = runData ? runData[0].runName : null;
                            run = lastRun ? lastRun : 'None';
                        }
                        if (runData[0].runTypeNumber){
                            const last_runTypeNumber = runData ? runData[0].runTypeNumber : null;    
                            runTypeNumber = last_runTypeNumber ? last_runTypeNumber : null;
                        }
                        return initData();
                    })
            }).catch(err => initData());
    }

    static controllerQueryTitle(state) {
        return `Sensor Type:   ${state.tracker_sensorType}`;
    }

    updateRuns = (runsData) => {
        let { controllerData } = this.props;
        controllerData.runs = runsData;
        this.props.updateControllerData(controllerData);
        let { controllerState } = this.props;
        if (runsData[0].runName) {
            controllerState.tracker_runName = runsData ? runsData[0].runName : null;
        }
        if (runsData[0].runTypeNumber) {
            controllerState.tracker_runTypeNumber = runsData ? runsData[0].runTypeNumber : null;
        }
        this.props.updateState(controllerState);
    }

    fetchRunData = (sensorType) => {
        return Resthub.json2("SELECT DISTINCT t.RUN_NAME, t.RUN_TYPE_NUMBER FROM " + this.props.configuration.url + " t WHERE t.SENSOR = '" + sensorType + "' ", null, null, null, RESTHUB_URL)
            .then(response => {
                const runsData = response.data.data;
                this.updateRuns(runsData);
            });
    }

    validateSensorType = (sensorType) => {
        return this.state.sensorTypes.find(s => s === sensorType);
    }
    
    onSensorTypeChange = (searchText, index) => {
        const sensorType = this.validateSensorType(searchText);
        if (!sensorType) return;
        this.updateSensorSerial(sensorType);               
        return this.fetchRunData(sensorType);
    }
    updateSensorSerial = sensorType => {
        let { controllerState } = this.props;
        controllerState.tracker_sensorType = sensorType;
        this.props.updateState(controllerState);
    }

    onSensorTypeUpdate = (searchText) => {
        this.updateSensorSerial(searchText);
        Resthub.json2("SELECT DISTINCT t.SENSOR FROM " + this.props.configuration.url + " t WHERE t.SENSOR LIKE  '%" + searchText + "%' ", null, null, null, RESTHUB_URL)
            .then(response => {
                const sensorTypes = response.data.data;
                this.setState({ sensorTypes: sensorTypes.map(s => s.sensor), errMessage: '' });
            });
    }

    onRunNameChange = event => {
        let { controllerState } = this.props;
        controllerState.tracker_runName = event.target.value;
        this.props.updateState(controllerState);
    }

    onRunTypeNumberChange = event => {
        let { controllerState } = this.props;
        controllerState.tracker_runTypeNumber = event.target.value;
        this.props.updateState(controllerState);
    }

    renderRunNames = () => {
        const { runs } = this.props.controllerData;
        if (runs[0].runName){
            if (!runs[0].runName.length) {
                return <MenuItem value={null}>None</MenuItem>
            }
        } else {
            return <MenuItem value={null}>None</MenuItem>
        }
        return runs.map((sensor, index) => {
            return <MenuItem value={sensor.runName} key={index}>{`${sensor.runName}`}</MenuItem>
        });       
    }

    renderRunTypesNumbers = () => {
        const { runs } = this.props.controllerData;
        if (!runs.length) {
            return <MenuItem value={null}>None</MenuItem>
        }
        return runs.map((sensor, index) => {
            return <MenuItem value={sensor.runTypeNumber} key={index}>{`${sensor.runTypeNumber}`}</MenuItem>
        });
    }

    onFilterChange = event => {
        const { value } = event.target;
        let { controllerState } = this.props;
        controllerState.filterBy = value;
        controllerState.tracker_runTypeNumber = '';
        controllerState.tracker_runName = '';
        this.props.updateState(controllerState);
    }

    render() {
        //const { classes, controllerData } = this.props;
        const { classes } = this.props;
        const { filterBy} = this.props.controllerState;
       
        return (
            <div >
                <div>
                <AutoComplete
                    label='Sensor'
                    value={this.props.controllerState.tracker_sensorType}
                    suggestions={this.state.sensorTypes}
                    onInputChange={this.onSensorTypeUpdate}
                    onValueChange={this.onSensorTypeChange}
                    style={[styles.autoComplete, {marginTop: 10}]}
                    maxSearchResults={300}
                    openOnFocus={true}
                    listStyle={{ maxHeight: 300, overflow: 'auto' }}
                />
                </div>
                    <FormControl component="fieldset">
                        <RadioGroup
                            name="filterBy"
                            className={classes.radioGroup}
                            value={filterBy}
                            onChange={this.onFilterChange}
                        >
                            <FormControlLabel value="runName" control={<Radio color="primary" />} label="By Run Name" className={classes.radioButton} />
                            <FormControlLabel value="runType" control={<Radio color="primary" />} label="By Run Type(Run Number)" className={classes.radioButton} />
                        </RadioGroup>
                    </FormControl>
                <div className={classes.inputContainer}>
                <TextField
                    disabled={filterBy !== 'runName'}
                    select
                    label="Run Name"
                    className={classes.selectField}
                    InputProps={{ className: classes.textField }}
                    value={this.props.controllerState.tracker_runName}
                    onChange={this.onRunNameChange}
                    suggestions={this.state.runs}
                    SelectProps={{
                        MenuProps: {
                            className: classes.itemMenu,
                        }
                    }}
                >
                    {this.renderRunNames()}
                </TextField>
                <br/>
                <TextField
                    disabled={filterBy !== 'runType'}
                    select
                    label="Run Type(Run Number)"
                    className={classes.selectField}
                    InputProps={{ className: classes.textField }}
                    value={this.props.controllerState.tracker_runTypeNumber}
                    onChange={this.onRunTypeNumberChange}
                    suggestions={this.state.runs}
                    SelectProps={{
                        MenuProps: {
                            className: classes.itemMenu,
                        }
                    }}
                >
                    {this.renderRunTypesNumbers()}
                </TextField>
                </div>
            </div >
        );
    }
}
export default withStyles(styles)(TrackerDoubleChoiceController);
