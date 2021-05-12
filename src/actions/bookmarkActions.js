import axios from 'axios';
import { openSnackbar } from './appActions';
import { getErrorMessage } from './mainActions';
import { extractErrorMessage } from './mainActions';

/* Bookmark menu and editor API */

export function getGroups(resolve) {
    axios.get('/api/bookmarks/groups')
        .then(response => {
            resolve(Array.from(response.data.data, v => v.attributes));
        })
        .catch(error => {
            openSnackbar(getErrorMessage(error, 'Failed to get groups.'));
            resolve([]);
        });
}

export function getBookmarks(group_name, resolve) {
    axios.get('/api/bookmarks/bookmarks' + (group_name ? ('?groupname='+group_name) : ''))

        .then(response => {
            resolve(Array.from(response.data.data, v => v.attributes));
        })
        .catch(error => {
            openSnackbar(getErrorMessage(error, 'Failed to fetch bookmark list from the database.'));
            resolve({bookmarks:[]});
        });
}

export function createBookmark(data, resolve) {
    axios.post('/api/bookmarks/bookmark', data)
        .then(response => {
            resolve([response.data.data.attributes.id, null]);
        })
        .catch(error => {
            //openSnackbar(getErrorMessage(error, 'Failed to create bookmark.'));
            const errmsg = extractErrorMessage('Failed to create bookmark', error);
            resolve([null,errmsg]);
        });
}

export function updateBookmark(bookmark_id, data, resolve) {
    return axios.put('/api/bookmarks/bookmark/'+bookmark_id, data)
        .then(response => {
            if (resolve) resolve([true, null]);
        })
        .catch(error => {
            //openSnackbar(getErrorMessage(error, 'Failed to update bookmark.'));
            const errmsg = extractErrorMessage('Failed to update bookmark', error);
            if (resolve) resolve([false, errmsg]);
        });
}

export function removeBookmark(bookmark_id, resolve) {
    return axios.delete('/api/bookmarks/bookmark/'+bookmark_id)
        .then(response => {
            if (resolve) resolve([true, null]);
        })
        .catch(error => {
            //openSnackbar(getErrorMessage(error, 'Failed to delete bookmark'));
            const errmsg = extractErrorMessage('Failed to delete bookmark', error);
            if (resolve) resolve([false, errmsg]);
        });
}

/* Management for bookmark groups API */

export function selectBookmarkGroup(group) {
    return dispatch => {
        dispatch({
            type: "FETCH_GROUP_FULFILLED",
            payload: group
        });
    }
}

export function fetchBookmarkGroups() {
    return dispatch => {
        return axios.get('/api/bookmarks/groups')
            .then(response => {
                dispatch({
                    type: "FETCH_GROUPS_FULFILLED",
                    payload: Array.from(response.data.data, v => v.attributes)
                })
            })
            .catch(err => {
                dispatch(openSnackbar(extractErrorMessage('Failed to fetch bookmark groups from the database', err)));
            })
    }
}

export function fetchBookmarkGroup(name) {
    return dispatch => {
        return axios.get('/api/bookmarks/group?name='+name)
            .then(response => {
                dispatch({
                    type: "FETCH_GROUP_FULFILLED",
                    payload: response.data.data.attributes
                })
            })
            .catch(err => {
                dispatch(openSnackbar(extractErrorMessage('Failed to fetch bookmark group from the database', err)));
            })
    }
}

export function createBookmarkGroup(name, data) {
    return dispatch => {
        return axios.post('/api/bookmarks/group?name='+name, data)
            .then(response => {
                dispatch(fetchBookmarkGroups()).then(() =>
                    dispatch(fetchBookmarkGroup(name)));
            })
            .catch(err => dispatch(openSnackbar(extractErrorMessage('Failed to create group', err))));
    }
}

export function updateBookmarkGroup(name, data) {
    return dispatch => {
        return axios.put('/api/bookmarks/group?name='+name, data)
            .then(response => {
                dispatch(fetchBookmarkGroups()).then(() =>
                    dispatch(fetchBookmarkGroup(name)))
            })
            .catch(err => dispatch(openSnackbar(extractErrorMessage('Failed to update group', err))));
            
    }
}

export function deleteBookmarkGroup(name) {
    return dispatch => {
        return axios.delete('/api/bookmarks/group?name='+name)
            .then(response => {
                dispatch(fetchBookmarkGroups())
            })
            .catch(err => dispatch(openSnackbar(extractErrorMessage('Failed to delete group', err))));

    }
}

export function createBookmarkUser(name, groupname) {
    return dispatch => {
        return axios.post('/api/bookmarks/user?name='+name+"&groupname="+groupname)
            .then(response => {
                dispatch(fetchBookmarkGroup(groupname))
            })
            .catch(err => dispatch(openSnackbar(extractErrorMessage('Failed to create user', err))));
    }
}

export function deleteBookmarkUser(name, groupname) {
    return dispatch => {
        return axios.delete('/api/bookmarks/user?name='+name+"&groupname="+groupname)
            .then(response => {
                dispatch(fetchBookmarkGroup(groupname))
            })
            .catch(err => dispatch(openSnackbar(extractErrorMessage('Failed to delete user', err))));
    }
}

export function createBookmarkRule(rule, groupname) {
    return dispatch => {
        return axios.post('/api/bookmarks/rule?rule='+rule+'&groupname='+groupname)
            .then(response => {
                dispatch(fetchBookmarkGroup(groupname))
            })
            .catch(err => dispatch(openSnackbar(extractErrorMessage('Failed to create rule', err))));
    }
}

export function deleteBookmarkRule(rule, groupname) {
    return dispatch => {
        return axios.delete('/api/bookmarks/rule?rule='+rule+'&groupname='+groupname)
            .then(response => {
                dispatch(fetchBookmarkGroup(groupname))
            })
            .catch(err => dispatch(openSnackbar(extractErrorMessage('Failed to delete rule', err))));
    }
}

