import axios from 'axios';
import { openSnackbar } from './appActions';
import { extractErrorMessage } from './mainActions';
import { loadEmptyPage } from './mainActions';
import { push } from 'connected-react-router';

export function fetchWorkspaces() {
    return dispatch => {
        return axios.get('/api/workspaces')
            .then(response => {
                dispatch({
                    type: "FETCH_WORKSPACES_FULFILLED",
                    payload: {
                        workspaces: response.data.data,
                        headers: response.headers,
                    }
                })
            })
            .catch(err => {
                dispatch(openSnackbar(extractErrorMessage('Failed to fetch workspaces from the database', err)));
            })
    }
}

export function fetchWorkspacePortlets() {
    return (dispatch, getState) => {
        dispatch({ type: "STARTED_FETCHING_WORKSPACE_PORTLETS" });
        const workspace = getState().workspaces.selectedWorkspace;
        if (!workspace) return;
        return axios.get(`/api/workspaces/${workspace.id}/portlets`)
            .then(response => {
                dispatch({
                    type: "FETCH_WORKSPACE_PORTLETS_FULFILLED",
                    payload: response.data.data
                })
            })
            .catch(err => {
                dispatch({ type: "FETCH_WORKSPACE_PORTLETS_REJECTED" });
                dispatch(openSnackbar(extractErrorMessage('Failed to fetch workspace portlets from the database', err)));
            })
    }
}

export function fetchWorkspaceControllers() {
    return (dispatch, getState) => {
        dispatch({ type: "STARTED_FETCHING_WORKSPACE_CONTROLLERS" });
        const workspace = getState().workspaces.selectedWorkspace;
        if (!workspace) return;

        return axios.get(`/api/workspaces/${workspace.id}/controllers`)
            .then(response => {
                dispatch({ type: "FETCH_WORKSPACE_CONTROLLERS_FULFILLED", payload: response.data.data })
            })
            .catch(err => {
                dispatch({ type: "FETCH_WORKSPACE_CONTROLLERS_REJECTED", payload: err });
                dispatch(openSnackbar(extractErrorMessage('Failed to fetch controllers from the database', err)));
            })
    }
}

export function selectWorkspacePortlet(portlet) {
    return {
        type: "SELECT_WORKSPACE_PORTLET",
        payload: portlet
    }
}

export function loadFirstWorkspacePage(workspace, pages, pathname) {
    const lastPathElement = pathname.split('/').pop(); // takes the last element in the pathname

    // Load the first page only in the main portlet view
    if (pathname.includes('manage')) {
        const managePages = ['pages', 'workspace', 'widgets', 'bookmarks'];
        const managePage = managePages.includes(lastPathElement) ? lastPathElement : managePages[0];
        return push(`/${workspace.path}/manage/${managePage}`);
    }

    let url = getFirstPageURL(workspace, pages);
    if (!url) return loadEmptyPage();  // When workspace doesn't have any pages
    return push(url);
}

function getFirstPageURL(workspace, pages) {
    // Find first folder with pages in a given workspace
    const folder = pages.find(folder => folder.pages.length > 0);
    if (!folder || !folder.pages.length) return null;
    const page = folder.pages[0];
    return `/${workspace.path}/${folder.path}/${page.path}`;
}

export function updateWorkspaceVersion(version) {
    return {
        type: "UPDATE_WORKSPACE_VERSION",
        payload: version
    }
}

export function validateWorkspaceVersion(version) {
    return (dispatch, getState) => {
        const currentVersion = getState().workspaces.selectedWorkspaceVersion;
        if (currentVersion !== version) {
            return dispatch(openSnackbar('Your workspace version is outdated. Please refresh the page.'));
        }
    }
}

export function getWorkspaceVersionHeader(getState) {
    const version = getState().workspaces.selectedWorkspaceVersion;
    return { headers: { 'OMS-Workspace-Version': version } };
}

export function updateWorkspace(workspace) {
    return (dispatch, getState) => {
        const headers = getWorkspaceVersionHeader(getState);
        return axios.put(`/api/workspaces/${workspace.id}`, workspace, headers)
            .then(response => {
                dispatch(fetchWorkspaces());
                dispatch(openSnackbar('Workspace was updated successfully.'));
            })
            .catch(err => {
                if (err.response) {
                    if ('description' in err.response.data) {
                        return dispatch(openSnackbar('Error: ' + err.response.data.description));
                    }
                }
                dispatch(openSnackbar(extractErrorMessage('Failed to update the workspace', err, 'Please try again')));
            })
    }
}
