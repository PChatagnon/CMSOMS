import { LOCATION_CHANGE } from 'connected-react-router';

const initialState = {
    workspaces: [],
    selectedWorkspace: null,
    selectedWorkspacePath: null,
    selectedWorkspaceVersion: null,
    workspacePortlets: null,
    fetchingWorkspacePortlets: false,
    selectedWorkspacePortlet: null,
    workspaceControllers: null,
    fetchingWorkspaceControllers: null,
    workspaceAdmin: false,
}

export default function reducer(state = initialState, action) {

    switch (action.type) {
        case LOCATION_CHANGE: {
            if (action.payload && action.payload.action === "REPLACE") return state;
            const pathnames = action.payload.location.pathname.split('/');
            const workspacePath = pathnames[1] !== '' ? pathnames[1] : null;
            let workspace = state.workspaces.length ? state.workspaces[0] : null;
            if (state.workspaces && workspacePath) {
                workspace = state.workspaces.find(item => item.path === workspacePath);
            }
            let admin = false;
            if (workspace) {
                if (workspace.path === 'demo')
                    admin = true;
                else
                    admin = 'is_admin' in workspace ? workspace.is_admin : false;
            }

            return {
                ...state,
                selectedWorkspacePath: workspacePath,
                selectedWorkspace: workspace,
                workspaceAdmin: admin,
            }
        }
        case "FETCH_WORKSPACES_FULFILLED": {
            const workspaces = action.payload.workspaces.map(w => w.attributes);
            const { selectedWorkspacePath } = state;
            // Select workspace value from url if specified or take the fist value
            let workspace = workspaces[0];
            if (selectedWorkspacePath) {
                const ws = workspaces.find(item => item.path === selectedWorkspacePath);
                // Set selected workspace as null if workspace path was specified, but invalid
                workspace = ws ? ws : null;
            }
            const version = workspace ? workspace.version : null;
            let admin = false;
            if (workspace) {
                if (workspace.path === 'demo')
                    admin = true;
                else
                    admin = 'is_admin' in workspace ? workspace.is_admin : false;
            }

            return {
                ...state,
                workspaces: workspaces,
                selectedWorkspaceVersion: version,
                selectedWorkspace: workspace,
                workspaceAdmin: admin,
            }
        }
        case "STARTED_FETCHING_WORKSPACE_PORTLETS": {
            return { ...state, fetchingWorkspacePortlets: true }
        }
        case "FETCH_WORKSPACE_PORTLETS_FULFILLED": {
            const portlets = action.payload.map(p => {
                return {
                    ...p.attributes,
                    portlet_component: p.attributes.portlet_component.attributes,
                    selectorsIn: p.attributes.selectors.in.map(s => s.attributes),
                    selectorsOut: p.attributes.selectors.out.map(s => s.attributes),
                }
            });
            return {
                ...state,
                workspacePortlets: portlets,
                selectedWorkspacePortlet: portlets.length ? portlets.filter(p => p.portlet_component.type === 'generic_table')[0] : null,
                fetchingWorkspacePortlets: false
            }
        }
        case "FETCH_WORKSPACE_PORTLETS_REJECTED": {
            return { ...state, fetchingWorkspacePortlets: false }
        }
        case "SELECT_WORKSPACE_PORTLET": {
            return { ...state, selectedWorkspacePortlet: action.payload }
        }
        case "STARTED_FETCHING_WORKSPACE_CONTROLLERS": {
            return { ...state, fetchingWorkspaceControllers: true }
        }
        case "FETCH_WORKSPACE_CONTROLLERS_FULFILLED": {
            const controllers = action.payload.map(c => {
                return {
                    ...c.attributes,
                    controller_component: c.attributes.controller_component.attributes,
                    selectors: c.attributes.selectors.map(s => s.attributes)
                }
            });

            return {
                ...state,
                workspaceControllers: controllers,
                fetchingWorkspaceControllers: false
            }
        }
        case "FETCH_WORKSPACE_CONTROLLERS_REJECTED": {
            return { ...state, fetchingWorkspaceControllers: false }
        }
        case "FETCH_PAGES_FULFILLED": {
            // On workspace change delete workspace portlets
            return {
                ...state,
                workspacePortlets: null,
                workspaceControllers: null,
                selectedWorkspacePortlet: null,
            }
        }
        case "UPDATE_WORKSPACE_VERSION": {
            return { ...state, selectedWorkspaceVersion: action.payload }
        }
        default:
            return state
    }
}

