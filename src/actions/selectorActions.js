import axios from 'axios';
import { openSnackbar } from './appActions';
import { extractErrorMessage } from './mainActions';
import { getWorkspaceVersionHeader, updateWorkspaceVersion } from './workspaceActions';

export function fetchSelectors() {
    return dispatch => {
        dispatch({ type: "STARTED_FETCHING_SELECTORS" });
        return axios.get('/api/selectors')
            .then(response => {
                dispatch({ type: "FETCH_SELECTORS_FULFILLED", payload: response.data.data })
            })
            .catch(err => {
                dispatch({ type: "FETCH_SELECTORS_REJECTED" });
                dispatch(openSnackbar(extractErrorMessage('Failed to fetch selectors from the database',err)));
            })
    }
}

export function updateSelector(selector) {
    return (dispatch, getState) => {
        const headers = getWorkspaceVersionHeader(getState);
        return axios.put(`/api/selectors/${selector.id}`, selector, headers)
            .then(response => {
                dispatch(updateWorkspaceVersion(response.data.data.attributes.workspace_version));
                dispatch(fetchSelectors());
                dispatch(openSnackbar('Selector was updated successfully.'));
            })
            .catch(err => {
                dispatch(openSnackbar(extractErrorMessage('Failed to update selector', err, 'Please try again')));
            })
    }
}

export function addSelector(selector) {
    return (dispatch, getState) => {
        const headers = getWorkspaceVersionHeader(getState);
        return axios.post('/api/selectors', selector, headers)
            .then(response => {
                dispatch(updateWorkspaceVersion(response.data.data.attributes.workspace_version));
                dispatch(fetchSelectors());
                dispatch(openSnackbar('Selector was added successfully.'));
            })
            .catch(err => {
                dispatch(openSnackbar(extractErrorMessage('Failed to add selector', err, 'Please try again')));
            })
    }
}

export function deleteSelector(selectorId) {
    return (dispatch, getState) => {
        const headers = getWorkspaceVersionHeader(getState);
        return axios.delete('/api/selectors/' + selectorId, headers)
            .then(response => {
                dispatch(updateWorkspaceVersion(response.data.data.attributes.workspace_version));
                dispatch(fetchSelectors());
                dispatch(openSnackbar('Selector was successfully deleted.'));
            })
            .catch(err => {
                dispatch(openSnackbar(extractErrorMessage('Failed to delete selector', err, 'Please try again')));
            })
    }
}
