import { LOCATION_CHANGE } from 'connected-react-router';

const initialState = {
    pages: [],
    flatPages: [],
    fetchingPages: false,
    selectedPage: null,
    selectedPagePath: null,
    selectedPageVersion: null,
    selectedFolder: null,
    selectedFolderPath: null,
    selectedManageTreeItem: null,
}

export default function reducer(state = initialState, action) {

    switch (action.type) {
        case LOCATION_CHANGE: {
            if (action.payload && action.payload.action === "REPLACE") return state;
            const pathnames = action.payload.location.pathname.split('/');
            let folderPath = pathnames.length > 1 ? pathnames[2] : null;
            let pagePath = pathnames.length > 2 ? pathnames[3] : null;

            if (folderPath === 'manage') {
                folderPath = null;
                pagePath = null;
            }

            if (!state.pages) {
                return {
                    ...state,
                    selectedPagePath: pagePath,
                    selectedFolderPath: folderPath
                }
            }

            const folder = folderPath ?
                state.pages.find(item => item.path === folderPath) : null;

            const page = (folder && pagePath) ?
                folder.pages.find(item => item.path === pagePath) : null;

            return {
                ...state,
                fetchingPages: false,
                selectedPagePath: pagePath,
                selectedFolderPath: folderPath,
                selectedFolder: folder,
                selectedPage: page,
                selectedManageTreeItem: state.flatPages[0],
            }
        }
        case "STARTED_FETCHING_PAGES": {
            return { ...state, fetchingPages: true }
        }
        case "FETCH_PAGES_FULFILLED": {
            const { selectedPagePath, selectedFolderPath } = state;

            const folders = action.payload.map(folder => {
                const pages = folder.attributes.pages.map(p => p.attributes);
                return { ...folder.attributes, pages: pages };
            });

            const folder = selectedFolderPath ?
                folders.find(item => item.path === selectedFolderPath) :
                null;

            const page = (folder && selectedPagePath) ?
                folder.pages.find(item => item.path === selectedPagePath) :
                null;

            const version = page ? page.version : null;
            return {
                ...state,
                fetchingPages: false,
                pages: folders,
                flatPages: folders.reduce((result, folder) => result.concat(folder, folder.pages), []),
                selectedPage: page,
                selectedPageVersion: version,
                selectedFolder: folder,
            }
        }
        case "CHANGE_MANAGE_TREE_ITEM": {
            return { ...state, selectedManageTreeItem: action.payload }
        }
        case "UPDATE_PAGE_VERSION": {
            return { ...state, selectedPageVersion: action.payload }
        }
        default:
            return state
    }
}
