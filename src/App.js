import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';
import { bindActionCreators } from 'redux';
//import { history } from './store';
import { fetchInitData, fetchWorkspacePages, updateOnBackButton, routeChange } from './actions/mainActions';
import { openSnackbar, hideSnackbar } from './actions/appActions';
import Header from './components/Header/Header';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import Spinner from './components/generic/Spinner';
import Loader from './utils/loader/react-loader-advanced';
import ReactGA from 'react-ga';
import EventEmitter from 'events';
import { getHost, getEnv, DEV_HOST, PROD_HOST } from './utils/hostUtils';
import PortletGrid from './pages/PortletGrid';
import ManagePages from './pages/ManagePages';
import ManageWorkspace from './pages/ManageWorkspace';
import ManageWidgets from './pages/ManageWidgets';
import ManageBookmarks from './pages/ManageBookmarks';
import Tutorial from './pages/Tutorial';
import PageNotFound from './pages/PageNotFound';

function mapStateToProps(state, routerProps) {
    return { app: state.app };
}

function mapDispatchToProps(dispatch) {
    return {
        ...bindActionCreators({ hideSnackbar, openSnackbar }, dispatch),
        dispatch
    };
}

class AppComponent extends Component {

    static propTypes = {
        match: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired,
        history: PropTypes.object.isRequired
    };

    constructor() {
        super();

        EventEmitter.defaultMaxListeners = Infinity;

        const env = getEnv();
        const host = getHost();

        // Enable debug messages on development environment
        if (env !== 'production' || host === DEV_HOST) {
            localStorage.setItem('debug', 'OMS:*');
        }

        // For development initialize GA with a fake tracking ID to remove warning messages
        if (env !== 'production') {
            //return ReactGA.initialize('UA-000000-01');
            ReactGA.initialize('UA-000000-01');
            return;
        }

        switch (host) {
            case DEV_HOST:
                ReactGA.initialize('UA-98332895-1');
                return;
            case PROD_HOST:
                ReactGA.initialize('UA-98332895-2');
                return;
            default:
                return;
        }
    }

    componentDidMount() {

        this.backListener = this.props.history.listen(( location, action ) => {
            if (action === "POP") {
                this.props.dispatch(updateOnBackButton(this.props.location));
                this.props.dispatch(routeChange())
            }
        });

        this.props.dispatch(fetchInitData());
    }

    componentWillUnmount() {

        // Unbind listener
        this.backListener();
    }

    componentDidUpdate(prevProps) {

        // Fetch all workspace pages on workspace change
        if (this.props.match.params.workspacePath !== prevProps.match.params.workspacePath
            || this.props.location.state === 'exitManageMode') {
            return this.props.dispatch(fetchWorkspacePages());
        }

        if (this.props.app.managePage) return;

        // Fetch all workspace pages when workspace stays the same, but
        // there is no page and folder defined in the url.
        // covers transition from cms/index/index_page to /cms
        if ((!this.props.match.params.pagePath && prevProps.match.params.pagePath) ||
            (!this.props.match.params.folderPath && prevProps.match.params.folderPath)) {
            return this.props.dispatch(fetchWorkspacePages());
        }

        if (this.props.location.pathname !== prevProps.location.pathname) {
            return this.props.dispatch(routeChange());
        }

        if (this.props.location.state === 'resetApp' && prevProps.location.search!==this.props.location.search) {
            return this.props.dispatch(routeChange());
        }

    }

    render() {
        return (
            <div>
                <Header pageRef={this.pageRef} />
                <Loader
                    show={this.props.app.loading}
                    message={<Spinner />}
                    backgroundStyle={{ backgroundColor: 'white' }}
                    messageStyle={{ height: '90vh' }}
                    ref={el => (this.pageRef = el)}
                >

                    <Switch>
                        <Route exact path="/" component={PortletGrid} />
                        <Route exact path="/:workspacePath/manage" component={ManagePages} />
                        <Route exact path="/:workspacePath/manage/workspace" component={ManageWorkspace} />
                        <Route exact path="/:workspacePath/manage/widgets" component={ManageWidgets} />
                        <Route exact path="/:workspacePath/manage/pages" component={ManagePages} />
                        <Route exact path="/:workspacePath/manage/bookmarks" component={ManageBookmarks} />

                        <Route exact path="/:workspacePath/index/tutorial" component={Tutorial} />

                        <Route exact path="/:workspacePath" component={PortletGrid} />
                        <Route exact path="/:workspacePath/:folderPath" component={PortletGrid} />
                        <Route exact path="/:workspacePath/:folderPath/:pagePath" component={PortletGrid} />
                        <Route exact path="/:workspacePath/:folderPath/:pagePath/edit" component={PortletGrid} />
                        <Route exact path="/:workspacePath/:folderPath/:pagePath/fullscreen/:portletId" component={PortletGrid} />
                        <Route path="/*" component={PageNotFound} />
                    </Switch>

                </Loader>
                <Snackbar
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    open={this.props.app.snackbarShown}
                    autoHideDuration={6000}
                    onClose={this.props.hideSnackbar}
                    ContentProps={{ 'aria-describedby': 'message-id' }}
                    message={<span id="message-id">{this.props.app.snackbarMessage}</span>}
                    action={[
                        <Button key="undo" color="secondary" size="small" onClick={this.props.hideSnackbar}>
                            OK
                        </Button>
                    ]}
                />
            </div>
        );
    }
}

const App = connect(
    mapStateToProps,
    mapDispatchToProps
)(AppComponent)

export default App;
