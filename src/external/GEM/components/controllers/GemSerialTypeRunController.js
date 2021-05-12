import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import AutoComplete from '../../../../components/generic/Autocomplete';
import AggProvider from '../../../../components/providers/AggProvider';
import { ControllerPrevButton, ControllerNextButton } from '../../../../components/controllers/ControllerNav';
import Db1FieldController from '../../../../components/controllers/Db1FieldController'


const styles = {
    container: {
        marginTop: 20
    }
}



class GemSerialTypeRunController extends Component {


    constructor(props) {
        super();
        this.state = {
            apiError: '',
            suggestions: [[],[],[]]
        }
    }

    static controllerHeight = 220;

    static controllerInit(urlQuery, controller) {
        return Db1FieldController.initControllerStateData(urlQuery, controller)
    }

/*    
        let firstField = '';
        let runType = '', runTypes = [];
        let runNumber = '', runNumbers = [];
        

        let initData = () => {
            const {fields} = controller.configuration;
            const state = {};
            const selectorsFromDb = controller.selectors.map(s => s.name);
            state[fields[0].selector] = selectorsFromDb.includes(fields[0].selector) ? firstField : 'ERROR: bad selector';
            state[fields[1].selector] = selectorsFromDb.includes(fields[1].selector) ? runType : 'ERROR: bad selector';
            state[fields[2].selector] = selectorsFromDb.includes(fields[1].selector) ? runNumber : 'ERROR: bad selector';
            state.firstSelector = {
                label: fields[0].label,
                selector: fields[0].selector
            };
            return {
                data: {
                    runTypes: runTypes,
                    runNumbers: runNumbers
                },
                state: state
            }
        }

        return Db1FieldController.controllerPromise(controller.configuration, [])
        .then(resp => {
            const firstFields = Db1FieldController.extractData(resp.data.data, controller.configuration.fields[0].attribute);
            firstField = firstFields.length > 0 ? firstFields[0] : null;

            return Db1FieldController.controllerPromise(controller.configuration, [firstField])            
                .then(resp => {
                    runTypes = Db1FieldController.extractData(resp.data.data, controller.configuration.fields[1].attribute);                    
                    runType = runTypes.length > 0 ? runTypes[0] : '';

                    return Db1FieldController.controllerPromise(controller.configuration, [firstField, runType])
                        .then(resp => {
                            runNumbers = Db1FieldController.extractData(resp.data.data, controller.configuration.fields[2].attribute);
                            runNumber = runNumbers.length > 0 ? runNumbers[0] : '';
                            return initData();
                        })
                })
        }).catch(err => initData());
}
*/

    static controllerQueryTitle(state) {
        return Db1FieldController.controllerQueryTitle(state);
    }

    static controllerStateToQuery(state) {
        return Db1FieldController.controllerStateToQuery(state);
    }
    

    updateControllerState = (fieldIndex, value) => {
        let {controllerState} = this.props;
        controllerState[this.props.configuration.fields[fieldIndex].selector] = value;
        this.props.updateState(controllerState);
    }


    updatePossibleFieldValues = (fieldValues, fieldIndex) => {
        let {controllerData} = this.props;
        const allValuesFromDb = Array(controllerData.allValuesFromDb.length);
        for ( let i = 0; i < allValuesFromDb.length; i++ ) {
            allValuesFromDb[i] = i === fieldIndex ? fieldValues : controllerData.allValuesFromDb[i];
        }
        controllerData.allValuesFromDb = allValuesFromDb;
        this.props.updateControllerData(controllerData);

        const value = fieldValues && fieldValues.length > 0 ? fieldValues[0] : '';
        this.updateControllerState(fieldIndex, value);

        this.setState(state => { 
            const suggestions = Array(state.suggestions.length);
            for ( let i = 0; i < suggestions.length; i++) {
                suggestions[i] = i === fieldIndex ? fieldValues : state.suggestions[i];
            }
            return { suggestions: suggestions };
        });
    }

    onShift = (side, fieldIndex) => {
        const values = this.props.controllerData.allValuesFromDb[fieldIndex];
        let index = values.indexOf( this.props.controllerState[this.props.configuration.fields[fieldIndex].selector] );

        if ( side === 'right' ) {
            index += 1;
            if (index >= values.length)
                return;   // no next value
        }
        else {
            index -= 1;
            if (index < 0)
                return; // no previous value
        }
        if (fieldIndex === 1)
            this.onSecondFieldChange( values[index] );
        else if (fieldIndex === 2)
            this.onThirdFieldChange( values[index] );
    }

    onFieldUpdate = (searchText, fieldIndex) => {        
        this.updateControllerState(fieldIndex, searchText);

        let {controllerData} = this.props;
        const fieldValues = [];
        controllerData.allValuesFromDb[fieldIndex].forEach(value => {
            if (value.startsWith(searchText))
                fieldValues.push(value);
        });

        this.setState(state => { 
            const suggestions = Array(state.suggestions.length);
            for ( let i = 0; i < suggestions.length; i++) {
                suggestions[i] = i === fieldIndex ? fieldValues : state.suggestions[i];
            }
            return { suggestions: suggestions };
        });
    }

/*
        all the first field stuff
*/


    onFirstFieldChange = (searchText, index = -1) => {
        const firstField = index === -1 ? searchText : Db1FieldController.validateSelectedValue(this.state.suggestions[0], searchText);
        if (!firstField) return;
        
        this.updateControllerState(0,firstField);
        return this.updateFieldFromDb(1).then(response => this.updateFieldFromDb(2));
    }

    onFirstFieldUpdate = (searchText) => {
        this.updateControllerState(0, searchText);
       
        return Db1FieldController.controllerPromise(this.props.configuration, [], searchText)
        .then(response => {
            const firstFieldSuggestions = Db1FieldController.reduceAutocompleteItems(Db1FieldController.extractData( response.data.data, this.props.configuration.fields[0].attribute));
            this.setState(state => { 
                const suggestions = [firstFieldSuggestions,state.suggestions[1], state.suggestions[2]];
                return { suggestions: suggestions, apiError: '' };
            });
        });
    }

    onFirstFieldShift = (side) => {
        const fieldValue = this.props.controllerState[this.props.configuration.fields[0].selector];
        this.shiftFromDb(fieldValue, side).then(fieldValue => this.onFirstFieldChange(fieldValue));
    }


    shiftFromDb = (fieldValue, side = 'right') => {
        if (fieldValue === '') return Promise.resolve();

        return AggProvider.fetch(this.props.configuration.endpoint, Db1FieldController.getQueryParamsForShift(side, fieldValue, this.props.configuration) )
            .then(response => {
                const rows = response.data.data;
                return (rows.length > 0) ? rows[0].attributes[this.props.configuration.fields[0].attribute] : null;
            });
    }
 
/*
    second field
*/

    updateRunTypes = (runTypes) => {
        let {controllerData} = this.props;
        controllerData.runTypes = runTypes;
        this.props.updateControllerData(controllerData);

        const runType = runTypes && runTypes.length > 0 ? runTypes[0] : '';
        this.updateControllerState(1, runType);

        this.setState(state => { 
            const suggestions = [state.suggestions[0], runTypes, state.suggestions[2]];
            return { suggestions: suggestions };
        });
        this.loadRunNumbers(this.props.controllerState[this.props.configuration.fields[0].selector], runType);
    }

    onSecondFieldUpdate = (searchText) => {   
        this.onFieldUpdate(searchText, 1);     
    }

    onSecondFieldChange = (searchText, index = -1) => {       
        const value = index === -1 ? searchText : Db1FieldController.validateSelectedValue(this.state.suggestions[1], searchText);
        if (!value)
            return;
    
        this.updateControllerState(1,value);
        this.updateFieldFromDb(2);
    }


/*

    run numbers

*/

    updateFieldFromDb = (fieldIndex) => {
        let {controllerState} = this.props;
        let currentFieldValues = Array(fieldIndex);
        for (let i = 0; i < fieldIndex; i++ )
            currentFieldValues[i] = controllerState[this.props.configuration.fields[i].selector];
        return Db1FieldController.controllerPromise(this.props.configuration, currentFieldValues)
            .then(response => {
                const allowedValues = Db1FieldController.extractData( response.data.data, this.props.configuration.fields[fieldIndex].attribute);
                this.updatePossibleFieldValues(allowedValues, fieldIndex);
                const currentValue = controllerState[this.props.configuration.fields[fieldIndex].selector];
                if (Db1FieldController.validateSelectedValue(allowedValues, currentValue) === '') {
                    if (allowedValues.length > 0)
                        controllerState[this.props.configuration.fields[fieldIndex].selector] = allowedValues[0];
                    else
                        controllerState[this.props.configuration.fields[fieldIndex].selector] = '';
                    this.props.updateState(controllerState);
                }
            })
    }


    onThirdFieldUpdate = (searchText) => {   
        this.onFieldUpdate(searchText, 2);     
    }


    onThirdFieldChange = (searchText, index = -1) => {       
        const value = index === -1 ? searchText : Db1FieldController.validateSelectedValue(this.state.suggestions[2], searchText);
        if (!value)
            return;
    
        this.updateControllerState(2,value);
    }

    render() {
        const { classes } = this.props;
        return (
            <div className={classes.root}>
                <ControllerPrevButton handleClick={() => this.onFirstFieldShift('left')} />
                <AutoComplete
                    label={this.props.configuration.fields[0].label}
                    value={this.props.controllerState[this.props.configuration.fields[0].selector].toString()}
                    suggestions={this.state.suggestions[0]}
                    maxItems='20'
                    onInputChange={this.onFirstFieldUpdate}
                    onValueChange={this.onFirstFieldChange}
                />
                <ControllerNextButton handleClick={() => this.onFirstFieldShift('right')} />

                <span style={{width:'100px', display:'inline-block'}} />

                <ControllerPrevButton style={{margin_left: '100px'}} handleClick={() => this.onShift('left', 1)} />
                <AutoComplete style={{ width: '300px' }}
                    label={this.props.configuration.fields[1].label}
                    value={this.props.controllerState[this.props.configuration.fields[1].selector].toString()}
                    suggestions={this.state.suggestions[1]}
                    onInputChange={this.onSecondFieldUpdate}
                    onValueChange={this.onSecondFieldChange}
                />
                <ControllerNextButton handleClick={() => this.onShift('right', 1)} />

                <span style={{width:'100px', display:'inline-block'}} />

                <ControllerPrevButton handleClick={() => this.onShift('left', 2)} />
                <AutoComplete
                    label={this.props.configuration.fields[2].label}
                    value={this.props.controllerState[this.props.configuration.fields[2].selector].toString()}
                    suggestions={this.state.suggestions[2]}
                    onInputChange={this.onThirdFieldUpdate}
                    onValueChange={this.onThirdFieldChange}
                />
                <ControllerNextButton handleClick={() => this.onShift('right', 2)} />
            </div>

        );
    }
}
export default withStyles(styles)(GemSerialTypeRunController);