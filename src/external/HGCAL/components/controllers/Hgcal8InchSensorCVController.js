import React, { Component } from 'react';
import AutoComplete from '../../../../components/generic/Autocomplete';
import MenuItem from '@material-ui/core/MenuItem';
import Resthub from '../../../../components/providers/Resthub';
import RadioGroup from '@material-ui/core/RadioGroup';
import Chip from '@material-ui/core/Chip';
import TextField from '@material-ui/core/TextField';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import Radio from '@material-ui/core/Radio';
import Typography from '@material-ui/core/Typography';

const styles = {
    radioGroup: {
        float: 'left',
        maxWidth: 170,
        minWidth: 160,
    },
    radioButton: {
        marginTop: 36
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
        marginTop: 28
    },
    itemMenu: {
        width: 200,
    },
    selectField: {
        marginTop: 29,
        width: 200
    },
    optionsContainer: {
        marginLeft: 30,
        marginTop: 15,
        display: 'inline-block',
        verticalAlign: 'top',
        maxWidth: 1000,
        minWidth: 300
    },
    button: {
        marginTop: 30,
        marginLeft: 10
    }
};

const RESTHUB_URL = '/hgcal-resthub';

class Hgcal8InchSensorCVController extends Component {


    constructor() {
        super();
        this.state = {
            errMessage: '',
            hammaSensrTypes: [],
            cernSensrTypes: [],
            compareSensrTypes: []
        }
    }

    static controllerHeight = 450;

    static controllerInit(urlQuery) {

        let hammaSensrType = '', lastHammaSensrType = '';
        let hammaSensrCell = '', hammaSensrDiods = [];
        let filterBy = 'hamma';
        let cernSensrType = '', lastCernSensrType = '';
        let cernSensrCell = '', cernSensrCells = [];
      
        let initData = () => {
            return {
                data: {
                    hammaSensrDiods: hammaSensrDiods,
                    cernSensrCells: cernSensrCells,
                  
                },
                state: {
                    filterBy: filterBy,
                    hgcal_hamma_sensor_type : hammaSensrType,
                    hgcal_hamma_sensor_cell : hammaSensrCell,
                    hgcal_cern_sensor_type : cernSensrType,
                    hgcal_cern_sensor_cell: cernSensrCell,
                    hgcal_data: []
                },
            }
        }

        return Resthub.json2("SELECT DISTINCT t.HPKSNSR FROM hgcal_int2r.hgc_hpk_8inch_snsr_cv_v t ORDER BY t.HPKSNSR DESC ", null, null, null, RESTHUB_URL)
            .then(resp => {
                const respData = resp.data.data;
                const hammaSensrTypes = respData.length ? respData.map(s => s.hpksnsr) : null;
                lastHammaSensrType = hammaSensrTypes ? hammaSensrTypes[0] : null;
                hammaSensrType = lastHammaSensrType ? lastHammaSensrType : null
                return Resthub.json2("SELECT DISTINCT t.MNTRDIODE FROM hgcal_int2r.hgc_hpk_8inch_snsr_cv_v t WHERE t.HPKSNSR = '" + hammaSensrType + "' ", null, null, null, RESTHUB_URL)
                    .then(resp => {
                        hammaSensrDiods = resp.data.data;
                        const lastSnsrCell = hammaSensrDiods ? hammaSensrDiods[0].mntrdiode : null;
                        hammaSensrCell = lastSnsrCell ? lastSnsrCell : null
                        return Resthub.json2("SELECT DISTINCT t.HPKSNSR FROM hgcal_int2r.hgc_cern_8inch_snsr_cv_v t ORDER BY t.HPKSNSR DESC ", null, null, null, RESTHUB_URL)
                            .then(resp => {
                                const respData = resp.data.data;
                                const cernSensrTypes = respData.length ? respData.map(s => s.hpksnsr) : null;
                                lastCernSensrType = cernSensrTypes ? cernSensrTypes[0] : null;
                                cernSensrType = lastCernSensrType ? lastCernSensrType : null

                                return Resthub.json2("SELECT DISTINCT t.SNSR_CELL FROM hgcal_int2r.hgc_cern_8inch_snsr_cv_v t WHERE t.HPKSNSR = '" + cernSensrType + "' ", null, null, null, RESTHUB_URL)
                                    .then(resp => {
                                        cernSensrCells = resp.data.data;
                                        const lastCernSnsrCell = cernSensrCells ? cernSensrCells[0].snsrCell : null;
                                        cernSensrCell = lastCernSnsrCell ? lastCernSnsrCell : null

                                        return initData();
                                })
                            })
                        })
            }).catch(err => initData());
    }

    static controllerQueryTitle(state) {
        switch (state.filterBy) {
            case 'hamma':
                return `Sensor ID: ${state.hgcal_hamma_sensor_type}  `;
            case 'cern':
            return `Sensor ID: ${state.hgcal_cern_sensor_type}  `;
            default:
                return 'Controller';
        }
    }
    
    validateHammaSensrType = (hammaSensrType) => {
        return this.state.hammaSensrTypes.find(s => s === hammaSensrType);
    }

    onHammaSensrTypeChange = (searchText, index) => {
        const hammaSensrType = this.validateHammaSensrType(searchText);
        if (!hammaSensrType) return;

        this.updateHammaSensrType(hammaSensrType);
        return this.fetchHammaSnsrCells(hammaSensrType);
    }

    updateHammaSensrType = hammaSensrType => {
        let {controllerState} = this.props;
        controllerState.hgcal_hamma_sensor_type = hammaSensrType;
        this.props.updateState(controllerState);
    }

    onHammaSensrTypeUpdate = (searchText) => {
        this.updateHammaSensrType(searchText);

        Resthub.json2("SELECT DISTINCT t.HPKSNSR FROM hgcal_int2r.hgc_hpk_8inch_snsr_cv_v t WHERE t.HPKSNSR LIKE  '%" + searchText + "%' ", null, null, null, RESTHUB_URL)
            .then(response => {
                const hammaSensrTypes = response.data.data;
                this.setState({ hammaSensrTypes: hammaSensrTypes.map(s => s.hpksnsr), errMessage: '' });
            });
    }

    fetchHammaSnsrCells = (hammaSensrType) => {
        return Resthub.json2("SELECT DISTINCT t.MNTRDIODE FROM hgcal_int2r.hgc_hpk_8inch_snsr_cv_v t WHERE t.HPKSNSR = '" + hammaSensrType + "' ", null, null, null, RESTHUB_URL)
            .then(response => {
                const hammaSensrDiods = response.data.data;
                this.updateHammaSnsrCells(hammaSensrDiods);
            });
    }

    updateHammaSnsrCells = (hammaSensrDiods) => {
        let { controllerData } = this.props;
        controllerData.hammaSensrDiods = hammaSensrDiods;
        this.props.updateControllerData(controllerData);

        const hammaSensrCell = hammaSensrDiods ? hammaSensrDiods[0].mntrdiode : null;
        let { controllerState } = this.props;
        controllerState.hgcal_hamma_sensor_cell = hammaSensrCell;
        this.props.updateState(controllerState);

    }

    onHammaSnsrCellChange = event => {
        let { controllerState } = this.props;
        if(event.target.value != null){
            controllerState.hgcal_hamma_sensor_cell = event.target.value;
            this.props.updateState(controllerState);
        } else {
            controllerState.hgcal_hamma_sensor_cell = '';
            return;
        }
    }

    renderHammaSnsrCells = () => {
        const { hammaSensrDiods } = this.props.controllerData;
        if (!hammaSensrDiods.length) {
            return <MenuItem value={null}>None</MenuItem>
        }
        return hammaSensrDiods.map((sensr, index) => {
            return <MenuItem value={sensr.mntrdiode} key={index}>{sensr.mntrdiode}</MenuItem>
        });
    }

    onCernSensrTypeChange = (searchText, index) => {
        const cernSensrType = this.validateCernSensrType(searchText);
        if (!cernSensrType) return;

        this.updateCernSensrType(cernSensrType);
        return this.fetchCernSnsrCells(cernSensrType);
    }

    validateCernSensrType = (cernSensrType) => {
        return this.state.cernSensrTypes.find(s => s === cernSensrType);
    }

    updateCernSensrType = cernSensrType => {
        let {controllerState} = this.props;
        controllerState.hgcal_cern_sensor_type = cernSensrType;
        this.props.updateState(controllerState);
    }

    onCernSensrTypeUpdate = (searchText) => {
        this.updateCernSensrType(searchText);

        Resthub.json2("SELECT DISTINCT t.HPKSNSR FROM hgcal_int2r.hgc_cern_8inch_snsr_cv_v t WHERE t.HPKSNSR LIKE  '%" + searchText + "%' ", null, null, null, RESTHUB_URL)
            .then(response => {
                const cernSensrTypes = response.data.data;
                this.setState({ cernSensrTypes: cernSensrTypes.map(s => s.hpksnsr), errMessage: '' });
            });
    }

    oncernSnsrCellChange = event => {
        let { controllerState } = this.props;
        if(event.target.value != null){
            controllerState.hgcal_cern_sensor_cell = event.target.value;
            this.props.updateState(controllerState);
        } else {
            controllerState.hgcal_cern_sensor_cell = '';
            return;
        }
    }

    renderCernSnsrCells = () => {
        const { cernSensrCells } = this.props.controllerData;
        if (!cernSensrCells.length) {
            return <MenuItem value={null}>None</MenuItem>
        }
        return cernSensrCells.map((sensr, index) => {
            return <MenuItem value={sensr.snsrCell} key={index}>{sensr.snsrCell}</MenuItem>
        });
    }

    fetchCernSnsrCells = (cernSensrType) => {
        return Resthub.json2("SELECT DISTINCT t.SNSR_CELL FROM hgcal_int2r.hgc_cern_8inch_snsr_cv_v t WHERE t.HPKSNSR = '" + cernSensrType + "' ", null, null, null, RESTHUB_URL)
            .then(response => {
                const cernSensrCells = response.data.data;
                this.updateCernSnsrCells(cernSensrCells);
            });
    }

    updateCernSnsrCells = (cernSensrCells) => {
        let { controllerData } = this.props;
        controllerData.cernSensrCells = cernSensrCells;
        this.props.updateControllerData(controllerData);

        const cernSensrCell = cernSensrCells ? cernSensrCells[0].snsrCell : null;
        let { controllerState } = this.props;
        controllerState.hgcal_cern_sensor_cell = cernSensrCell;
        this.props.updateState(controllerState);
    }

    onFilterChange = event => {
        const { value } = event.target;
        let { controllerState } = this.props;
        controllerState.filterBy = value;
        controllerState.hgcal_data = [];
        this.props.updateState(controllerState);
    }

    onIDAdd = () => {
        let { controllerState } = this.props;

        if (controllerState.filterBy === 'hamma'){
            const element = controllerState.hgcal_data.find(item => item.sensrCell === controllerState.hgcal_hamma_sensor_cell);
            if (element) {
                //Snackbar goes here. Inform that this one already `add`ed.
                console.log('Already exist in chips');
                return;
            } else {
                controllerState.hgcal_data.push({sensrType: controllerState.hgcal_hamma_sensor_type, sensrCell: controllerState.hgcal_hamma_sensor_cell});
            }
        } else if (controllerState.filterBy === 'cern'){
            const element = controllerState.hgcal_data.find(item => item.sensrCell === controllerState.hgcal_cern_sensor_cell);
            if (element) {
                //Snackbar goes here. Inform that this one already `add`ed.
                console.log('Already exist in chips');
                return;
            } else {
                controllerState.hgcal_data.push({sensrCell: controllerState.hgcal_cern_sensor_cell, sensrType: controllerState.hgcal_cern_sensor_type });
            }
        }
        this.props.updateState(controllerState);
        return;
    }

    onIDDelete = (sensrCell) => {
        let { controllerState } = this.props;
        controllerState.hgcal_data = controllerState.hgcal_data.filter(item => item.sensrCell !== sensrCell);
        this.props.updateState(controllerState);
    }

    renderChip() {
        return (this.props.controllerState.hgcal_data.map(e => {
            return (
                 <Chip
                     key={e.sensrCell}
                     label={e.sensrCell}
                     onDelete={() => this.onIDDelete(e.sensrCell)}
                     className={this.props.classes.chip}
                 />
             );
         })
        )
    }

    render() {
        const { filterBy} = this.props.controllerState;
        const {classes } = this.props;
        return (
            <div>
                <FormControl component="fieldset">
                    <RadioGroup
                        name="filterBy"
                        className={classes.radioGroup}
                        value={filterBy}
                        onChange={this.onFilterChange}
                    >
                        <FormControlLabel value="hamma" control={<Radio color="primary" />} label="Hammamatsu" className={classes.radioButton} />
                        <FormControlLabel value="cern" control={<Radio color="primary" />} label="CERN" className={classes.radioButton} />
                    </RadioGroup>
                </FormControl>

                <div className={classes.inputContainer}>
                    <AutoComplete
                        label='Sensor Type'
                        value={this.props.controllerState.hgcal_hamma_sensor_type}
                        disabled={filterBy !== 'hamma'}
                        suggestions={this.state.hammaSensrTypes}
                        onInputChange={this.onHammaSensrTypeUpdate}
                        onValueChange={this.onHammaSensrTypeChange}
                        style={styles.autocomplete}
                    />
                    <TextField
                    select
                    label="Sensor Cell"
                    className={classes.selectField}
                    disabled={filterBy !== 'hamma'}
                    InputProps={{ className: classes.textField }}
                    value={this.props.controllerState.hgcal_hamma_sensor_cell}
                    onChange={this.onHammaSnsrCellChange}
                    suggestions={this.state.hammaSensrCells}
                    SelectProps={{
                        MenuProps: {
                            className: classes.itemMenu,
                        }
                    }}
                >
                    {this.renderHammaSnsrCells()}
                </TextField>
                <br />
                <AutoComplete
                        label='Sensor Type'
                        value={this.props.controllerState.hgcal_cern_sensor_type}
                        disabled={filterBy !== 'cern'}
                        suggestions={this.state.cernSensrTypes}
                        onInputChange={this.onCernSensrTypeUpdate}
                        onValueChange={this.onCernSensrTypeChange}
                        style={styles.autocomplete}
                    />
                    <TextField
                    select
                    label="Sensor Cell"
                    className={classes.selectField}
                    disabled={filterBy !== 'cern'}
                    InputProps={{ className: classes.textField }}
                    value={this.props.controllerState.hgcal_cern_sensor_cell}
                    onChange={this.oncernSnsrCellChange}
                    suggestions={this.state.cernSensrCells}
                    SelectProps={{
                        MenuProps: {
                            className: classes.itemMenu,
                        }
                    }}
                >
                    {this.renderCernSnsrCells()}
                </TextField>
                <Button
                    variant="contained"
                    className={classes.button}
                    onClick={this.onIDAdd}>
                    Add Sensor Cells
                </Button>
                </div>
                <div>
                    <Typography variant="subtitle2" gutterBottom style={{ marginTop: 10 }}>
                        Selected cells:
                    </Typography>
                    <div style={styles.wrapper}>
                        {this.renderChip()}
                    </div>
                </div>
            </div>
        )
    }
}
export default withStyles(styles)(Hgcal8InchSensorCVController);
