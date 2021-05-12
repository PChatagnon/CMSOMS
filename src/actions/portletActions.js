import axios from 'axios';
import cookie from 'react-cookies';
import { utils } from 'react-grid-layout';
import { loadingCompleted, openSnackbar } from './appActions';
import { updatePageVersion, getPageVersionHeader } from './pageActions';
import { extractErrorMessage } from './mainActions';
import {
    getWorkspaceVersionHeader, validateWorkspaceVersion,
    fetchWorkspacePortlets, selectWorkspacePortlet, updateWorkspaceVersion
} from './workspaceActions';
import { getRandomInRange } from '../utils/utils';

const MINIMIZED_PORTLET_HEIGHT = 1;

export function loadPortlets(response) {
    return (dispatch, getState) => {
        const { attributes } = response.data.data;
        const portlets = attributes.portlets.map(p => transformPortlet(p));
        const editPage = getState().app.editPage;
        const initMinimizedPortlets = portlets.filter(p =>
            (p.configuration && p.configuration.minimized) ||
            (p.portlet.configuration && p.portlet.configuration.minimized)
        ).map(p => p.id);
        const minimizedPortlets = cookie.load(`${getState().pages.selectedPage.id}_minimized`) || initMinimizedPortlets;
        const layout = getPortletLayout(portlets, editPage, minimizedPortlets);
        dispatch({
            type: "FETCH_PORTLETS_FULFILLED",
            payload: { portlets: portlets, layout: layout, minimizedPortlets: minimizedPortlets }
        });
        dispatch(updatePageVersion(attributes.version));
        dispatch(validateWorkspaceVersion(attributes.workspace_version));
        dispatch(loadingCompleted());
    }
}

export function fetchPortlets(page) {
    return (dispatch, getState) => {
        return axios.get('/api/pages/' + page.id)
            .then(response => dispatch(loadPortlets(response)))
            .catch(err => {
                dispatch(openSnackbar(extractErrorMessage('Failed to fetch portlets from the database',err)));
            })
    }
}

// Manage Portlets actions

export function fetchPortletComponents() {
    return dispatch => {
        dispatch({ type: "STARTED_FETCHING_PORTLET_COMPONENTS" });
        return axios.get('/api/portlet_components')
            .then(response => {
                dispatch({ type: "FETCH_PORTLET_COMPONENTS_FULFILLED", payload: response.data.data })
            })
            .catch(err => {
                dispatch({ type: "FETCH_PORTLET_COMPONENTS_REJECTED" });
                dispatch(openSnackbar(extractErrorMessage('Failed to fetch portlet components from the database', err)));
            })
    }
}

export function updatePortletComponent(component) {
    return (dispatch, getState) => {
        return axios.put(`/api/portlet_components/${component.id}`, component)
            .then(response => {
                dispatch(fetchPortletComponents());
                dispatch(openSnackbar('Portlet component was updated successfully.'));
            })
            .catch(err => {
                dispatch(openSnackbar(extractErrorMessage('Failed to update portlet component', err, 'Please try again')));
            })
    }
}

export function addPortletComponent(component) {
    return (dispatch, getState) => {
        return axios.post('/api/portlet_components', component)
            .then(response => {
                dispatch(fetchPortletComponents());
                dispatch(openSnackbar('Portlet component was added successfully.'));
            })
            .catch(err => {
                dispatch(openSnackbar(extractErrorMessage('Failed to add portlet component', err, 'Please try again')));
            })
    }
}

export function deletePortletComponent(component) {
    return (dispatch, getState) => {
        return axios.delete(`/api/portlet_components/${component.id}`)
            .then(response => {
                dispatch(fetchPortletComponents());
                dispatch(openSnackbar('Portlet component was deleted successfully.'));
            })
            .catch(err => {
                dispatch(openSnackbar(extractErrorMessage('Failed to delete portlet component', err, 'Please try again')));
            })
    }
}

export function deletePortlet(portlet) {
    return (dispatch, getState) => {
        const headers = getWorkspaceVersionHeader(getState);
        return axios.delete(`/api/portlets/${portlet.id}`, headers)
            .then(response => {
                dispatch(fetchWorkspacePortlets()).then(() => {
                    dispatch(selectWorkspacePortlet(null));
                });
                dispatch(updateWorkspaceVersion(response.data.data.attributes.workspace_version));
                dispatch(openSnackbar('Portlet was successfully deleted.'));
            })
            .catch(err => dispatch(openSnackbar(extractErrorMessage('Failed to delete portlet', err))));
    }
}

export function updatePortlet(portlet) {
    return (dispatch, getState) => {
        const headers = getWorkspaceVersionHeader(getState);
        return axios.put('/api/portlets/' + portlet.id, portlet, headers)
            .then(response => {
                dispatch(fetchWorkspacePortlets()).then(() => {
                    const selectedPortlet = getState().workspaces.workspacePortlets.find(p => p.id === portlet.id);
                    return dispatch(selectWorkspacePortlet(selectedPortlet));
                });
                dispatch(updateWorkspaceVersion(response.data.data.attributes.workspace_version));
                dispatch(openSnackbar('Portlet was successfully updated.'));
            })
            .catch(err => dispatch(openSnackbar(extractErrorMessage('Failed to update portlet', err))));
    }
}

export function addPortlet(portlet) {
    return (dispatch, getState) => {
        const headers = getWorkspaceVersionHeader(getState);
        return axios.post('/api/portlets/', portlet, headers)
            .then(response => {
                dispatch(fetchWorkspacePortlets()).then(() => {
                    const selectedPortlet = getState().workspaces.workspacePortlets.find(p => p.id === response.data.data.id);
                    return dispatch(selectWorkspacePortlet(selectedPortlet));
                });
                dispatch(updateWorkspaceVersion(response.data.data.attributes.workspace_version));
                dispatch(openSnackbar('Portlet was successfully added.'));
            })
            .catch(err => {
                dispatch(openSnackbar(extractErrorMessage('Failed to add new portlet.', err)));
            })
    }
}

// Portlet Grid actions

export function updatePortletProperty(portlet) {
    return (dispatch, getState) => {
        const headers = getPageVersionHeader(getState);
        return axios.put('/api/portlet_properties/' + portlet.id, portlet, headers)
            .then(response => {
                const newPortlet = transformPortlet(response.data.data);
                const pagePortlets = getState().portlets.pagePortlets;
                const editPage = getState().app.editPage;
                const portlets = pagePortlets.map(portlet => portlet.id === newPortlet.id ? newPortlet : portlet);
                const layout = getPortletLayout(portlets, editPage);
                dispatch({
                    type: "FETCH_PORTLETS_FULFILLED",
                    payload: { portlets: portlets, layout: layout, minimizedPortlets: [] }
                });
                dispatch(updatePageVersion(newPortlet.page_version));
                dispatch(openSnackbar('Portlet was successfully updated.'));
            })
            .catch(err => dispatch(openSnackbar(extractErrorMessage('Failed to update portlet', err))));
    }
}
function transformPortlet(p) {
    const { attributes: portletAttr } = p.attributes.portlet;
    const portlet = { ...portletAttr, portlet_component: portletAttr.portlet_component.attributes };
    return { ...p.attributes, portlet: portlet };
}

export function removePortlet(portlet) {
    return {
        type: "REMOVE_PORTLET",
        payload: portlet
    }
}

export function addNewPortlet(portlet) {
    const pagePortlet = {
        id: 'new' + Math.random(), // New portlet must have a unique key
        pos_x: getRandomInRange(0, 10), // 18  is max portlet layout size
        pos_y: Infinity, // puts it at the bottom
        size_x: portlet.min_size_x,
        size_y: portlet.min_size_y,
        portlet: portlet
    };
    return {
        type: "ADD_NEW_PORTLET",
        payload: pagePortlet
    }
}

export function getPortletLayoutProps(portlet, editPage, minimizedPortlets = []) {
    const staticPortlet = editPage ? false : true;
    const minimized = editPage ? false : minimizedPortlets.includes(portlet.id);
    return {
        i: portlet.id.toString(),
        x: portlet.pos_x,
        y: portlet.pos_y,
        w: portlet.size_x,
        h: minimized ? MINIMIZED_PORTLET_HEIGHT : portlet.size_y,
        minH: minimized ? MINIMIZED_PORTLET_HEIGHT : portlet.portlet.min_size_y,
        minW: portlet.portlet.min_size_x,
        static: staticPortlet,
    }
}

function getPortletLayout(portlets, editPage, minimizedPortlets = []) {
    let needCompression = false;
    const layout = portlets.map(portlet => {
        needCompression = minimizedPortlets.includes(portlet.id) ? true : needCompression;
        return getPortletLayoutProps(portlet, editPage, minimizedPortlets);
    });

    if (needCompression) return compressLayout(layout);
    return layout;
}

export function minimizePortlet(portletId) {
    return (dispatch, getState) => {
        let minimizedPortlets = getState().portlets.minimizedPortlets;
        const portlets = getState().portlets.pagePortlets;
        const minimized = minimizedPortlets.includes(portletId);

        // keep minimized portlets list up to date
        minimized ?
            minimizedPortlets = minimizedPortlets.filter(pid => pid !== portletId) :
            minimizedPortlets.push(portletId);

        cookie.save(`${getState().pages.selectedPage.id}_minimized`, minimizedPortlets);
        const layout = getPortletLayout(portlets, false, minimizedPortlets);

        dispatch({
            type: "MINIMIZE_PORTLET",
            payload: {
                layouts: { lg: layout },
                minimizedPortlets: minimizedPortlets,
            }
        });
    }
}

export function onLayoutBreakpointChange(breakpoint) {
    return {
        type: "CHANGE_PORTLET_LAYOUT_BREAKPOINT",
        payload: breakpoint
    }
}

export function onPortletLayoutChange(layout, layouts) {
    // modify portlet layout (drag/resize)
    return {
        type: "MODIFY_PORTLET_LAYOUTS",
        payload: layouts
    }
}

export function resetPortlets() {
    // resets portlet layout to initial stage
    return { type: "RESET_PORTLET_LAYOUTS" };
}

export function onPortletLayoutSave() {
    return (dispatch, getState) => {
        const pagePortlets = getState().portlets.pagePortlets;
        const portletLayout = getState().portlets.portletLayouts['lg'];

        const layout = portletLayout.map(portlet => {
            const portletInfo = pagePortlets.find(item => item.id.toString() === portlet.i);
            const portletId = portletInfo ? portletInfo.portlet.id : null;
            const id = portlet.i.includes('new') ? null : parseInt(portlet.i, 10);
            return { id: id, portlet_id: portletId, pos_x: portlet.x, pos_y: portlet.y, size_x: portlet.w, size_y: portlet.h, group_id: 0 };
        });
        const page = getState().pages.selectedPage;
        const pageVersion = getPageVersionHeader(getState);
        const workspaceVersion = getWorkspaceVersionHeader(getState);
        const headers = { headers: Object.assign(pageVersion.headers, workspaceVersion.headers) };
        return axios.put('/api/pages/' + page.id, { portlet_properties: layout }, headers)
            .then(response => {
                dispatch(loadPortlets(response));
                dispatch(openSnackbar('Portlet layout was saved successfully.'));
            })
            .catch(err => dispatch(openSnackbar(extractErrorMessage('Failed to save portlet layout', err))));
    }
}

/** Compress Layout utility
 * 
 * Given a layout, compact it. This involves going down each y coordinate and removing gaps
 * between items.
 * It was taken and modified from https://github.com/STRML/react-grid-layout/blob/master/lib/utils.js#L134
 */

function compressLayout(layout, compactType = "vertical", cols = 18) {
    const compareWith = [];

    // We go through the items by row and column.
    const sorted = utils.sortLayoutItems(layout, compactType);

    // Holding for new items.
    const out = Array(layout.length);

    for (let i = 0, len = sorted.length; i < len; i++) {
        let l = utils.cloneLayoutItem(sorted[i]);

        l = utils.compactItem(compareWith, l, compactType, cols, sorted);

        // Add to comparison array. We only collide with items before this one.
        compareWith.push(l);

        // Add to output array to make sure they still come out in the right order.
        out[layout.indexOf(sorted[i])] = l;

        // Clear moved flag, if it exists.
        l.moved = false;
    }

    return out;
}
