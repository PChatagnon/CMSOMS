import { LOCATION_CHANGE } from 'connected-react-router';
import { cloneDeep } from 'lodash';

const initialState = {
    pagePortlets: null,
    initialPagePortlets: null,
    minimizedPortlets: [],
    portletLayouts: {},
    layoutBreakpoint: 'lg',
    portletComponents: null,
    fetchingPortletComponents: false,
}

export default function reducer(state = initialState, action) {

    switch (action.type) {
        case "FETCH_PORTLETS_FULFILLED": {
            return {
                ...state,
                pagePortlets: action.payload.portlets,
                initialPagePortlets: cloneDeep(action.payload.portlets),
                portletLayouts: { lg: action.payload.layout },
                minimizedPortlets: action.payload.minimizedPortlets
            }
        }
        case "CHANGE_PORTLET_LAYOUT_BREAKPOINT": {
            return { ...state, layoutBreakpoint: action.payload }
        }
        case "MODIFY_PORTLET_LAYOUTS": {
            return { ...state, portletLayouts: action.payload }
        }
        case "MINIMIZE_PORTLET": {
            return { ...state, portletLayouts: action.payload.layouts, minimizedPortlets: action.payload.minimizedPortlets }
        }
        case LOCATION_CHANGE:
        case "RESET_PORTLET_LAYOUTS": {
            // leave current portlet layout if user enters the same page
            if (action.payload && action.payload.action === "REPLACE") return state;

            // removes newly added portlets and resets portlet layout to initial stage
            return {
                ...state,
                pagePortlets: cloneDeep(state.initialPagePortlets),
                portletLayouts: {}
            }
        }
        case "ADD_NEW_PORTLET": {
            return { ...state, pagePortlets: state.pagePortlets.concat(action.payload) }
        }
        case "REMOVE_PORTLET": {
            return {
                ...state,
                pagePortlets: state.pagePortlets.filter(portlet => portlet.id !== action.payload.id),
            }
        }
        case "STARTED_FETCHING_PORTLET_COMPONENTS": {
            return { ...state, fetchingPortletComponents: true }
        }
        case "FETCH_PORTLET_COMPONENTS_FULFILLED": {
            return {
                ...state,
                portletComponents: action.payload.map(c => c.attributes),
                fetchingPortletComponents: false
            }
        }
        case "FETCH_PORTLET_COMPONENTS_REJECTED": {
            return { ...state, fetchingPortletComponents: false }
        }
        default:
            return state
    }
}
