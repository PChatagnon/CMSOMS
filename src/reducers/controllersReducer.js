import { cloneDeep } from 'lodash';

const initialState = {
    controllerPortlets: null,
    controllerData: null,
    controllerExportData: null,
    controllerQuery: null,
    controllerQueryTitle: null,
    controllerState: null,
    selectedController: null,
    controllerShown: false,
    controllers: null,
    fetchingControllers: false,
    controllerComponents: null,
    fetchingControllerComponents: false
}

export default function reducer(state = initialState, action) {

    switch (action.type) {
        case "STARTED_FETCHING_CONTROLLERS": {
            return { ...state, fetchingControllers: true }
        }
        case "FETCH_CONTROLLERS_FULFILLED": {
            const controllers = action.payload.map(c => {
                return {
                    ...c.attributes,
                    controller_component: c.attributes.controller_component.attributes,
                    selectors: c.attributes.selectors.map(s => s.attributes)
                }
            });

            return {
                ...state,
                controllers: controllers,
                fetchingControllers: false
            }
        }
        case "FETCH_CONTROLLERS_REJECTED": {
            return { ...state, fetchingControllers: false }
        }
        case "FETCH_CONTROLLER_PORTLETS_FULFILLED": {
            const portlets = action.payload.map(p => {
                return {
                    ...p.attributes,
                    portlet_component: p.attributes.portlet_component.attributes,
                    selectors: p.attributes.selectors.in.map(s => s.attributes)
                }
            });

            return { ...state, controllerPortlets: portlets }
        }
        case "STARTED_FETCHING_CONTROLLER_COMPONENTS": {
            return { ...state, fetchingControllerComponents: true }
        }
        case "FETCH_CONTROLLER_COMPONENTS_FULFILLED": {
            return {
                ...state,
                controllerComponents: action.payload.map(c => c.attributes),
                fetchingControllerComponents: false
            }
        }
        case "FETCH_CONTROLLER_COMPONENTS_REJECTED": {
            return { ...state, fetchingControllerComponents: false }
        }
        case "TOGGLE_CONTROLLER": {
            return { ...state, controllerShown: !state.controllerShown }
        }
        case "OPEN_CONTROLLER": {
            return { ...state, controllerShown: true }
        }
        case "HIDE_CONTROLLER": {
            if (!state.controllerShown) return state;
            return { ...state, controllerShown: false }
        }
        case "LOAD_CONTROLLER_FULFILLED": {
            const { controller, controllerData, controllerExportData,
                controllerState, controllerQuery, queryTitle, controllerShown } = action.payload;
            return {
                ...state,
                selectedController: controller,
                controllerData: controllerData,
                controllerExportData: controllerExportData,
                controllerQuery: controllerQuery,
                controllerQueryTitle: queryTitle,
                controllerState: controllerState,
                controllerShown: controllerShown,
                controllerPortlets: null
            }
        }
        case "UPDATE_CONTROLLER_QUERY": {
            return {
                ...state,
                controllerQuery: cloneDeep(action.payload.query),
                controllerQueryTitle: action.payload.title
            }
        }
        case "UPDATE_CONTROLLER_STATE": {
            return {
                ...state,
                controllerState: cloneDeep(action.payload)
            }
        }
        case "UPDATE_CONTROLLER_DATA": {
            return {
                ...state,
                controllerData: action.payload
            }
        }
        default:
            return state
    }
}
