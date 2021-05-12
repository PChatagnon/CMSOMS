import React from 'react';
import ReactDOM from 'react-dom';
import ReactGA from 'react-ga';
import 'react-app-polyfill/ie9'; // For IE 9-11 support
import 'react-app-polyfill/ie11'; // For IE 11 support
import { Provider } from 'react-redux';
import { Route, Switch } from 'react-router-dom';
import { ConnectedRouter } from 'connected-react-router';

import App from './App';
import store, { history } from './store';
import registerServiceWorker from './registerServiceWorker';
import { getEnv } from './utils/hostUtils';

import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import blue from '@material-ui/core/colors/blue';
import axios from 'axios';

// Css imports
import 'react-image-gallery/styles/css/image-gallery.css';
import 'katex/dist/katex.css';
import 'typeface-roboto';
import './styles/index.css';
import './styles/portlet-grid.css';

// Polyfill imports
import 'core-js/es/object';
import 'core-js/es/map';
import 'core-js/es/object/set-prototype-of';
import 'core-js/es/set';
import 'core-js/modules/es.symbol';
import 'core-js/modules/es.array.includes';
import 'core-js/modules/es.string.includes';
import 'core-js/modules/es.array.find';
import 'core-js/modules/es.array.find-index';
import 'core-js/modules/es.array.iterator.js';
import 'core-js/modules/es.array.from';
import 'core-js/modules/es.object.keys';
import 'core-js/modules/es.object.entries';
import 'core-js/modules/es.number.is-integer';

axios.defaults.maxRedirects = 0;

if (getEnv() !== 'production') {
    //for development server this can be used for testing access, if set in development.env.local
    if (process.env.REACT_APP_TEST_USER_ENABLE==="true") {
        console.log("USING DEVELOPMENT AUTH")
        axios.defaults.headers.common['Omsdev-Claim-Upn'] = process.env.REACT_APP_TEST_USER_LOGIN;
        axios.defaults.headers.common['Omsdev-Claim-Name'] = process.env.REACT_APP_TEST_USER_NAME;
        axios.defaults.headers.common['Omsdev-Claim-Email'] = process.env.REACT_APP_TEST_USER_EMAIL;
        axios.defaults.headers.common['Omsdev-Claim-Roles'] = process.env.REACT_APP_TEST_USER_ROLES;
    }
}

axios.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (!error.response && !axios.isCancel(error)) {
        window.location.reload();
    }
    return Promise.reject(error);
});

// Override global table styles
const themeV1 = createMuiTheme({
    typography: {
        fontSize: 13,
    },
    palette: {
        primary: { light: blue[300], main: blue[500], dark: blue[700] }
    },
    overrides: {
        MuiMenuItem: {
            root: {
                fontSize: "0.8125rem",
                minHeight: 8,
                letterSpacing: 0
            },
        },
        MuiListItemText: {
            root: {
                marginTop: 2,
                marginBottom: 2
            }
        },
        MuiButton: {
            root: {
                fontWeight: 400,
            }
        }
    },
});

registerServiceWorker();

function logPageView() {
    ReactGA.set({ page: window.location.pathname });
    ReactGA.pageview(window.location.pathname);
};

//routing definition is similar to one found in App.js.
//Reason is that App needs to know workspacePath, folderPath
//and pagePath to fetch data correctly from DB. By putting routes
//in children only, it'd lack definition to parse them
const Main = () => (
    <MuiThemeProvider theme={themeV1}>
        <Provider store={store}>
            <ConnectedRouter history={history} onUpdate={logPageView}>
                <Switch>
                    <Route exact path="/" component={App} />
                    <Route exact path="/:workspacePath" component={App} />
                    <Route exact path="/:workspacePath/manage" component={App} />
                    <Route exact path="/:workspacePath/manage/workspace" component={App} />
                    <Route exact path="/:workspacePath/manage/widgets" component={App} />
                    <Route exact path="/:workspacePath/manage/pages" component={App} />
                    <Route exact path="/:workspacePath/manage/bookmarks" component={App} />
                    <Route exact path="/:workspacePath/index/tutorial" component={App} />
                    <Route exact path="/:workspacePath/:folderPath" component={App} />
                    <Route exact path="/:workspacePath/:folderPath/:pagePath" component={App} />
                    <Route exact path="/:workspacePath/:folderPath/:pagePath/edit" component={App} />
                    <Route exact path="/:workspacePath/:folderPath/:pagePath/fullscreen/:portletId" component={App} />
                    <Route path="/*" component={App} />
                </Switch>
            </ConnectedRouter>
        </Provider>
    </MuiThemeProvider>
);

ReactDOM.render(
    <Main />,
    document.getElementById('main')
);

