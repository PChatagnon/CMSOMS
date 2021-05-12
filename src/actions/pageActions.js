import axios from 'axios';
import { push } from 'connected-react-router';
import { openSnackbar } from './appActions';
import { extractErrorMessage } from './mainActions';
import { updateWorkspaceVersion, getWorkspaceVersionHeader } from './workspaceActions';

export function fetchPages(workspace) {
    return dispatch => {
        dispatch({ type: 'STARTED_FETCHING_PAGES' });
        return axios.get('/api/workspaces/' + workspace.id)
            .then(response => {
                const { attributes } = response.data.data;
                dispatch({ type: 'FETCH_PAGES_FULFILLED', payload: attributes.folders });
                dispatch(updateWorkspaceVersion(attributes.version));
            })
            .catch(err => dispatch(openSnackbar(extractErrorMessage('Failed to fetch page list from the database', err))));
    }
}

export function changePageOrder(page) {
    return (dispatch, getState) => {
        const headers = getWorkspaceVersionHeader(getState);
        return axios.put('/api/pages/' + page.id, page, headers)
            .then(response => {
                const workspace = getState().workspaces.selectedWorkspace;
                dispatch(fetchPages(workspace));
                dispatch(openSnackbar('Page order was changed successfully.'));
            })
            .catch(err => dispatch(openSnackbar(extractErrorMessage('Failed to change page order', err))));
    }
}

export function changeFolderOrder(folder) {
    return (dispatch, getState) => {
        const headers = getWorkspaceVersionHeader(getState);
        return axios.put('/api/folders/' + folder.id, folder, headers)
            .then(response => {
                const workspace = getState().workspaces.selectedWorkspace;
                dispatch(fetchPages(workspace));
                dispatch(openSnackbar('Folder order was changed successfully.'));
            })
            .catch(err => dispatch(openSnackbar(extractErrorMessage('Failed to change folder order', err))));
    }
}

export function loadFirstFolderPage(workspace, folder) {
    let url = `/${workspace.path}/${folder.path}`;
    if (folder.pages.length) url += `/${folder.pages[0].path}`;
    return push(url);
}

export function onFolderSelect(event) {
    return (dispatch, getState) => {
        const workspace = getState().workspaces.selectedWorkspace;
        const flatPages = getState().pages.flatPages;
        const folder = flatPages.find(item => item.id === event.target.value);
        dispatch(loadFirstFolderPage(workspace, folder));
    }
}

export function getPageVersionHeader(getState) {
    const version = getState().pages.selectedPageVersion;
    return { headers: { 'OMS-Page-Version': version } };
}

export function updatePageVersion(version) {
    return {
        type: "UPDATE_PAGE_VERSION",
        payload: version
    }
}

// *** Manage Workspace item tree manipulation actions


function reloadManageWorkspaceTree(treeItemId) {
    return (dispatch, getState) => {
        const workspace = getState().workspaces.selectedWorkspace;
        dispatch(fetchPages(workspace))
            .then(() => dispatch(selectManageTreeItem(treeItemId)));
    }
}

export function addNewFolder(folder) {
    return (dispatch, getState) => {
        const headers = getWorkspaceVersionHeader(getState);
        return axios.post('/api/folders', folder, headers)
            .then(response => {
                dispatch(reloadManageWorkspaceTree(response.data.data.id));
                dispatch(openSnackbar('Folder was successfully added.'));
            })
            .catch(err => dispatch(openSnackbar(extractErrorMessage('Failed to add folder', err))));
    }
}

export function deleteFolder(id) {
    return (dispatch, getState) => {
        const headers = getWorkspaceVersionHeader(getState);
        return axios.delete('/api/folders/' + id, headers)
            .then(response => {
                dispatch(reloadManageWorkspaceTree(null));
                dispatch(openSnackbar('Folder was successfully deleted.'));
            })
            .catch(err => dispatch(openSnackbar(extractErrorMessage('Failed to delete folder', err))));
    }
}

export function updateFolder(id, folder) {
    return (dispatch, getState) => {
        const headers = getWorkspaceVersionHeader(getState);
        return axios.put('/api/folders/' + id, folder, headers)
            .then(response => {
                dispatch(reloadManageWorkspaceTree(response.data.data.id));
                dispatch(openSnackbar('Folder was successfully updated.'));
            })
            .catch(err => dispatch(openSnackbar(extractErrorMessage('Failed to update folder', err))));
    }
}

export function addNewPage(page) {
    return (dispatch, getState) => {
        const headers = getWorkspaceVersionHeader(getState);
        return axios.post('/api/pages', page, headers)
            .then(response => {
                dispatch(reloadManageWorkspaceTree(response.data.data.id));
                dispatch(openSnackbar('Page was successfully added.'));
            })
            .catch(err => dispatch(openSnackbar(extractErrorMessage('Failed to add page', err))));
    }
}

export function deletePage(page) {
    return (dispatch, getState) => {
        let headers = getWorkspaceVersionHeader(getState);
        headers.headers['OMS-Page-Version'] = page.version;
        const folderId = page.folder_id;
        return axios.delete('/api/pages/' + page.id, headers)
            .then(response => {
                dispatch(reloadManageWorkspaceTree(folderId));
                dispatch(openSnackbar('Page was successfully deleted.'));
            })
            .catch(err => dispatch(openSnackbar(extractErrorMessage('Failed to delete page', err))));
    }
}

export function updatePage(id, page) {
    return (dispatch, getState) => {
        const headers = getWorkspaceVersionHeader(getState);
        return axios.put('/api/pages/' + id, page, headers)
            .then(response => {
                dispatch(reloadManageWorkspaceTree(response.data.data.id));
                dispatch(openSnackbar('Page was successfully updated.'));
            })
            .catch(err => dispatch(openSnackbar(extractErrorMessage('Failed to update page', err))));
    }
}

export function changeManageTreeItem(item) {
    return {
        type: "CHANGE_MANAGE_TREE_ITEM",
        payload: item
    }
}

export function selectManageTreeItem(itemId) {
    return (dispatch, getState) => {
        const pages = getState().pages.flatPages;
        const item = itemId ? pages.find(item => item.id === itemId) : pages[0];
        return dispatch(changeManageTreeItem(item));
    }
}
