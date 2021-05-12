import { fetchControllerPortlets } from './controllerActions';
import { getWorkspaceVersionHeader } from './workspaceActions';
import { extractErrorMessage } from './mainActions';
import AggProvider from '../components/providers/AggProvider';
import axios from 'axios';

export function togglePortletbar() {
    return (dispatch, getState) => {
        dispatch({ type: "TOGGLE_PORTLETBAR" });

        // Fetch controller portlets on portletbar toggle
        const portlets = getState().controllers.controllerPortlets;
        if (!portlets) {
            const page = getState().pages.selectedPage;
            dispatch(fetchControllerPortlets(page));
        }
    }
}

export function toggleInfoDialog() {
    return (dispatch, getState) => {
        dispatch({ type: "TOGGLE_INFO_DIALOG" });

        // Fetch info about api versions on first dialog toggle
        const info = getState().app.apiInfo;
        if (!info) {
            dispatch(fetchApiInfo());
        }
    }
}

function fetchApiInfo() {
    return (dispatch) => {

        return axios.all([
            AggProvider.fetch('version', { include: ['presentation_timestamp'] }),
            axios.get('/api/version'),
        ])
            .then(axios.spread((aggResp, apiResp) => {
                const { attributes } = aggResp.data.data[0];
                dispatch({
                    type: "FETCH_API_INFO_FULFILLED",
                    payload: { agg: attributes, api: apiResp.data }
                });
            }))
            .catch(err => dispatch(openSnackbar(extractErrorMessage('Failed to fetch information about api version', err))));
    }
}

export function toggleLeftbar() {
    return {
        type: "TOGGLE_LEFTBAR"
    }
}

export function openLeftbar() {
    return {
        type: "OPEN_LEFTBAR"
    }
}

export function hideLeftbar() {
    return {
        type: "HIDE_LEFTBAR"
    }
}

export function hideSnackbar() {
    return {
        type: "HIDE_SNACKBAR"
    }
}

export function openSnackbar(message) {
    return {
        type: "OPEN_SNACKBAR",
        payload: message
    }
}

export function loadingStarted() {
    return {
        type: "LOADING_STARTED"
    }
}

export function loadingCompleted() {
    return {
        type: "LOADING_COMPLETED"
    }
}

export function validateLdapName(name) {
    // Validates username or e-group name in CERN LDAP
    return (dispatch, getState) => {
        const headers = getWorkspaceVersionHeader(getState);
        return axios.post('/api/validation/entity', { entity: name }, headers)
            .then(response => {
                const { attributes } = response.data.data;
                const { egroup, user } = attributes;
                if (!egroup && !user) {
                    dispatch(openSnackbar('Username or e-group is not valid. Please enter a valid name.'));
                    return false;
                }
                return attributes;
            })
            .catch(err => {
                dispatch(openSnackbar(extractErrorMessage('Failed to validate username or e-group. Please try again', err)));
            })
    }
}

export function masterDetails(details) {
    return {
        type: "MASTER_DETAILS",
        payload: details
    }
}
