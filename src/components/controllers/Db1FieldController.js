import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import AutoComplete from '../generic/Autocomplete';
import AggProvider from '../providers/AggProvider';
import { ControllerPrevButton, ControllerNextButton } from './ControllerNav';


const styles = {
    container: {
        marginTop: 20
    }
}



export class Db1FieldController extends Component {


    constructor(props) {
        super();
        this.state = {
            apiError: '',
            suggestions: [[]]
        }
    }

    static controllerHeight = 220;

    static controllerPromise(configuration, values, like = null) {

        const params = {};
        if ( configuration.aggpath )
            params.aggpath = configuration.aggpath;

        const fieldsIndex = values.length;
        
        params.sorting = [configuration.fields[fieldsIndex].attribute];
        params.filters = [];
        
        if (like && fieldsIndex === 0) {
            params.filters.push( {attribute: configuration.fields[0].attribute, operator: 'LIKE', value: like} )
        } else {
            for (let i = 0; i < values.length; i++) {
                params.filters.push( { attribute: configuration.fields[i].attribute, operator: 'EQ', value: values[i]});
            }
        }
        const allParams = { ...params };
        params.fields = [configuration.fields[fieldsIndex].attribute];
        params.pagesize = 1000;
        params.page = 1;

        const endpoint = 'endpoint' in configuration.fields[fieldsIndex] ? configuration.fields[fieldsIndex]['endpoint'] : configuration.endpoint;
        return AggProvider.fetch(endpoint + '/all' + configuration.fields[fieldsIndex].attribute + 's', allParams)
            .catch(error => AggProvider.fetch(configuration.endpoint, params));
    }


    static extractData(dbData, attribute) {
        let dest = [];
        if (dbData.type === 'all' + attribute + 's') 
            return dbData.attributes[attribute].map(value => value.toString());
        else {
            dbData.forEach(row => {
                let t = row.attributes[attribute].toString();
                if ( !dest.includes(t) )
                    dest.push( t );
            });
        } 
        return dest;
    }

    static reduceAutocompleteItems( items, maxItems = 20 ) {
        if (items.length <= maxItems)
            return items;

        let reducedItems = items.map(item => [item,false]);

        let loopCounter = 5;
        do {
            loopCounter -= 1;
            const allItems = reducedItems;
            reducedItems = [];
        
            while (allItems.length > 0) {
                const item = allItems.shift();
                const pattern = item[0].substring(0, item[0].length - 1);
                let matchSuccessful = false;
                while (allItems.length > 0 && allItems[0][0].startsWith(pattern)) {
                    allItems.shift();
                    matchSuccessful = true;
                }
                if (matchSuccessful)
                    reducedItems.push([pattern,true]);
                else
                    reducedItems.push(item);
            }
        } while( loopCounter > 0 && reducedItems.length > maxItems );

        const itemList = reducedItems.map(item => {
            if (item[1] === true)
                return item[0] + '*';
            else
                return item[0];
        });
        return itemList;
    }

    static initControllerStateData(urlQuery, controller) {

        const {fields} = controller.configuration;
        const numberOfFields = fields.length;

        let fieldValues = Array(numberOfFields).fill('');
        const allValuesFromDb = Array(numberOfFields).fill([]);            

        let initData = () => {         
            const state = {};
            const pageSelectors = controller.selectors.map(s => s.name);
            for ( let i = 0; i < numberOfFields; i++ ) {
                state[fields[i].selector] = pageSelectors.includes(fields[i].selector) ? fieldValues[i] : 'ERROR: bad selector';
            }
            state.hidden = { firstSelector: {label: fields[0].label, selector: fields[0].selector},
                             fields: numberOfFields };
            return {
                data: {
                    allValuesFromDb: allValuesFromDb
                },
                state: state
            }
        }

        if (urlQuery) {
            fields.forEach( (field, index) => {
                if (field.selector in urlQuery)
                    fieldValues[index] = urlQuery[field.selector];
            });
        }

        return Db1FieldController.controllerPromise(controller.configuration, [])
        .then(resp => {
            const firstFieldValues = Db1FieldController.extractData(resp.data.data, controller.configuration.fields[0].attribute);
            if (fieldValues[0] === '')
                fieldValues[0] = firstFieldValues.length > 0 ? firstFieldValues[0] : '';

            if (numberOfFields === 1)
                return initData();

            return Db1FieldController.controllerPromise(controller.configuration, [fieldValues[0]])            
                .then(resp => {
                    allValuesFromDb[1] = Db1FieldController.extractData(resp.data.data, controller.configuration.fields[1].attribute);
                    if (fieldValues[1] === '')                   
                        fieldValues[1] = allValuesFromDb[1].length > 0 ? allValuesFromDb[1][0] : '';

                    if (numberOfFields === 2)
                        return initData();

                    return Db1FieldController.controllerPromise(controller.configuration, [fieldValues[0], fieldValues[1]])
                        .then(resp => {
                            allValuesFromDb[2] = Db1FieldController.extractData(resp.data.data, controller.configuration.fields[2].attribute);
                            if (fieldValues[2] === '')
                                fieldValues[2] = allValuesFromDb[2].length > 0 ? allValuesFromDb[2][0] : '';
                            return initData();
                        })
                })
        }).catch(err => initData());
}

    static controllerInit(urlQuery, controller) {
        return this.initControllerStateData(urlQuery, controller);
    }

    static controllerQueryTitle(state) {
        if (state.hidden.fields > 1)
            return `${state.hidden.firstSelector.label}: ${state[state.hidden.firstSelector.selector]} ........`;
        else
            return `${state.hidden.firstSelector.label}: ${state[state.hidden.firstSelector.selector]} `;
    }

    static controllerStateToQuery(state) {
        Object.keys(state).forEach(key => {
            if (key.startsWith('hidden')) 
                delete state[key];
        });
        return state;
    }
    
    static validateSelectedValue(allowedValues, value) {
        let fieldValue = allowedValues.find(s => s === value);
        if (!fieldValue)
            return '';
        if (fieldValue.endsWith('*'))
            fieldValue = fieldValue.substring(0, fieldValue.length - 1) + '?';
        return fieldValue;
    }


    static getQueryParamsForShift(side, fieldValue, configuration) {
        const queryParams = {
            page: 1,
            pagesize: 1,
            fields: [configuration.fields[0].attribute],
            filters: [{
                attribute: configuration.fields[0].attribute,
                operator: side === 'right' ? 'GT' : 'LT',
                value: fieldValue
            }],
            sorting: [(side === 'right' ? '' : '-') + configuration.fields[0].attribute]
        };
        if (configuration.aggpath)
            queryParams.aggpath = configuration.aggpath;

        return queryParams;
    }


    updateControllerState = (fieldIndex, value) => {
        let {controllerState} = this.props;
        controllerState[this.props.configuration.fields[fieldIndex].selector] = value;
        this.props.updateState(controllerState);
    }


    onFirstFieldChange = (searchText, index = -1) => {
        const firstField = index === -1 ? searchText : Db1FieldController.validateSelectedValue(this.state.suggestions[0], searchText);
        if (!firstField) return;
        
        this.updateControllerState(0,firstField);
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

        const queryParams = {
            page: 1,
            pagesize: 1,
            fields: [this.props.configuration.fields[0].attribute],
            filters: [{
                attribute: this.props.configuration.fields[0].attribute,
                operator: side === 'right' ? 'GT' : 'LT',
                value: fieldValue
            }],
            sorting: [(side === 'right' ? '' : '-') + this.props.configuration.fields[0].attribute]
        };
        if (this.props.configuration.aggpath)
            queryParams.aggpath = this.props.configuration.aggpath;

        return AggProvider.fetch(this.props.configuration.endpoint, queryParams)
            .then(response => {
                const rows = response.data.data;
                return (rows.length > 0) ? rows[0].attributes[this.props.configuration.fields[0].attribute] : null;
            });
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
                    onInputChange={this.onFirstFieldUpdate}
                    onValueChange={this.onFirstFieldChange}
                />
                <ControllerNextButton handleClick={() => this.onFirstFieldShift('right')} />
            </div>

        );
    }


}
export default withStyles(styles)(Db1FieldController);