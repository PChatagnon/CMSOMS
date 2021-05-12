import React, { Component, Suspense } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import CreateIcon from '@material-ui/icons/Create';
import RefreshIcon from '@material-ui/icons/Refresh';
import InfoIcon from '@material-ui/icons/Info';
import DeleteIcon from '@material-ui/icons/Delete';
import WarningIcon from '@material-ui/icons/Warning';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import grey from '@material-ui/core/colors/grey';
import Spinner from '../generic/Spinner';
import Loader from '../../utils/loader/react-loader-advanced';
import logger from '../../utils/logger';
import { isEqual } from 'lodash';
import { CancelToken } from 'axios';
import AggWrapper from '../providers/AggWrapper';
import PortletErrorBoundary from './PortletErrorBoundary';
import { queryToFilters } from './PortletUtils';
import { getExternalPortletPath } from '../../external/ExternalPortletMap';

const styles = {
    iconsContainer: { top: 5, right: 5, margin: 'auto', position: 'absolute' },
    iconButton: { width: 24, height: 24, padding: 3 },
    icon: { top: 0, bottom: 0, width: 18, height: 18, color: grey[500] },
    errorIcon: { verticalAlign: 'bottom', paddingLeft: 6, color: grey[600] },
    content: { padding: 0, margin: 10, marginTop: -5 },
    loader: { backgroundColor: 'rgba(255,255,255,0.5)' },
    loaderMessage: {
        backgroundColor: 'white',
        color: grey[800],
        display: 'table',
        fontSize: 16,
        padding: 10,
        margin: '0px auto 0px auto'
    },
    title: { fontSize: 15 },
    header: { paddingTop: 10, padding: 10, paddingLeft: 12 },
}

const HEADER_HEIGHT = 38;
const FOOTER_HEIGHT = 60;

const PORTLET_TYPE_MAP = {
    'chart': 'charts',
    'table': 'tables',
    'text': 'text',
    'generic_table': 'generic/datatable',
    'generic_chart': 'generic/charts'
};

class Portlet extends Component {

    constructor(props) {
        super(props);

        // Use portlet_properties configuration on top of general portlet config
        const { portlet, configuration } = props.portlet;

        const portletGeneralConfig = portlet.configuration ? portlet.configuration : {};
        const portletProperties = configuration ? configuration : {};

        this.portletConfig = { ...portletGeneralConfig, ...portletProperties };

        // Title
        this.title = 'title' in this.portletConfig ?
            this.portletConfig.title : portlet.title;

        // Static portlet param
        this.static = 'static' in this.portletConfig ?
            this.portletConfig.static : false;

        // Footer param
        this.showFooter = 'showFooter' in this.portletConfig ?
            this.portletConfig.showFooter : false;

        // Set page auto reload timer triggered by controller
        this.timer = 'autoReload' in this.portletConfig ?
            setInterval(this.autoRefresh, this.portletConfig.autoReload) : null;

        // Set individual portlet auto refresh timer
        this.timer = 'autoRefresh' in this.portletConfig ?
            setInterval(this.forceRefresh, this.portletConfig.autoRefresh) : null;

        this.PortletComponent = React.lazy(() => {
            const componentType = PORTLET_TYPE_MAP[portlet.portlet_component.type] || portlet.portlet_component.type;
            const portletExternalPath = getExternalPortletPath(portlet.portlet_component.name);
            return import(`./${componentType}/${portlet.portlet_component.name}`)
                .catch(() => import(`../../external/${portletExternalPath}/${portlet.portlet_component.name}`)
                    .catch(() => import(`./PortletNotFound`))
		);
        });

        // Helper flag to avoid calling setState() after a component has unmounted
        this._isMounted = true;

        // Used to cancel all the portlet requests after a component has unmounted
        this.cancelSource = CancelToken.source();

        // Agg Provider params general to all portlets
        this.params = { cancelToken: this.cancelSource.token };

        // Agg Path
        if ('aggpath' in this.portletConfig) {
            this.params.aggpath = this.portletConfig.aggpath;
        }

        // Initial state
        this.state = {
            loading: false,
            failed: false,
            empty: false,
            refresh: false,
            errorMsg: '',
            errorDetails: '',
            title: this.title
        };
    }

    componentDidUpdate(prevProps) {
        if (this.props.portletKey !== prevProps.portletKey) {
            this.forceRefresh();
        }
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
        this.cancelSource.cancel("Portlet: component is unmounting");
        clearInterval(this.timer);
    }

    showLoader = (callback = null) => {
        if (!this._isMounted) return;
        this.setState({ loading: true }, callback);
    }

    hideLoader = () => {
        if (!this._isMounted) return;
        this.setState({ loading: false, empty: false, failed: false });
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!this._isMounted) return false;

        if (!isEqual(this.props.controllerQuery, nextProps.controllerQuery) ||
            this.props.portletHeight !== nextProps.portletHeight ||
            this.props.fullScreenMode !== nextProps.fullScreenMode ||
            this.props.minimized !== nextProps.minimized ||
            this.props.portlet.configuration !== nextProps.portlet.configuration) {
            return true;
        }
        if (this.state.loading !== nextState.loading ||
            this.state.failed !== nextState.failed ||
            this.state.empty !== nextState.empty ||
            this.state.refresh !== nextState.refresh) {
            return true;
        }
        if (this.props.extUpdate !== nextProps.extUpdate)
            return true;
        return false;
    }

    shouldUpdate = (oldQuery, newQuery, callback, callbackOther) => {
        // Deep comparison between two queries.
        // Skip the update if queries are identical.
        if (!isEqual(oldQuery, newQuery)) {
            if (!oldQuery) return false;
            return callback(newQuery);
        }
        else if (callbackOther) {
            callbackOther();
        }
        return false;
    }

    shouldRefresh = (props, callback, callbackOther) => {
        if (props.refresh) {
            callback();
            this.setState({ refresh: false });
        }
        else if (callbackOther) {
            callbackOther();
        }
    }

    autoRefresh = () => {
        const { controllerQuery } = this.props;
        const update = 'update' in controllerQuery ? controllerQuery.update : false;
        if (update) this.forceRefresh();
    }

    forceRefresh = () => this.setState({ refresh: true });

    onFailure = (error) => {
        if (!this._isMounted) return;

        logger.error(error, 'Portlet');
        let errorMsg = 'Whoops, something went wrong!';
        let errorDetails = 'No details';
        if (error.response) {
            const { status, statusText, data } = error.response;
            if (status >= 400) {
                errorMsg = `Failed to fetch data: ${statusText} (${status})`;
            }
            if (data && data instanceof Object && 'errors' in data && data.errors.length > 0) {
                errorDetails = data.errors[0].detail;
            }
        }
        this.setState({ failed: true, loading: false, errorMsg: errorMsg, errorDetails: errorDetails, empty: false });
    }

    onEmpty = () => {
        if (!this._isMounted) return;
        this.setState({ empty: true, loading: false, failed: false, errorMsg: '', errorDetails: '' });
    }

    setTitle = (title) => {
        this.title = title;
        this.setState({ title: title});
    }

    isNewPortlet = (portlet) => {
        return portlet.id && typeof portlet.id === "string" && portlet.id.startsWith('new');
    }

    fetchData = (endpoint, params = {}) => {
        // TODO: endpoint could be taken from config

        // Query could be defined in the params or taken from controller props
        const query = params.query || this.props.controllerQuery;
        const selectors = params.selectors || this.props.portlet.portlet.selectors.in || [];

        // Make an API call
        return AggWrapper.fetch(endpoint, {

            // inject default params (like cancelToken, aggpath)
            ...this.params,

            // portlet params (like sorting, pagesize, include..)
            ...params,

            // controller query
            query: { ...query },

            // translate controller query into API filters
            // (cms_run=value => filter[run_number][EQ]=value)
            filters: queryToFilters(query, params, selectors)
        });
    }

    renderIcons = (portlet) => {
        const { editMode, classes } = this.props;
        const description = this.portletConfig && this.portletConfig.portletTooltip ? this.portletConfig.portletTooltip : portlet.portlet.description;
        return (
            <div className={`${classes.iconsContainer} nonPrintable`}>

                <Tooltip title={description}>
                    <IconButton className={classes.iconButton}>
                        <InfoIcon className={classes.icon} />
                    </IconButton>
                </Tooltip>

                <Tooltip title='Refresh'>
                    <IconButton
                        className={classes.iconButton}
                        onClick={this.forceRefresh}
                    >
                        <RefreshIcon className={classes.icon} />
                    </IconButton>
                </Tooltip>

                {!editMode && !this.static &&
                    <Tooltip title={this.props.minimized ? 'Maximize' : 'Minimize'}>
                        <IconButton
                            className={classes.iconButton}
                            onClick={() => this.props.minimizePortlet(portlet.id)}
                        >
                            {this.props.minimized ?
                                <ExpandMoreIcon className={classes.icon} /> :
                                <ExpandLessIcon className={classes.icon} />
                            }
                        </IconButton>
                    </Tooltip>
                }

                {!editMode && !this.static &&
                    <Tooltip title='Full Screen'>
                        <IconButton
                            className={classes.iconButton}
                            onClick={() => this.props.showPortletFullScreen(portlet.id)}
                        >
                            <FullscreenIcon className={classes.icon} />
                        </IconButton>
                    </Tooltip>
                }

                {editMode &&
                    <Tooltip
                        title={this.isNewPortlet(portlet) ? 'Please save page from the Edit menu first' : 'Edit'}
                    >
                        <span>
                            <IconButton
                                className={classes.iconButton}
                                onClick={() => this.props.showEditPortletModal(portlet.id)}
                                disabled={this.isNewPortlet(portlet)}
                            >
                                <CreateIcon className={classes.icon} />
                            </IconButton>
                        </span>
                    </Tooltip>
                }

                {editMode &&
                    <Tooltip title='Remove'>
                        <IconButton
                            className={classes.iconButton}
                            onClick={() => this.props.removePortlet(portlet)}
                        >
                            <DeleteIcon className={classes.icon} />
                        </IconButton>
                    </Tooltip>
                }
            </div >
        );
    }

    getLoaderMessage = () => {
        const { loading, failed, empty, errorMsg, errorDetails } = this.state;
        const { classes } = this.props;

        if (loading)
            return <Spinner />;

        if (failed) {
            return (
                <p className={classes.loaderMessage}>
                    {errorMsg}
                    <Tooltip title={errorDetails}>
                        <WarningIcon className={classes.errorIcon} />
                    </Tooltip>
                    <br />
                    Try to refresh the portlet
                    <IconButton onClick={this.forceRefresh}>
                        <RefreshIcon style={{ color: grey[600] }} />
                    </IconButton>
                </p>
            );
        }

        if (empty) {
            let msg = 'Looks like there is no data';
            const { configuration } = this.props.portlet.portlet;
            if (configuration && 'onNoData' in configuration) {
                msg = configuration['onNoData'];
            }
            return <p style={{ ...styles.loaderMessage, margin: 'auto auto -60px' }}>{msg}</p>;
        }

        return <Spinner />;
    }

    renderPortlet = (portlet) => {
        const { loading, empty, failed } = this.state;

        const portletHeight = this.props.portletHeight - HEADER_HEIGHT;
        const curtainHeight = this.showFooter ? portletHeight - FOOTER_HEIGHT : portletHeight;
        const id = portlet.id + '_' + portlet.page_id;
        const query = this.props.controllerQuery;
        const queryProps = query && 'props' in query ? query.props : {};
        //React class "tag" doesn't recognize 'this' which breaks lazyloading
        //Seems to be related to dependency chain, in particular version of caniuse-lite db module
        const PortletWrapper = this;
        return (
            <PortletErrorBoundary>
                <Loader
                    show={loading || empty || failed}
                    message={this.getLoaderMessage()}
                    backgroundStyle={{ ...styles.loader, maxHeight: curtainHeight, height: curtainHeight }}
                >
                    <Suspense fallback={<div className="loader"><Spinner /></div>}>
                        <PortletWrapper.PortletComponent
                            id={id}
                            portletHeight={portletHeight}
                            query={query}
                            controllerExportData={this.props.controllerExportData}
                            configuration={this.portletConfig}
                            groupId={portlet.group_id}
                            selectors={portlet.portlet.selectors}
                            showLoader={this.showLoader}
                            hideLoader={this.hideLoader}
                            refresh={this.state.refresh}
                            fetchData={this.fetchData}
                            shouldRefresh={this.shouldRefresh}
                            shouldUpdate={this.shouldUpdate}
                            onFailure={this.onFailure}
                            onEmpty={this.onEmpty}
                            setTitle={this.setTitle}
                            fullscreen={this.props.fullScreenMode}
                            editMode={this.props.editMode}
                            changeURL={this.props.changeURL}
                            openSnackbar={this.props.openSnackbar}
                            addUrlParam={this.props.addUrlParam}
                            urlParams={id in queryProps ? queryProps[id] : null}
                            extUpdate={this.props.extUpdate}
                        />
                    </Suspense>
                </Loader>
            </PortletErrorBoundary>
        );
    }

    render() {
        const { portlet, minimized, classes } = this.props;
        if (!portlet) return <div />;

        // On full screen mode load only the portlet component
        if (this.props.fullScreenMode) {
            return this.renderPortlet(portlet);
        }

        return (
            <Card
                className='portlet'
                data-tut={'tutorial_portlet_' + portlet.id}
            >
                <CardHeader
                    title={this.title}
                    action={this.renderIcons(portlet)}
                    data-tut={'tutorial_portlet_header_' + portlet.id}
                    style={minimized ? { paddingTop: 5 } : {}}
                    classes={{
                        title: classes.title,
                        root: classes.header
                    }}
                />
                <CardContent className={classes.content}>
                    {this.renderPortlet(portlet)}
                </CardContent>
            </Card>
        );
    }
}

export default withStyles(styles)(Portlet);

Portlet.defaultProps = {
    editMode: false,
    fullScreenMode: false
};
