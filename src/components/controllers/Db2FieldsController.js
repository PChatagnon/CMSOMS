import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import AutoComplete from '../generic/Autocomplete';
import AggProvider from '../providers/AggProvider';
import { ControllerPrevButton, ControllerNextButton } from './ControllerNav';
import Db1FieldController from './Db1FieldController'


const styles = {
    container: {
        marginTop: 20
    }
}



class Db2FieldsController extends Component {


    constructor(props) {
        super();
        this.state = {
            apiError: '',
            suggestions: [[],[]]
        }
    }

    static controllerHeight = 220;

    static controllerInit(urlQuery, controller) {
        return Db1FieldController.initControllerStateData(urlQuery, controller);
    }

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

/*
        all the first field stuff
*/


    onFirstFieldChange = (searchText, index = -1) => {
        const firstField = index === -1 ? searchText : Db1FieldController.validateSelectedValue(this.state.suggestions[0], searchText);
        if (!firstField) return;
        
        this.updateControllerState(0,firstField);

        return Db1FieldController.controllerPromise(this.props.configuration, [firstField])
            .then(response => {
                this.updatePossibleFieldValues(Db1FieldController.extractData( response.data.data, this.props.configuration.fields[1].attribute), 1);
            });
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
  all the second field stuff
*/

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

    onSecondFieldUpdate = (searchText) => {        
        this.updateControllerState(1, searchText);

        let {controllerData} = this.props;
        const fieldValues = [];
        controllerData.allValuesFromDb[1].forEach(value => {
            if (value.startsWith(searchText))
                fieldValues.push(value);
        });

        this.setState(state => { 
            const suggestions = [state.suggestions[0], fieldValues, state.suggestions[2]];
            return { suggestions: suggestions };
        });
    }

    onSecondFieldChange = (searchText, index = -1) => {
        const value = index === -1 ? searchText : Db1FieldController.validateSelectedValue(this.state.suggestions[1], searchText);
        if (!value)
            return;

        this.updateControllerState(1,value);
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
                    maxItems='80'
                    onInputChange={this.onFirstFieldUpdate}
                    onValueChange={this.onFirstFieldChange}
                />
                <ControllerNextButton handleClick={() => this.onFirstFieldShift('right')} />

                <span style={{width:'100px', display:'inline-block'}} />

                <ControllerPrevButton style={{margin_left: '100px'}} handleClick={() => this.onShift('left', 1)} />
                <AutoComplete
                    label={this.props.configuration.fields[1].label}
                    value={this.props.controllerState[this.props.configuration.fields[1].selector].toString()}
                    suggestions={this.state.suggestions[1]}
                    onInputChange={this.onSecondFieldUpdate}
                    onValueChange={this.onSecondFieldChange}
                />
                <ControllerNextButton handleClick={() => this.onShift('right', 1)} />

            </div>

        );
    }
}
export default withStyles(styles)(Db2FieldsController);