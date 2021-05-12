import { fetchWorkspaces, loadFirstWorkspacePage } from './workspaceActions';
import { fetchPages, loadFirstFolderPage } from './pageActions';
import { loadPortlets } from './portletActions';
import { openSnackbar, loadingCompleted } from './appActions';
import { loadController } from './controllerActions';
import { push, replace } from 'connected-react-router';
import { toUrlQuery } from '../utils/utils';
import { parse } from 'qs';
import logger from '../utils/logger';
import axios from 'axios';
import copy from 'copy-to-clipboard';

export function fetchInitData() {
    return dispatch => dispatch(fetchWorkspaces())
        .then(() => dispatch(fetchWorkspacePages()));
}

export function fetchWorkspacePages() {
    return (dispatch, getState) => {
        const { selectedWorkspace, selectedWorkspacePath, workspaces } = getState().workspaces;

        // Return if workspaces failed to fetch
        if (!workspaces.length) return;

        // Render home page if user tries to enter the admin page without required rights
        const adminPage = getState().app.editPage || getState().app.managePage;
        const adminRights = getState().workspaces.workspaceAdmin;
        if (adminPage && !adminRights) {
            return dispatch(changeURL('/'));
        }

        // Render home page if user entered non existing workspace path
        if (selectedWorkspacePath && !selectedWorkspace) {
            dispatch(openSnackbar('Specified workspace is not valid.'));
            return dispatch(changeURL('/'));
        }

        const fetchingPages = getState().pages.fetchingPages;
        if (fetchingPages || !selectedWorkspace) return;

        return dispatch(fetchPages(selectedWorkspace)).then(() => {
            return dispatch(loadPage());
        });
    }
}

export function loadPage() {
    return (dispatch, getState) => {
        const page = getState().pages.selectedPage;
        const folder = getState().pages.selectedFolder;
        const workspace = getState().workspaces.selectedWorkspace;

        if (page && folder) {
            return dispatch(routeChange());
        }

        if (!page && folder) {
            // Load empty page in case there are no pages in a folder
            if (!folder.pages.length) return dispatch(loadEmptyPage());

            // Load first page of a folder if it's not specified in the url
            return dispatch(loadFirstFolderPage(workspace, folder));
        }

        // If page and folder are missing in the url, load the first folders and page
        const pathname = getState().routing.locationBeforeTransitions.pathname;
        const pages = getState().pages.pages;
        return dispatch(loadFirstWorkspacePage(workspace, pages, pathname));
    }
}

// Used in case there are no pages in a folder
export function loadEmptyPage() {
    return dispatch => {
        dispatch({
            type: "FETCH_PORTLETS_FULFILLED",
            payload: { portlets: null, layout: {}, minimizedPortlets: [] }
        });
        dispatch(openSnackbar('There are no pages to display.'));
        return dispatch(loadingCompleted());
    }
}

export function updateOnBackButton(newLocation) {
    return {
        type: "LOCATION_CHANGE_BACK_BUTTON",
        payload: { location: newLocation }
    }
}

export function routeChange(clearControllerProps = true) {
    return (dispatch, getState) => {
        const page = getState().pages.selectedPage;

        // Load empty page if it's not present
        if (!page) return dispatch(loadEmptyPage());

        return axios.get('/api/pages/' + page.id)
            .then(response => {
                const { controller: c } = response.data.data.attributes;

                const controller = c ? {
                    ...c.attributes,
                    controller_component: c.attributes.controller_component.attributes,
                    selectors: c.attributes.selectors.map(s => s.attributes)
                } : null;

                /***
                 * urlSearch is taken directly from the url on page load.
                 *      Example of usage: hard reload of a page with url query.
                 * urlQuery is a query from the previous page.
                 * */

                const urlSearch = getState().routing.locationBeforeTransitions.search;
                const urlQuery = getState().routing.locationBeforeTransitions.query;
                const query = { ...urlQuery, ...parseUrlQuery(urlSearch) };
                const searchToQuery  = parseUrlQuery(urlSearch);
                const searchProps = searchToQuery.hasOwnProperty('props') ? searchToQuery.props : {}

                // controller init
                return dispatch(loadController(controller, query, false, clearControllerProps, searchProps))
                    // Load portlets only when controller init finishes
                    .then(() => dispatch(loadPortlets(response)));
            })
            .catch(err => {
                logger.error(err, 'routeChange');
                return dispatch(openSnackbar('Failed to fetch page components.'));
            });
    }
}

export function getErrorMessage(err, snackMessage) {
    logger.error(err);
    if (err.response && err.response.status === 409) {
        if (err.response.data && err.response.data.errors &&
            err.response.data.errors.length &&  err.response.data.errors[0].title) {
          const title = err.response.data.errors[0].title;
          if (title==="DatabaseError") {
            if (err.response.data.errors[0].detail)
              return 'Database Error: ' + err.response.data.errors[0].detail;
            return 'Database Error';
          }
          if (title==="Conflict")
            return 'Error: Your workspace version is outdated. Please refresh the page.';
          return 'Error: ' + title;
        }
        return 'Error: 409';
    }
    return snackMessage;
}

export function extractErrorMessage(snackPrefix, err, snackSuffix) {
    if (err.response && err.response.status === 409) {
        return getErrorMessage(err,snackPrefix);
    }
    if (err.response && err.response.data && err.response.data.errors &&
        err.response.data.errors.length && err.response.data.errors[0].detail &&
        err.response.data.errors[0].detail.length) {

      return snackPrefix + ": " + err.response.data.errors[0].detail +
             ((snackSuffix && snackSuffix.length) ? (". " + snackSuffix + ".") : ".");
    }
    else
      return snackPrefix + ((snackSuffix && snackSuffix.length) ? (". " + snackSuffix + ".") : ".");
}

export function addUrlParam(param) {
    return (dispatch, getState) => {
        const urlSearch = getState().routing.locationBeforeTransitions.search;
        const query = parseUrlQuery(urlSearch);
        const queryProps = 'props' in query ? query.props : {};
        const newQuery = { ...query, props: { ...queryProps, ...param } }

        dispatch({
            type: "UPDATE_URL_QUERY",
            payload: { urlQuery: newQuery }
        })
        dispatch(appendURL(''))
    };
}

export function copyUrltoClipboard() {
    return (dispatch, getState) => {
        const { pathname } = getState().routing.locationBeforeTransitions;
        const query = getState().controllers.controllerQuery;
        copy(window.location.origin + pathname + toUrlQuery(query));
        return dispatch(openSnackbar('URL was successfully copied to clipboard.'));
    };
}

export function addQueryToUrl(query) {
    return (dispatch, getState) => {
        const { pathname } = getState().routing.locationBeforeTransitions;
        return dispatch(replace(pathname + toUrlQuery(query)));
    };
}

export function changeURL(url) {
    return push(url);
}

export function appendURL(subUrl) {
    return (dispatch, getState) => {
        const { pathname, search } = getState().routing.locationBeforeTransitions;
        return dispatch(push(pathname + subUrl + search));
    };
}

export function truncateURL(subUrl) {
    return (dispatch, getState) => {
        const { pathname, search } = getState().routing.locationBeforeTransitions;
        if (!pathname.includes(subUrl)) return;
        const url = pathname.replace(subUrl, '') + search;
        return dispatch(push(url));
    };
}

export function getUrlQuery() {
    return (dispatch, getState) => {
        const query = getState().controllers.controllerQuery;
        return toUrlQuery(query);
    };
}

function parseUrlQuery(urlQuery) {
    return parse(urlQuery, { allowDots: true, ignoreQueryPrefix: true });
}
