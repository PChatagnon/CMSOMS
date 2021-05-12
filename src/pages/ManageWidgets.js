import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import ManageComponents from '../components/ManageWidgets/ManageComponents';
import ManagePortlets from '../components/ManageWidgets/ManagePortlets';
import ManageSelectors from '../components/ManageWidgets/ManageSelectors';
import ManageControllers from '../components/ManageWidgets/ManageControllers';
import { loadingCompleted, openSnackbar } from '../actions/appActions';
import { fetchWorkspacePortlets, selectWorkspacePortlet, fetchWorkspaceControllers,  } from '../actions/workspaceActions';
import { fetchSelectors, updateSelector, addSelector, deleteSelector } from '../actions/selectorActions';
import {
    fetchPortletComponents, updatePortlet, addPortlet, deletePortlet,
    updatePortletComponent, addPortletComponent, deletePortletComponent
} from '../actions/portletActions';
import {
    fetchControllerComponents, updateController, addController, deleteController,
    updateControllerComponent, addControllerComponent, deleteControllerComponent
} from '../actions/controllerActions';

function mapStateToProps(state) {
    return {
        app: state.app,
        workspaces: state.workspaces,
        selectors: state.selectors,
        portlets: state.portlets,
        controllers: state.controllers,
        pages: state.pages
    };
}

function mapDispatchToProps(dispatch) {
    return {
        ...bindActionCreators({
            fetchWorkspacePortlets, selectWorkspacePortlet, updatePortlet, addPortlet, fetchWorkspaceControllers,
            updateController, addController, addSelector, updateSelector, deleteSelector, fetchSelectors,
            fetchPortletComponents, fetchControllerComponents, openSnackbar, deleteController,
            updateControllerComponent, addControllerComponent, deleteControllerComponent,
            updatePortletComponent, addPortletComponent, deletePortletComponent, deletePortlet
        }, dispatch),
        dispatch
    };
}

class ManageWidgets extends React.Component {

    state = {
        tab: 0,
    }

    componentDidUpdate() {
        this.props.dispatch(loadingCompleted());
    }

    componentDidMount() {
        this.props.dispatch(loadingCompleted());
    }

    render() {
        const { selectedWorkspace } = this.props.workspaces;
        if (!selectedWorkspace) return null;

        const { selectors } = this.props.selectors;
        const workspaceSelectors = selectors
        ? selectors
            .filter(s => s.workspace_id === selectedWorkspace.id)
            .sort((a, b) => (a.title > b.title) ? 1 : -1)
        : null;
        const { tab } = this.state;
        return (
            <div>
                <AppBar position="static">
                    <Tabs
                        value={tab} variant="fullWidth"
                        onChange={(e, value) => this.setState({ tab: value })}
                    >
                        <Tab label="Portlets" />
                        <Tab label="Selectors" />
                        <Tab label="Controllers" />
                        <Tab label="Components" />
                    </Tabs>
                </AppBar>
                {tab === 0 &&
                    <ManagePortlets
                        portlets={this.props.workspaces.workspacePortlets}
                        selectedPortlet={this.props.workspaces.selectedWorkspacePortlet}
                        fetchPortlets={this.props.fetchWorkspacePortlets}
                        fetchingPortlets={this.props.workspaces.fetchingWorkspacePortlets}
                        selectPortlet={this.props.selectWorkspacePortlet}
                        updatePortlet={this.props.updatePortlet}
                        addPortlet={this.props.addPortlet}
                        deletePortlet={this.props.deletePortlet}
                        fetchPortletComponents={this.props.fetchPortletComponents}
                        fetchingComponents={this.props.portlets.fetchingPortletComponents}
                        portletComponents={this.props.portlets.portletComponents}
                        fetchSelectors={this.props.fetchSelectors}
                        fetchingSelectors={this.props.selectors.fetchingSelectors}
                        fetchingPages={this.props.pages.fetchingPages}
                        selectors={selectors}
                        workspaces={this.props.workspaces.workspaces}
                        selectedWorkspace={selectedWorkspace}
                        openSnackbar={this.props.openSnackbar}
                    />
                }
                {tab === 1 &&
                    <ManageSelectors
                        selectors={workspaceSelectors}
                        workspaceId={selectedWorkspace.id}
                        updateSelector={this.props.updateSelector}
                        addSelector={this.props.addSelector}
                        deleteSelector={this.props.deleteSelector}
                        openSnackbar={this.props.openSnackbar}
                    />
                }
                {tab === 2 &&
                    <ManageControllers
                        updateController={this.props.updateController}
                        addController={this.props.addController}
                        deleteController={this.props.deleteController}
                        controllers={this.props.workspaces.workspaceControllers}
                        fetchingControllers={this.props.workspaces.fetchingWorkspaceControllers}
                        fetchControllers={this.props.fetchWorkspaceControllers}
                        controllerComponents={this.props.controllers.controllerComponents}
                        fetchingControllerComponents={this.props.controllers.fetchingControllerComponents}
                        fetchControllerComponents={this.props.fetchControllerComponents}
                        workspaces={this.props.workspaces.workspaces}
                        workspaceId={selectedWorkspace.id}
                        openSnackbar={this.props.openSnackbar}
                        selectors={selectors}
                        fetchingPages={this.props.pages.fetchingPages}
                        pages={this.props.pages.flatPages}
                    />
                }
                {tab === 3 &&
                    <ManageComponents
                        workspaces={this.props.workspaces.workspaces}
                        workspaceId={selectedWorkspace.id}
                        portletComponents={this.props.portlets.portletComponents}
                        fetchPortletComponents={this.props.fetchPortletComponents}
                        fetchingPortletComponents={this.props.portlets.fetchingPortletComponents}
                        controllerComponents={this.props.controllers.controllerComponents}
                        fetchingControllerComponents={this.props.controllers.fetchingControllerComponents}
                        fetchControllerComponents={this.props.fetchControllerComponents}
                        updateControllerComponent={this.props.updateControllerComponent}
                        addControllerComponent={this.props.addControllerComponent}
                        deleteControllerComponent={this.props.deleteControllerComponent}
                        updatePortletComponent={this.props.updatePortletComponent}
                        addPortletComponent={this.props.addPortletComponent}
                        deletePortletComponent={this.props.deletePortletComponent}
                        controllers={this.props.workspaces.workspaceControllers}
                        fetchingControllers={this.props.workspaces.fetchingWorkspaceControllers}
                        fetchControllers={this.props.fetchWorkspaceControllers}
                        portlets={this.props.workspaces.workspacePortlets}
                        fetchPortlets={this.props.fetchWorkspacePortlets}
                        fetchingPortlets={this.props.workspaces.fetchingWorkspacePortlets}
                        fetchingPages={this.props.pages.fetchingPages}
                        openSnackbar={this.props.openSnackbar}
                    />
                }
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ManageWidgets);
