import { LOCATION_CHANGE } from 'connected-react-router';
import { toUrlQuery } from '../utils/utils';
import { parse } from 'qs';

// This initial state is *copied* from react-router-redux's routerReducer.
// The property 'locationBeforeTransitions' is needed for react-router.

//NOTE: with react-router v4+ and connected-react-router state.locationBeforeTransitions
//is no longer parsed. This module updates it for actions which still parse it
//in particular for merged information from previous pages

const initialState = { locationBeforeTransitions: {} };

export default function reducer(state = initialState, action) {

    // This LOCATION_CHANGE case is copied from react-router-redux's routerReducer

    /**
     * This reducer will update the state with the most recent location history
     * has transitioned to. This may not be in sync with the router, particularly
     * if you have asynchronously-loaded routes, so reading from and relying on
     * this state is discouraged.
     * 
     * It also tries to preserve the url query from the previous page and apply
     * it to the next one.
     */

    if (action.type === LOCATION_CHANGE) {
        //merge query bu default, but in some cases, like parameter bookmarks, search parameters should be replaced
        const prevQuery = action.payload.location.state === 'urlSelect' ? {} : state.locationBeforeTransitions.query;
        return {
            ...state, locationBeforeTransitions: {
                ...{ search: '', pathname:'' },
                ...action.payload.location,
                query: { ...prevQuery, ...(parse(action.payload.location.search, { allowDots: true, ignoreQueryPrefix: true })) }
            }
        }
    }
    if (action.type === "LOCATION_CHANGE_BACK_BUTTON") {
        return {
            ...state, locationBeforeTransitions: {
                ...action.payload.location,
                pathname:action.payload.location.pathname,
                search:action.payload.location.search,
                query: parse(action.payload.location.search, { allowDots: true, ignoreQueryPrefix: true })
            }
        }
    }

    // Update the URL search query when the user applies some values from controller

    if (action.type === "UPDATE_CONTROLLER_QUERY" ||
        action.type === "UPDATE_URL_QUERY") {
        let location = state.locationBeforeTransitions;
        location = {
            ...location,
            query: action.payload.urlQuery,
            search: toUrlQuery(action.payload.urlQuery)
        };
        return { ...state, locationBeforeTransitions: location };
    }

    return state;
}
