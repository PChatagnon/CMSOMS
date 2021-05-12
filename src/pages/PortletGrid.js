import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Responsive, WidthProvider } from 'react-grid-layout';

import Controller from '../components/controllers/Controller';
import Portlet from '../components/portlets/Portlet';
import FullscreenModal from '../components/PortletGrid/FullscreenModal';
import PortletEditModal from '../components/PortletGrid/PortletEditModal';

import { openSnackbar } from '../actions/appActions';
import {
    updatePortletProperty, minimizePortlet, removePortlet,
    onPortletLayoutChange, onLayoutBreakpointChange, getPortletLayoutProps
} from '../actions/portletActions';
import { addUrlParam, truncateURL, appendURL, copyUrltoClipboard, changeURL, routeChange } from '../actions/mainActions';
import { loadController, updateQuery, updateControllerState, updateControllerData, toggleController } from '../actions/controllerActions';

const PortletLayout = WidthProvider(Responsive);

function mapStateToProps(state, routerProps) {
    return {
        controllers: state.controllers,
        portlets: state.portlets,
        app: state.app,
        fullScreenModeId: state.app.fullScreenMode
    };
}

function mapDispatchToProps(dispatch) {
    return {
        ...bindActionCreators({
            updatePortletProperty, removePortlet, updateQuery, updateControllerState, loadController,
            addUrlParam, updateControllerData, onPortletLayoutChange, onLayoutBreakpointChange, changeURL,
            toggleController, truncateURL, appendURL, copyUrltoClipboard, minimizePortlet, openSnackbar
        }, dispatch),
        dispatch
    };
}

class PortletGrid extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            editPortletId: null,
            editPortletOpen: false,
            extUpdate:0
        };
    }

    componentDidUpdate(prevProps) {
        if (this.props.location.state === 'urlSelect' &&
            prevProps.location.search !== this.props.location.search) {
            this.props.dispatch(routeChange(false));
            this.setState(state => { return({ extUpdate: state.extUpdate + 1 }) });
        }
    }

    showEditPortletModal = (id) => this.setState({ editPortletId: id, editPortletOpen: true });

    closeEditPortletModal = () => this.setState({ editPortletId: null, editPortletOpen: false });

    showPortletFullScreen = (id) => {
        this.props.appendURL(`/fullscreen/${id}`);
    }

    closePortletFullScreen = () => {
        this.props.truncateURL(`/fullscreen/${this.props.fullScreenModeId}`);
    }

    findPortlet = (id) => {
        return id ? this.props.portlets.pagePortlets.find(portlet => portlet.id === id) : null;
    }

    getPortletLayoutSize = (portlet, fullScreen) => {
        if (fullScreen) {
            return window.innerHeight - 50;
        }
        let portletH = portlet.size_y;
        const { editPage, portletGridRowHeight } = this.props.app;

        if (editPage) {
            // Find portlet relative height in grid layouts of current breakpoint (eg. 'lg')
            // This is needed only in edit mode on portlet resize
            const { portletLayouts, layoutBreakpoint } = this.props.portlets;
            if (layoutBreakpoint in portletLayouts) {
                const id = portlet.id.toString();
                const layout = portletLayouts[layoutBreakpoint].find(p => p.i === id);
                if (layout) portletH = layout.h;
            }
        }
        return Math.round(portletGridRowHeight * portletH + Math.max(0, portletH - 1) * 10);
    }

    renderPortlet = (portlet, { ...params }) => {
        const minimized = this.props.portlets.minimizedPortlets.includes(portlet.id);
        const fullScreen = 'fullScreen' in params ? params.fullScreen : false;
        return (
            <Portlet
                portlet={portlet}
                editMode={this.props.app.editPage}
                removePortlet={this.props.removePortlet}
                controllerQuery={this.props.controllers.controllerQuery}
                controllerExportData={this.props.controllers.controllerExportData}
                showPortletFullScreen={this.showPortletFullScreen}
                showEditPortletModal={this.showEditPortletModal}
                fullScreenMode={fullScreen}
                minimizePortlet={this.props.minimizePortlet}
                minimized={minimized}
                portletHeight={this.getPortletLayoutSize(portlet, fullScreen)}
                addUrlParam={this.props.addUrlParam}
                changeURL={this.props.changeURL}
                extUpdate={this.state.extUpdate}
                openSnackbar={this.props.openSnackbar}
                {...params}
            />
        )
    }

    renderPortlets = () => {
        const { editPage } = this.props.app;
        const { minimizedPortlets } = this.props.portlets;

        return this.props.portlets.pagePortlets.map(portlet => {
            const gridProps = getPortletLayoutProps(portlet, editPage, minimizedPortlets);
            return (
                <div key={gridProps.i} data-grid={gridProps}>
                    {this.renderPortlet(portlet)}
                </div>
            );
        });
    }

    render() {
        if (!this.props.portlets.pagePortlets || this.props.app.loading) return (<div />);
        const { fullScreenModeId } = this.props;

        return (
            <div>
                <Controller
                    controller={this.props.controllers.selectedController}
                    visible={this.props.controllers.controllerShown}
                    toggleController={this.props.toggleController}
                    updateQuery={this.props.updateQuery}
                    updateControllerState={this.props.updateControllerState}
                    updateControllerData={this.props.updateControllerData}
                    controllerData={this.props.controllers.controllerData}
                    controllerExportData={this.props.controllers.controllerExportData}
                    controllerQuery={this.props.controllers.controllerQuery}
                    controllerState={this.props.controllers.controllerState}
                    loadController={this.props.loadController}
                    locationSearch={this.props.location.search}
                />
                <PortletLayout
                    className="layout"
                    cols={{ lg: 18, md: 18, sm: 3, xs: 3, xxs: 3 }}
                    rowHeight={this.props.app.portletGridRowHeight}
                    layouts={this.props.portlets.portletLayouts}
                    onLayoutChange={this.props.onPortletLayoutChange}
                    onBreakpointChange={this.props.onLayoutBreakpointChange}
                >
                    {this.renderPortlets()}
                </PortletLayout>
                {fullScreenModeId &&
                    <FullscreenModal
                        open={fullScreenModeId ? true : false}
                        close={this.closePortletFullScreen}
                        portlet={this.findPortlet(fullScreenModeId)}
                        renderPortlet={this.renderPortlet}
                        controllerTitle={this.props.controllers.controllerQueryTitle}
                        copyUrltoClipboard={this.props.copyUrltoClipboard}
                    />
                }
                {this.state.editPortletOpen &&
                    <PortletEditModal
                        open={this.state.editPortletOpen}
                        close={this.closeEditPortletModal}
                        portlet={this.findPortlet(this.state.editPortletId)}
                        updatePortlet={this.props.updatePortletProperty}
                        openSnackbar={this.props.openSnackbar}
                    />
                }
            </div>
        );
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(PortletGrid);
