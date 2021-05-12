import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router'

import app from './appReducer';
import workspaces from './workspacesReducer';
import controllers from './controllersReducer';
import pages from './pagesReducer';
import portlets from './portletsReducer';
import selectors from './selectorsReducer';
import user from './userReducer';
import bookmarks from './bookmarksReducer';
import routing from './routingReducer';
import masterDetails from './masterDetailsReducer';

const createRootReducer = (history) => combineReducers({
    app,
    user,
    workspaces,
    controllers,
    pages,
    portlets,
    selectors,
    bookmarks,
    router: connectRouter(history),
    routing: routing,
    md: masterDetails,
});

export default createRootReducer;
