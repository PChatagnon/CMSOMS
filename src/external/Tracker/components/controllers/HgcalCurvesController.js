import React, { Component } from 'react';
import AutoComplete from '../../../../components/generic/Autocomplete';
import MenuItem from '@material-ui/core/MenuItem';
import Resthub from '../../../../components/providers/Resthub';
import Chip from '@material-ui/core/Chip';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import FaceIcon from '@material-ui/icons/Face';

const styles = {
    container: {
        marginTop: 5,
    },
    selectField: {
        marginLeft: 20,
        fontSize: 14,
        width: 200,
    },
    autoComplete: {
        display: 'inline-block',
        width: 200,
    },
    autoCompleteMenu: {
        fontSize: 13,
        marginTop: 20
    },
    textField: {
        width: 200,
        fontSize: 14,
    },
    chip: {
        margin: 4,
    },
    wrapper: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    button: {
        marginTop: 10,
        marginLeft: 10
    }
}

const RESTHUB_URL = '/hgcal-resthub';

class HgcalCurvesController extends Component {

    static controllerHeight = 255;

    constructor() {
        super();
        this.state = {
            errMessage: '',
            sensrTypes: [],
            url: ''
        }
    }

    static controllerInit(urlQuery, controller) {

        let sensrType = '', lastSensrType = '';
        let sensrId = '', sensrIds = [];
        let childType = '', childTypes = [];
        let childId = '', childIds = [];
        let selectedIds = [];

        let initData = () => {
            return {
                data: {
                    sensrIds: sensrIds,
                    childTypes: childTypes,
                    childIds: childIds
                },
                state: {
                    hgcal_sensrType : sensrType,
                    hgcal_sensrId: sensrId,
                    hgcal_childType: childType,
                    hgcal_childId: childId,
                    hgcal_Data: selectedIds
                },

            }
        }
        let { url } = controller.configuration;
        return Resthub.json2("SELECT t.SNSR_TYPE FROM " + url + " t ORDER BY t.SNSR_TYPE DESC ", null, 1, 1, RESTHUB_URL)
            .then(resp => {
                const respData = resp.data.data;
                const sensrTypes = respData.length ? respData.map(s => s.snsrType) : null;
                lastSensrType = sensrTypes ? sensrTypes[0] : null;
                sensrType = lastSensrType ? lastSensrType : null 

                return Resthub.json2("SELECT DISTINCT t.SNSR_SER_NUM FROM " + url + " t WHERE t.SNSR_TYPE = '" + sensrType + "' ", null, null, null, RESTHUB_URL)
                    .then(resp => {
                        sensrIds = resp.data.data;
                        const lastSensrId = sensrIds ? sensrIds[0].snsrSerNum : null;
                        sensrId = lastSensrId ? lastSensrId : null

                        return Resthub.json2("SELECT DISTINCT t.CHLD_TYPE FROM " + url + " t WHERE t.SNSR_SER_NUM = '" + sensrId + "' AND t.SNSR_TYPE = '" + sensrType + "' ", null, null, null, RESTHUB_URL)
                            .then(resp => {
                                childTypes = resp.data.data;
                                const lastChildType = childTypes ? childTypes[0].chldType : null;
                                childType = lastChildType ? lastChildType : null

                                return Resthub.json2("SELECT DISTINCT t.CHLD_SER_NUM FROM " + url + " t WHERE t.SNSR_TYPE = '" + sensrType + "' AND t.SNSR_SER_NUM = '" + sensrId + "' AND t.CHLD_TYPE = '" + childType + "' ", null, null, null, RESTHUB_URL)
                                .then(resp => {
                                    childIds = resp.data.data;
                                    const lastChildId = childIds ? childIds[0].chldSerNum : null;
                                    childId = lastChildId ? lastChildId : null

                                    return initData();
                                })
                            })
                    })
            }).catch(err => initData());
    }

    static controllerQueryTitle(state) {
        return `Sensor ID: ${state.hgcal_sensrType}  `;
    }

    updateChildTypes = (childTypes) => {
        let { controllerData } = this.props;
        controllerData.childTypes = childTypes;
        this.props.updateControllerData(controllerData);

        const childType = childTypes ? childTypes[0].chldType : null;
        let { controllerState } = this.props;
        controllerState.hgcal_childType = childType;
        this.props.updateState(controllerState);

        const sensrType = controllerState.hgcal_sensrType;
        const sensrId = controllerState.hgcal_sensrId;
        this.fetchChildIds(sensrType, sensrId, childType);
    }

    updateSensIds = (sensrIds) => {
        let { controllerData } = this.props;
        controllerData.sensrIds = sensrIds;
        this.props.updateControllerData(controllerData);

        const sensrId = sensrIds ? sensrIds[0].snsrSerNum : null;
        let { controllerState } = this.props;
        controllerState.hgcal_sensrId = sensrId;
        this.props.updateState(controllerState);

        const sensrType = controllerState.hgcal_sensrType;
        this.fetchChildTypes(sensrType, sensrId);
    }

    updateChildIds = (childIds) => {
        let { controllerData } = this.props;
        controllerData.childIds = childIds;
        this.props.updateControllerData(controllerData);

        const childId = childIds ? childIds[0].chldSerNum : null;
        let { controllerState } = this.props;
        controllerState.hgcal_childId = childId;
        this.props.updateState(controllerState);

    }

    fetchChildTypes = (sensrType, sensrId) => {
        return Resthub.json2("SELECT DISTINCT t.CHLD_TYPE FROM " + this.props.configuration.url + " t WHERE t.SNSR_TYPE = '" + sensrType + "' AND t.SNSR_SER_NUM = '" + sensrId + "' ", null, null, null, RESTHUB_URL)
            .then(response => {
                const childTypes = response.data.data;
                this.updateChildTypes(childTypes);
            });
    }

    fetchChildIds = (sensrType, sensrId, childType) => {
        return Resthub.json2("SELECT DISTINCT t.CHLD_SER_NUM FROM " + this.props.configuration.url + " t WHERE t.SNSR_TYPE = '" + sensrType + "' AND t.SNSR_SER_NUM = '" + sensrId + "' AND t.CHLD_TYPE = '" + childType + "' ", null, null, null, RESTHUB_URL)
            .then(response => {
                const childIds = response.data.data;
                this.updateChildIds(childIds);
            });
    }

    fetchSensIds = (sensrType) => {
        return Resthub.json2("SELECT DISTINCT t.SNSR_SER_NUM FROM " + this.props.configuration.url + " t WHERE t.SNSR_TYPE = '" + sensrType + "' ", null, null, null, RESTHUB_URL)
            .then(response => {
                const sensrIds = response.data.data;
                this.updateSensIds(sensrIds);
            });
    }

    validateSensrType = (sensrType) => {
        return this.state.sensrTypes.find(s => s === sensrType);
    }

    onSensrTypeChange = (searchText, index) => {
        const sensrType = this.validateSensrType(searchText);
        if (!sensrType) return;

        let { controllerState } = this.props;
        controllerState.hgcal_sensrType = sensrType;
        this.props.updateState(controllerState);
        return this.fetchSensIds(sensrType);
    }

    updateSensrType = sensrType => {
        let {controllerState} = this.props;
        controllerState.hgcal_sensrType = sensrType;
        this.props.updateState(controllerState);
    }

    onSensrTypeUpdate = (searchText) => {
        this.updateSensrType(searchText);

        Resthub.json2("SELECT DISTINCT t.SNSR_TYPE FROM " + this.props.configuration.url + " t WHERE t.SNSR_TYPE LIKE  '%" + searchText + "%' ", null, null, null, RESTHUB_URL)
            .then(response => {
                const sensrTypes = response.data.data;
                this.setState({ sensrTypes: sensrTypes.map(s => s.snsrType), errMessage: '' });
            });
    }

    renderSensrIds = () => {
        const { sensrIds } = this.props.controllerData;
        if (!sensrIds.length) {
            return <MenuItem value={null}>None</MenuItem>
        }
        return sensrIds.map((sensr, index) => {
            return <MenuItem value={sensr.snsrSerNum} key={index}>{sensr.snsrSerNum}</MenuItem>
        });
    }

    renderChildTypes = () => {
        const { childTypes } = this.props.controllerData;
        if (!childTypes.length) {
            return <MenuItem value={null}>None</MenuItem>
        }
        return childTypes.map((sensr, index) => {
            return <MenuItem value={sensr.chldType} key={index}>{sensr.chldType}</MenuItem>
        });
    }

    renderChildIds = () => {
        const { childIds } = this.props.controllerData;
        if (!childIds.length) {
            return <MenuItem value={null}>None</MenuItem>
        }
        return childIds.map((chld, index) => {
            return <MenuItem value={chld.chldSerNum} key={index}>{chld.chldSerNum}</MenuItem>
        });
    }

    onSensrIdChange = event => {
        let { controllerState } = this.props;
        if(event.target.value != null){
            controllerState.hgcal_sensrId = event.target.value;
            this.props.updateState(controllerState);
            const sensrType = controllerState.hgcal_sensrType;
            this.fetchChildTypes(sensrType, event.target.value);
        } else {
            controllerState.hgcal_sensrId = '';
            return;
        }
    }

    onChildTypeChange = event => {
        let { controllerState } = this.props;
        if(event.target.value != null){
            controllerState.hgcal_childType = event.target.value;
            this.props.updateState(controllerState);
            const sensrType = controllerState.hgcal_sensrType;
            const sensrId = controllerState.hgcal_sensrId;
            this.fetchChildIds(sensrType, sensrId, event.target.value);
        } else {
            controllerState.hgcal_childType = '';
            return;
        }
    }

    onChildIdhange = event => {
        let { controllerState } = this.props;
        if(event.target.value != null){
            controllerState.hgcal_childId = event.target.value;
            this.props.updateState(controllerState);
        } else {
            controllerState.hgcal_childId = '';
            return;
        }
    }

    onIDAdd = () => {
        
        let { controllerState } = this.props;
        const element = controllerState.hgcal_Data.find(item => item.childId === controllerState.hgcal_childId);
        if (element) {
            //Snackbar goes here. Inform that this one already `add`ed.
            return;
        } else {
            controllerState.hgcal_Data.push({ childId: controllerState.hgcal_childId, snsrType: controllerState.hgcal_sensrType,
            sensrId: controllerState.hgcal_sensrId, childType: controllerState.hgcal_childType });
        }


        this.props.updateState(controllerState);
        return;
    }

    onIDDelete = (childId) => {
        let { controllerState } = this.props;
        controllerState.hgcal_Data = controllerState.hgcal_Data.filter(item => item.childId !== childId);
        this.props.updateState(controllerState);
    }

    renderChip = () => {
       return (this.props.controllerState.hgcal_Data.map(e => {
           return (
                <Chip
                    key={e.childId}
                    icon={<FaceIcon />}
                    label={e.childId}
                    onDelete={() => this.onIDDelete(e.childId)}
                    className={this.props.classes.chip}
                />
            );
        })
       )
    }

    render() {
        const { classes } = this.props;
        return (
            <div style={styles.container} >
                <AutoComplete
                label='Sensor Type'
                value={this.props.controllerState.hgcal_sensrType}
                suggestions={this.state.sensrTypes}
                onInputChange={this.onSensrTypeUpdate}
                onValueChange={this.onSensrTypeChange}
                style={styles.autoComplete}
                />
                <TextField
                    select
                    label="Sensor ID"
                    value={this.props.controllerState.hgcal_sensrId}
                    className={classes.selectField}
                    InputProps={{ className: classes.textField }}
                    onChange={this.onSensrIdChange}
                    SelectProps={{
                        MenuProps: {
                            className: classes.itemMenu,
                        },
                    }}
                >
                    {this.renderSensrIds()}
                </TextField>
                <TextField
                    select
                    label="Child Type"
                    value={this.props.controllerState.hgcal_childType}
                    className={classes.selectField}
                    InputProps={{ className: classes.textField }}
                    onChange={this.onChildTypeChange}
                    SelectProps={{
                        MenuProps: {
                            className: classes.itemMenu,
                        },
                    }}
                >
                    {this.renderChildTypes()}
                </TextField>
                <TextField
                    select
                    label="Child ID"
                    value={this.props.controllerState.hgcal_childId}
                    className={classes.selectField}
                    InputProps={{ className: classes.textField }}
                    onChange={this.onChildIdhange}
                    SelectProps={{
                        MenuProps: {
                            className: classes.itemMenu,
                        },
                    }}
                >
                    {this.renderChildIds()}
                </TextField>
                <Button
                    variant="contained"
                    className={classes.button}
                    onClick={this.onIDAdd}>
                    Add ID
                </Button>
                <br />
                <div>
                    <Typography variant="subtitle2" gutterBottom style={{ marginTop: 10 }}>
                        Selected Ids:
                    </Typography>
                    <div style={styles.wrapper}>
                        {this.renderChip()}
                    </div>
                </div>
                
            </div >
        );
    }
}
export default withStyles(styles)(HgcalCurvesController);
