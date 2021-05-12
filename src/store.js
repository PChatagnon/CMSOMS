import { applyMiddleware, createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension/developmentOnly';

import thunk from 'redux-thunk';
import { routerMiddleware } from 'connected-react-router';
import { createBrowserHistory } from 'history';

import createRootReducer from './reducers';

export const history = createBrowserHistory();

const middleware = applyMiddleware(thunk, routerMiddleware(history));

export default createStore(
    createRootReducer(history),
    //preloadedState
    composeWithDevTools(middleware)
);
