import { LOCATION_CHANGE } from 'connected-react-router';

const initialState = {
    loading: false,
    editPage: false,
    managePage: false,
    fullScreenMode: false,
    portletbarShown: false,
    leftbarShown: false,
    snackbarShown: false,
    snackbarMessage: '',
    infoDialogShown: false,
    apiInfo: null,
    portletGridRowHeight: 30,
    pathname: ''
}

export default function reducer(state = initialState, action) {

    switch (action.type) {
        case "LOADING_STARTED": {
            if (state.loading) return state;
            return { ...state, loading: true }
        }
        case "LOADING_COMPLETED": {
            if (!state.loading) return state;
            return { ...state, loading: false }
        }
        case "TOGGLE_PORTLETBAR": {
            return { ...state, portletbarShown: !state.portletbarShown }
        }
        case "TOGGLE_INFO_DIALOG": {
            return { ...state, infoDialogShown: !state.infoDialogShown }
        }
        case "FETCH_API_INFO_FULFILLED": {
            return { ...state, apiInfo: action.payload }
        }
        case "TOGGLE_LEFTBAR": {
            return { ...state, leftbarShown: !state.leftbarShown }
        }
        case "HIDE_LEFTBAR": {
            return { ...state, leftbarShown: false }
        }
        case "OPEN_LEFTBAR": {
            return { ...state, leftbarShown: true }
        }
        case "HIDE_SNACKBAR": {
            return { ...state, snackbarShown: false }
        }
        case "OPEN_SNACKBAR": {
            return { ...state, snackbarShown: true, snackbarMessage: action.payload }
        }
        case LOCATION_CHANGE: {
            if (action.payload && action.payload.action === "REPLACE") return state;
            const pathname = action.payload.location.pathname;
            const pathnames = pathname.split('/');
            const lastElementURL = pathnames.pop(); // takes the last element in the pathname
            const editPage = pathnames.length > 3 && lastElementURL === 'edit' ? true : false;
            const fullScreenMode = pathname.includes('fullscreen') ? parseInt(lastElementURL, 10) : false; // cheks if fullScreen mode is on
            return {
                ...state,
                editPage: editPage,
                managePage: pathname.includes('manage') ? lastElementURL : false, // cheks if it's a /manage/* page
                fullScreenMode: fullScreenMode,
                portletbarShown: false,
                leftbarShown: false,
                infoDialogShown: false,
                pathname: pathname,
                loading: pathname.replace('/edit', '') !== state.pathname.replace('/edit', '') && state.fullScreenMode === fullScreenMode, // Show loading spinner when user changes the page
            }
        }
        default:
            return state
    }
}

