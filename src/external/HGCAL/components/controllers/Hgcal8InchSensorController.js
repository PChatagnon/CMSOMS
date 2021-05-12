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

class Hgcal8InchSensorController extends Component {


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
        let hammaSensrCell = '', hammaSnsrCells = [];
        let filterBy = 'hamma';
        let cernSensrType = '', lastCernSensrType = '';
        let cernSensrCell = '', cernSensrCells = [];
        let sensrType = '', lastSensrType = '';
        let sensrTypes = [], sensrCells = [];
        let sensrCell = '', lastSensrCell = '';

      
        let initData = () => {
            return {
                data: {
                    hammaSnsrCells: hammaSnsrCells,
                    cernSensrCells: cernSensrCells,
                    sensrTypes: sensrTypes,
                    sensrCells: sensrCells                    
                   
                },
                state: {
                    filterBy: filterBy,
                    hgcal_hamma_sensor_type : hammaSensrType,
                    hgcal_hamma_sensor_cell : hammaSensrCell,
                    hgcal_cern_sensor_type : cernSensrType,
                    hgcal_cern_sensor_cell: cernSensrCell,
                    hgcal_sensor_type: sensrType,
                    hgcal_sensor_cell: sensrCell,
                    hgcal_data: []
                },
            }
        }

        return Resthub.json2("SELECT DISTINCT t.HPKSNSR FROM hgcal_int2r.hgc_hpk_8inch_snsr_iv_v t ORDER BY t.HPKSNSR DESC ", null, null, null, RESTHUB_URL)
            .then(resp => {
                const respData = resp.data.data;
                const hammaSensrTypes = respData.length ? respData.map(s => s.hpksnsr) : null;
                lastHammaSensrType = hammaSensrTypes ? hammaSensrTypes[0] : null;
                hammaSensrType = lastHammaSensrType ? lastHammaSensrType : null
                return Resthub.json2("SELECT DISTINCT t.SNSRCELL FROM hgcal_int2r.hgc_hpk_8inch_snsr_iv_v t WHERE t.HPKSNSR = '" + hammaSensrType + "' ", null, null, null, RESTHUB_URL)
                    .then(resp => {
                        hammaSnsrCells = resp.data.data;
                        const lastSnsrCell = hammaSnsrCells ? hammaSnsrCells[0].snsrcell : null;
                        hammaSensrCell = lastSnsrCell ? lastSnsrCell : null

                        return Resthub.json2("SELECT DISTINCT t.HPKSNSR FROM hgcal_int2r.hgc_cern_8inch_snsr_iv_v t ORDER BY t.HPKSNSR DESC ", null, null, null, RESTHUB_URL)
                            .then(resp => {
                                const respData = resp.data.data;
                                const cernSensrTypes = respData.length ? respData.map(s => s.hpksnsr) : null;
                                lastCernSensrType = cernSensrTypes ? cernSensrTypes[0] : null;
                                cernSensrType = lastCernSensrType ? lastCernSensrType : null

                                return Resthub.json2("SELECT DISTINCT t.SNSRCELL FROM hgcal_int2r.hgc_cern_8inch_snsr_iv_v t WHERE t.HPKSNSR = '" + cernSensrType + "' ", null, null, null, RESTHUB_URL)
                                    .then(resp => {
                                        cernSensrCells = resp.data.data;
                                        const lastCernSnsrCell = cernSensrCells ? cernSensrCells[0].snsrcell : null;
                                        cernSensrCell = lastCernSnsrCell ? lastCernSnsrCell : null
                                        let compareSensrTypes = [];
                                        hammaSensrTypes.forEach((e1)=>cernSensrTypes.forEach((e2)=> {
                                            if(e1 === e2){
                                                compareSensrTypes.push(e1)
                                            }
                                        }));
                                        lastSensrType = compareSensrTypes ? compareSensrTypes[0] : null;
                                        sensrType = lastSensrType ? lastSensrType : null

                                        return Resthub.json2("SELECT DISTINCT t.SNSRCELL FROM hgcal_int2r.hgc_cern_8inch_snsr_iv_v t WHERE t.HPKSNSR = '" + sensrType + "' ", null, null, null, RESTHUB_URL)
                                            .then(resp => {
                                                const tempCernCells = resp.data.data;

                                                return Resthub.json2("SELECT DISTINCT t.SNSRCELL FROM hgcal_int2r.hgc_hpk_8inch_snsr_iv_v t WHERE t.HPKSNSR = '" + sensrType + "' ", null, null, null, RESTHUB_URL)
                                                    .then(resp => {
                                                        const tempHpkCells = resp.data.data;
                                                        
                                                        let compareSensrCells = [];
                                                        tempCernCells.forEach((e1)=>tempHpkCells.forEach((e2)=> {
                                                            if(e1.snsrcell === e2.snsrcell){
                                                                compareSensrCells.push(e1)
                                                            }
                                                        }));
                                                        sensrCells = compareSensrCells;
                                                        lastSensrCell = compareSensrCells ? compareSensrCells[0] : null;
                                                        sensrCell = lastSensrCell ? lastSensrCell.snsrcell : null

                                                        return initData();
                                                    })
                                        })
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
            case 'compare':
                return `Sensor ID: ${state.hgcal_sensor_type}`;
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

        Resthub.json2("SELECT DISTINCT t.HPKSNSR FROM hgcal_int2r.hgc_hpk_8inch_snsr_iv_v t WHERE t.HPKSNSR LIKE  '%" + searchText + "%' ", null, null, null, RESTHUB_URL)
            .then(response => {
                const hammaSensrTypes = response.data.data;
                this.setState({ hammaSensrTypes: hammaSensrTypes.map(s => s.hpksnsr), errMessage: '' });
            });
    }

    fetchHammaSnsrCells = (hammaSensrType) => {
        return Resthub.json2("SELECT DISTINCT t.SNSRCELL FROM hgcal_int2r.hgc_hpk_8inch_snsr_iv_v t WHERE t.HPKSNSR = '" + hammaSensrType + "' ", null, null, null, RESTHUB_URL)
            .then(response => {
                const hammaSnsrCells = response.data.data;
                this.updateHammaSnsrCells(hammaSnsrCells);
            });
    }

    updateHammaSnsrCells = (hammaSnsrCells) => {
        let { controllerData } = this.props;
        controllerData.hammaSnsrCells = hammaSnsrCells;
        this.props.updateControllerData(controllerData);

        const hammaSensrCell = hammaSnsrCells ? hammaSnsrCells[0].snsrcell : null;
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
        const { hammaSnsrCells } = this.props.controllerData;
        if (!hammaSnsrCells.length) {
            return <MenuItem value={null}>None</MenuItem>
        }
        return hammaSnsrCells.map((sensr, index) => {
            return <MenuItem value={sensr.snsrcell} key={index}>{sensr.snsrcell}</MenuItem>
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

        Resthub.json2("SELECT DISTINCT t.HPKSNSR FROM hgcal_int2r.hgc_cern_8inch_snsr_iv_v t WHERE t.HPKSNSR LIKE  '%" + searchText + "%' ", null, null, null, RESTHUB_URL)
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
            return <MenuItem value={sensr.snsrcell} key={index}>{sensr.snsrcell}</MenuItem>
        });
    }

    fetchCernSnsrCells = (cernSensrType) => {
        return Resthub.json2("SELECT DISTINCT t.SNSRCELL FROM hgcal_int2r.hgc_cern_8inch_snsr_iv_v t WHERE t.HPKSNSR = '" + cernSensrType + "' ", null, null, null, RESTHUB_URL)
            .then(response => {
                const cernSensrCells = response.data.data;
                this.updateCernSnsrCells(cernSensrCells);
            });
    }

    updateCernSnsrCells = (cernSensrCells) => {
        let { controllerData } = this.props;
        controllerData.cernSensrCells = cernSensrCells;
        this.props.updateControllerData(controllerData);

        const cernSensrCell = cernSensrCells ? cernSensrCells[0].snsrcell : null;
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


    updateSensrType = sensrType => {
        let {controllerState} = this.props;
        controllerState.hgcal_sensor_type = sensrType;
        this.props.updateState(controllerState);
    }

    onSensrTypeUpdate = (searchText) => {
        this.updateSensrType(searchText);
        const compareSensrTypes = [];
        Resthub.json2("SELECT DISTINCT t.HPKSNSR FROM hgcal_int2r.hgc_hpk_8inch_snsr_iv_v t WHERE t.HPKSNSR LIKE  '%" + searchText + "%' ", null, null, null, RESTHUB_URL)
            .then(response => {
                const hammaSensrTypes = response.data.data;

                Resthub.json2("SELECT DISTINCT t.HPKSNSR FROM hgcal_int2r.hgc_cern_8inch_snsr_iv_v t WHERE t.HPKSNSR LIKE  '%" + searchText + "%' ", null, null, null, RESTHUB_URL)
                    .then(resp => {
                        const cernSensrTypes = resp.data.data;
                        cernSensrTypes.forEach((e1)=>hammaSensrTypes.forEach((e2)=> {
                            if(e1.hpksnsr === e2.hpksnsr){
                                compareSensrTypes.push(e1)
                            }
                        }
                    ))
                    
                    this.setState({ compareSensrTypes: compareSensrTypes.map(s => s.hpksnsr), errMessage: '' });
                    })
            });
    }

    onSensrTypeChange = (searchText, index) => {
        const sensrType = this.validateSensrType(searchText);
        if (!sensrType) return;

        let { controllerState } = this.props;
        controllerState.hgcal_sensor_type = sensrType;
        this.props.updateState(controllerState);
        return this.fetchSnsrCells(sensrType);
    }
 
    validateSensrType = (sensrType) => {
        return this.state.compareSensrTypes.find(s => s === sensrType);
    }

    fetchSnsrCells = (sensrType) => {
        return Resthub.json2("SELECT DISTINCT t.SNSRCELL FROM hgcal_int2r.hgc_hpk_8inch_snsr_iv_v t WHERE t.HPKSNSR = '" + sensrType + "' ", null, null, null, RESTHUB_URL)
            .then(response => {
                const hammaSnsrCells = response.data.data;

                return Resthub.json2("SELECT DISTINCT t.SNSRCELL FROM hgcal_int2r.hgc_cern_8inch_snsr_iv_v t WHERE t.HPKSNSR = '" + sensrType + "' ", null, null, null, RESTHUB_URL)
            .then(response => {
                const cernSnsrCells = response.data.data;

                let compareSensrCells = [];
                cernSnsrCells.forEach((e1)=>hammaSnsrCells.forEach((e2)=> {
                    if(e1.snsrcell === e2.snsrcell){
                        compareSensrCells.push(e1)
                    }
                }
                ));
                this.updateSnsrCells(compareSensrCells);

            })
        });
    }

    updateSnsrCells = (compareSensrCells) => {
        let { controllerData } = this.props;
        controllerData.sensrCells = compareSensrCells;
        this.props.updateControllerData(controllerData);

        const sensrCell = compareSensrCells ? compareSensrCells[0].snsrcell : null;
        let { controllerState } = this.props;
        controllerState.hgcal_sensor_cell = sensrCell;
        this.props.updateState(controllerState);
    }

    onSnsrCellChange = event => {
        let { controllerState } = this.props;
        if(event.target.value != null){
            controllerState.hgcal_sensor_cell = event.target.value;
            this.props.updateState(controllerState);
        } else {
            controllerState.hgcal_sensor_cell = '';
            return;
        }
    }

    renderSnsrCells = () => {
        const { sensrCells } = this.props.controllerData;
        if (!sensrCells.length) {
            return <MenuItem value={null}>None</MenuItem> 
        }
        return sensrCells.map((sensr, index) => {
            return <MenuItem value={sensr.snsrcell} key={index}>{sensr.snsrcell}</MenuItem>
        });
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
        } else {
            const element = controllerState.hgcal_data.find(item => item.sensrCell === controllerState.hgcal_sensor_cell);
            if (element) {
                //Snackbar goes here. Inform that this one already `add`ed.
                console.log('Already exist in chips');
                return;
            } else {
                controllerState.hgcal_data.push({ sensrType: controllerState.hgcal_sensor_type, sensrCell: controllerState.hgcal_sensor_cell});
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
                        <FormControlLabel value="compare" control={<Radio color="primary" />} label="Compare Hammamatsu/CERN" className={classes.radioButton} />
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
                <br />
                <AutoComplete
                        label='Sensor Type'
                        value={this.props.controllerState.hgcal_sensor_type}
                        disabled={filterBy !== 'compare'}
                        suggestions={this.state.compareSensrTypes}
                        onInputChange={this.onSensrTypeUpdate}
                        onValueChange={this.onSensrTypeChange}
                        style={styles.autocomplete}
                    />
                    <TextField
                    select
                    label="Sensor Cell"
                    className={classes.selectField}
                    disabled={filterBy !== 'compare'}
                    InputProps={{ className: classes.textField }}
                    value={this.props.controllerState.hgcal_sensor_cell}
                    onChange={this.onSnsrCellChange}
                    suggestions={this.state.sensrCells}
                    SelectProps={{
                        MenuProps: {
                            className: classes.itemMenu,
                        }
                    }}
                >
                    {this.renderSnsrCells()}
                </TextField>
                <Button
                    variant="contained"
                    disabled={filterBy === 'compare'}
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
export default withStyles(styles)(Hgcal8InchSensorController);
