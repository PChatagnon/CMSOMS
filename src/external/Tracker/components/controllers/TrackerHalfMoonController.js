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
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Chip from '@material-ui/core/Chip';
import FaceIcon from '@material-ui/icons/Face';
//import WebIcon from '@material-ui/icons/Web';
//import InsertChartIcon from '@material-ui/icons/InsertChart';
//import FormatQuotetIcon from '@material-ui/icons/FormatQuote';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

const styles = {
    radioGroup: {
        float: 'left',
        maxWidth: 170,
        minWidth: 160,
    },
    radioButton: {
        marginTop: 20
    },
    inputContainer: {
        display: 'inline-block',
        maxWidth: 700,
        minWidth: 400,
    },
    textField: {
        width: 300,
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
    },
    button: {
        marginLeft: 10,
        marginTop: 10
    }
}

const RESTHUB_URL = '/tracker-resthub';

class TrackerHalfMoonController extends Component {

    static controllerHeight = 280;

    constructor() {
        super();
        this.state = {
            errMessage: '',
            sensorTypes: [],
            url: '',
            tab: "simple"
        }
    }

    static controllerInit(urlQuery, controller) {

        let sensorType = '', lastSensorType = '', id = '';
        let run = '', runs = [];
        let runTypeNumber = '';
        //let runTypeNumbers = [];
        let filterBy = 'runName';
        let selectedIds = [];

        let initData = () => {
            return {
                data: {
                    runs: runs
                },
                state: {
                    tracker_sensorType: sensorType,
                    tracker_runName: run,
                    tracker_runTypeNumber: runTypeNumber,
                    tracker_data: selectedIds,
                    tracker_id : id,
                    filterBy: filterBy
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
            }).catch(err => initData());
    }

    static controllerQueryTitle(state) {
        return `Sensor Type:   ${state.tracker_sensorType}`;
    }

    updateRuns = (runs) => {
        let { controllerData } = this.props;
        controllerData.runs = runs;
        this.props.updateControllerData(controllerData);
        let { controllerState } = this.props;
        if (runs[0].runName) {
            controllerState.tracker_runName = runs ? runs[0].runName : null;
        }
        if (runs[0].runTypeNumber) {
            controllerState.tracker_runTypeNumber = runs ? runs[0].runTypeNumber : null;
        }
        this.props.updateState(controllerState);
    }

    fetchRunNames = (sensorType) => {
        return Resthub.json2("SELECT DISTINCT t.RUN_NAME, t.RUN_TYPE_NUMBER FROM " + this.props.configuration.url + " t WHERE t.SENSOR = '" + sensorType + "' ", null, null, null, RESTHUB_URL)
            .then(response => {
                const runs = response.data.data;
                this.updateRuns(runs);
            });
    }

    validateSensorType = (sensorType) => {
        return this.state.sensorTypes.find(s => s === sensorType);
    }
    
    onSensorTypeChange = (searchText, index) => {
        const sensorType = this.validateSensorType(searchText);
        if (!sensorType) return;
        this.updateSensorSerial(sensorType);               
        return this.fetchRunNames(sensorType);
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

    onFilterChange = event => {
        const { value } = event.target;
        let { controllerState } = this.props;
        controllerState.filterBy = value;
        controllerState.tracker_runTypeNumber = '';
        controllerState.tracker_runName = '';
        this.props.updateState(controllerState);
    }

    onIDAdd = () => {
        let { controllerState } = this.props;
        if (controllerState.tracker_runTypeNumber){
            if (controllerState.tracker_data.find(item => item.tracker_runTypeNumber === controllerState.tracker_runTypeNumber) && controllerState.tracker_data.find(item => item.tracker_sensorType === controllerState.tracker_sensorType)){
                 //Snackbar goes here. Inform that this one already `add`ed.
                 this.handleClick({ vertical: 'bottom', horizontal: 'center' })
                 return;
            } else {
                controllerState.tracker_data.push({ tracker_runTypeNumber: controllerState.tracker_runTypeNumber, tracker_runName: controllerState.tracker_runName,
                    tracker_sensorType: controllerState.tracker_sensorType, tracker_id: controllerState.tracker_sensorType + "." + controllerState.tracker_runTypeNumber});
                this.props.updateState(controllerState);
                return;
                } 
            } else {
            if (controllerState.tracker_data.find(item => item.tracker_runName === controllerState.tracker_runName) && controllerState.tracker_data.find(item => item.tracker_sensorType === controllerState.tracker_sensorType)){
                //Snackbar goes here. Inform that this one already `add`ed.
                this.handleClick({ vertical: 'bottom', horizontal: 'center' })
                return;
            } else {
                controllerState.tracker_data.push({ tracker_runTypeNumber: controllerState.tracker_runTypeNumber, tracker_runName: controllerState.tracker_runName,
                    tracker_sensorType: controllerState.tracker_sensorType, tracker_id: controllerState.tracker_sensorType + "." + controllerState.tracker_runName});
                this.props.updateState(controllerState);
                return;
                }
            }
        }

    onIDDelete = (value) => {
        let { controllerState } = this.props;
        controllerState.tracker_data = controllerState.tracker_data.filter(item => item.tracker_id !== value);
        this.props.updateState(controllerState);
    }

    renderChip = () => {
       return (this.props.controllerState.tracker_data.map(e => {
            return (
                <Chip
                    key={e.tracker_id}
                    icon={<FaceIcon />}
                    label={e.tracker_id}
                    onDelete={() => this.onIDDelete(e.tracker_id)}
                    className={this.props.classes.chip}
                />
            );           
        })
       )
    }

    render() {
        const { classes } = this.props;
        const { filterBy} = this.props.controllerState;
        const { tab } = this.state;
        return (
            <div >
                <AppBar position="static">
                    <Tabs
                        value={tab}
                        variant="scrollable"
                        scrollButtons="auto"
                        aria-label="simple tabs example"
                        onChange={(e, value) => this.setState({ tab: value })}
                    >
                        <Tab label="One element chart" value="simple" />
                        <Tab label="SuperImposed chart" value="super" />
                    </Tabs>
                </AppBar>
                {tab === "simple" && 
                <div>
                    <AutoComplete
                        label='Flute'
                        value={this.props.controllerState.tracker_sensorType}
                        suggestions={this.state.sensorTypes}
                        onInputChange={this.onSensorTypeUpdate}
                        onValueChange={this.onSensorTypeChange}
                        style={styles.autoComplete}
                        maxSearchResults={300}
                        openOnFocus={true}
                        listStyle={{ maxHeight: 300, overflow: 'auto' }}
                    /> 
                    <AutoComplete
                        label='Structure'
                        value={this.props.controllerState.tracker_sensorType}
                        suggestions={this.state.sensorTypes}
                        onInputChange={this.onSensorTypeUpdate}
                        onValueChange={this.onSensorTypeChange}
                        style={styles.autoComplete}
                        maxSearchResults={300}
                        openOnFocus={true}
                        listStyle={{ maxHeight: 300, overflow: 'auto' }}
                    /> 
                    <AutoComplete
                        label='HalfMoon BarCode'
                        value={this.props.controllerState.tracker_sensorType}
                        suggestions={this.state.sensorTypes}
                        onInputChange={this.onSensorTypeUpdate}
                        onValueChange={this.onSensorTypeChange}
                        style={styles.autoComplete}
                        maxSearchResults={300}
                        openOnFocus={true}
                        listStyle={{ maxHeight: 300, overflow: 'auto' }}
                    /> 
                </div>
                }
                {tab === "super" && 
                <div>
                    <AutoComplete
                        label='Flute'
                        value={this.props.controllerState.tracker_sensorType}
                        suggestions={this.state.sensorTypes}
                        onInputChange={this.onSensorTypeUpdate}
                        onValueChange={this.onSensorTypeChange}
                        style={styles.autoComplete}
                        maxSearchResults={300}
                        openOnFocus={true}
                        listStyle={{ maxHeight: 300, overflow: 'auto' }}
                    /> 
                    <AutoComplete
                        label='Structure'
                        value={this.props.controllerState.tracker_sensorType}
                        suggestions={this.state.sensorTypes}
                        onInputChange={this.onSensorTypeUpdate}
                        onValueChange={this.onSensorTypeChange}
                        style={styles.autoComplete}
                        maxSearchResults={300}
                        openOnFocus={true}
                        listStyle={{ maxHeight: 300, overflow: 'auto' }}
                    /> 
                    <AutoComplete
                        label='HalfMoon BarCode'
                        value={this.props.controllerState.tracker_sensorType}
                        suggestions={this.state.sensorTypes}
                        onInputChange={this.onSensorTypeUpdate}
                        onValueChange={this.onSensorTypeChange}
                        style={styles.autoComplete}
                        maxSearchResults={300}
                        openOnFocus={true}
                        listStyle={{ maxHeight: 300, overflow: 'auto' }}
                    /> 
                    <Button
                        disabled={this.props.controllerState.tracker_runName === '' 
                        && this.props.controllerState.tracker_runTypeNumber === ''}
                        variant="contained"
                        className={classes.button}
                        onClick={this.onIDAdd}>
                        Add ID
                    </Button>
                    <br/>
                    <div>
                        <Typography variant="subtitle2" gutterBottom style={{ marginTop: 10 }}>
                            Selected Ids:
                        </Typography>
                        <div style={styles.wrapper}>
                            {this.renderChip()}
                        </div>
                    </div>
                </div>
                }
                
        </div >
        );
    }
}
export default withStyles(styles)(TrackerHalfMoonController);
