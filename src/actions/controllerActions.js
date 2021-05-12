import axios from 'axios';
import getController from '../components/controllers/ControllerMap';
import { getWorkspaceVersionHeader, updateWorkspaceVersion, fetchWorkspaceControllers } from './workspaceActions';
import { openSnackbar } from './appActions';
import { extractErrorMessage } from './mainActions';
import { addQueryToUrl, appendURL } from './mainActions';
import { merge, truncate, cloneDeep } from 'lodash';
import { parse } from 'qs';

export function loadController(controller, urlQuery, controllerShown, clearProps, propsToReplace) {
    return dispatch => {
        const component = controller ? getController(controller.controller_component.name) : null;
        return getControllerData(component, urlQuery, controller, clearProps, propsToReplace)
            .then(response => {
                const controllerData = controller && 'data' in response ? response.data : null;
                const controllerExportData = controller && 'exportData' in response ? response.exportData : null;
                const controllerState = controller && 'state' in response ? response.state : null;
                const controllerQuery = controller ? getControllerQuery(component, controllerState, urlQuery) : null;
                const queryTitle = controllerQuery ? getControllerQueryTitle(component, controllerState) : null;
                
                dispatch(addQueryToUrl(controllerQuery));
                return dispatch({
                    type: "LOAD_CONTROLLER_FULFILLED",
                    payload: {
                        controller: controller,
                        controllerData: controllerData,
                        controllerExportData: controllerExportData,
                        controllerQuery: controllerQuery,
                        controllerState: controllerState,
                        controllerShown: controllerShown,
                        queryTitle: queryTitle,
                    }
                });
            });
    }
}

export function updateController(controller) {
    return (dispatch, getState) => {
        const headers = getWorkspaceVersionHeader(getState);
        return axios.put(`/api/controllers/${controller.id}`, controller, headers)
            .then(response => {
                dispatch(updateWorkspaceVersion(response.data.data.attributes.workspace_version));
                dispatch(fetchWorkspaceControllers());
                dispatch(openSnackbar('Controller was updated successfully.'));
            })
            .catch(err => {
                dispatch(openSnackbar(extractErrorMessage('Failed to update controller', err, 'Please try again')));
            })
    }
}

export function addController(controller) {
    return (dispatch, getState) => {
        const headers = getWorkspaceVersionHeader(getState);
        return axios.post('/api/controllers', controller, headers)
            .then(response => {
                dispatch(updateWorkspaceVersion(response.data.data.attributes.workspace_version));
                dispatch(fetchWorkspaceControllers());
                dispatch(openSnackbar('Controller was added successfully.'));
            })
            .catch(err => {
                dispatch(openSnackbar(extractErrorMessage('Failed to add controller', err, 'Please try again')));
            })
    }
}

export function deleteController(controller) {
    return (dispatch, getState) => {
        const headers = getWorkspaceVersionHeader(getState);
        return axios.delete(`/api/controllers/${controller.id}`, headers)
            .then(response => {
                dispatch(updateWorkspaceVersion(response.data.data.attributes.workspace_version));
                dispatch(fetchWorkspaceControllers());
                dispatch(openSnackbar('Controller was deleted successfully.'));
            })
            .catch(err => {
                dispatch(openSnackbar(extractErrorMessage('Failed to delete controller', err, 'Please try again')));
            })
    }
}

export function fetchControllers() {
    return dispatch => {
        dispatch({ type: "STARTED_FETCHING_CONTROLLERS" });
        return axios.get('/api/controllers')
            .then(response => {
                dispatch({ type: "FETCH_CONTROLLERS_FULFILLED", payload: response.data.data })
            })
            .catch(err => {
                dispatch({ type: "FETCH_CONTROLLERS_REJECTED", payload: err });
                dispatch(openSnackbar(extractErrorMessage('Failed to fetch controllers from the database', err)));
            })
    }
}

// Fetch controller portlets for edit mode
export function fetchControllerPortlets(page) {
    return dispatch => {
        return axios.get(`/api/controllers/${page.controller_id}/portlets`)
            .then(response => {
                dispatch({
                    type: "FETCH_CONTROLLER_PORTLETS_FULFILLED",
                    payload: response.data.data
                })
            })
            .catch(err => {
                dispatch({ type: "FETCH_CONTROLLER_PORTLETS_REJECTED", payload: err });
                dispatch(openSnackbar(extractErrorMessage('Failed to fetch controller portlets from the database', err)));
            })
    }
}

export function openController() {
    return {
        type: "OPEN_CONTROLLER"
    }
}

export function toggleController() {
    return {
        type: "TOGGLE_CONTROLLER"
    }
}

export function hideController() {
    return {
        type: "HIDE_CONTROLLER"
    }
}

export function updateControllerQuery(query) {
    return {
        type: "UPDATE_CONTROLLER_QUERY",
        payload: query
    }
}

export function updateControllerState(query) {
    return {
        type: "UPDATE_CONTROLLER_STATE",
        payload: query
    }
}

export function updateControllerData(data) {
    return {
        type: "UPDATE_CONTROLLER_DATA",
        payload: data
    }
}

export function updateQuery(state, name, search) {
    return dispatch => {
        const component = getController(name);
        const title = getControllerQueryTitle(component, state);
        const query = getControllerQuery(component, state, {});
        const urlQuery = getControllerURLQuery(component, query, search);
        dispatch(updateControllerQuery({ query: query, title: title, urlQuery: urlQuery }));
        dispatch(appendURL(''));
    }
}

// Used in Manage Components page

export function fetchControllerComponents() {
    return dispatch => {
        dispatch({ type: "STARTED_FETCHING_CONTROLLER_COMPONENTS" });
        return axios.get('/api/controller_components')
            .then(response => {
                dispatch({ type: "FETCH_CONTROLLER_COMPONENTS_FULFILLED", payload: response.data.data })
            })
            .catch(err => {
                dispatch({ type: "FETCH_CONTROLLER_COMPONENTS_REJECTED" });
                dispatch(openSnackbar(extractErrorMessage('Failed to fetch controller components from the database', err)));
            })
    }
}

export function updateControllerComponent(component) {
    return (dispatch, getState) => {
        return axios.put(`/api/controller_components/${component.id}`, component)
            .then(response => {
                dispatch(fetchControllerComponents());
                dispatch(openSnackbar('Controller component was updated successfully.'));
            })
            .catch(err => {
                dispatch(openSnackbar(extractErrorMessage('Failed to update controller component', err, 'Please try again')));
            })
    }
}

export function addControllerComponent(component) {
    return (dispatch, getState) => {
        return axios.post('/api/controller_components', component)
            .then(response => {
                dispatch(fetchControllerComponents());
                dispatch(openSnackbar('Controller component was added successfully.'));
            })
            .catch(err => {
                dispatch(openSnackbar(extractErrorMessage('Failed to add controller component', err, 'Please try again')));
            })
    }
}

export function deleteControllerComponent(component) {
    return (dispatch, getState) => {
        return axios.delete(`/api/controller_components/${component.id}`)
            .then(response => {
                dispatch(fetchControllerComponents());
                dispatch(openSnackbar('Controller component was deleted successfully.'));
            })
            .catch(err => {
                dispatch(openSnackbar(extractErrorMessage('Failed to delete controller component', err, 'Please try again')));
            })
    }
}

// Controller utilities

function getControllerData(component, urlQuery, controller, clearProps, propsToReplace) {
    // Fetch data from the static controller data init method
    if (!component) return Promise.resolve();
    return 'controllerInit' in component ? component.controllerInit(urlQuery, controller, clearProps, propsToReplace) : Promise.resolve();
}

function getControllerQuery(component, state, urlQuery) {
    if ('controllerStateToQuery' in component) {
        return component.controllerStateToQuery(cloneDeep(state));
    }
    return merge({}, state, urlQuery);
}

function getControllerURLQuery(component, query, search) {
    let searchQuery = {};
    if (search && 'declareControllerURLParams' in component) {
       searchQuery = parse(search, { allowDots: true, ignoreQueryPrefix: true });
       component.declareControllerURLParams().forEach( item => { delete searchQuery[item] });
    }
    if ('controllerURLQuery' in component && query) {
        return merge({},component.controllerURLQuery(cloneDeep(query)),searchQuery);
    }
    if (Object.keys(searchQuery).length)
        return merge({},query,searchQuery);
    return query;
}

function stringifyQuery(query) {
    // Make readable controller query title for showing in the breadcrumb
    // if 'queryTitle' method is missing in the controllers data
    let queryString = JSON.stringify(query, null, 2).replace(/[{}'"]/g, '');
    return truncate(queryString, { length: 50 });
}

function getControllerQueryTitle(component, state) {
    // Get readable controller query title for showing in the breadcrumb
    if ('controllerQueryTitle' in component) {
        return component.controllerQueryTitle(state);
    }
    return stringifyQuery(state);
}
