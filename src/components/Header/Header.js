import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

// Actions
import { togglePortletbar, toggleLeftbar, toggleInfoDialog, openSnackbar } from '../../actions/appActions';
import { addNewPortlet, onPortletLayoutSave, resetPortlets } from '../../actions/portletActions';
import { onFolderSelect } from '../../actions/pageActions';
import { toggleController } from '../../actions/controllerActions';
import { copyUrltoClipboard, getUrlQuery, changeURL } from '../../actions/mainActions';

// Components
import Headerbar from './Headerbar';
import Leftbar from './Leftbar';
import Portletbar from './Portletbar';
import InfoModal from '../PortletGrid/InfoModal';

function mapStateToProps(state) {
    return {
        workspaces: state.workspaces,
        controllers: state.controllers,
        user: state.user,
        pages: state.pages,
        portlets: state.portlets,
        app: state.app,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        ...bindActionCreators({
            openSnackbar, togglePortletbar, addNewPortlet, onPortletLayoutSave, resetPortlets,
            onFolderSelect, toggleController, toggleLeftbar, toggleInfoDialog, changeURL, copyUrltoClipboard, getUrlQuery
        }, dispatch),
        dispatch
    };
}

const Header = (props) => {

    const getWorkspaceDescription = () => {
        const { selectedWorkspace } = props.workspaces;
        if (!selectedWorkspace) return '';
        return selectedWorkspace.description;
    }

    const { layoutBreakpoint } = props.portlets;
    const largeScreen = layoutBreakpoint !== 'sm' && layoutBreakpoint !== 'xs' && layoutBreakpoint !== 'xxs';
    const mediumScreen = layoutBreakpoint === 'md';
    return (
        <div>
            <Headerbar
                workspaces={props.workspaces.workspaces}
                selectedWorkspace={props.workspaces.selectedWorkspace}
                pages={props.pages.pages}
                selectedFolder={props.pages.selectedFolder}
                selectedController={props.controllers.selectedController}
                controllerQueryTitle={props.controllers.controllerQueryTitle}
                selectedPage={props.pages.selectedPage}
                onFolderSelect={props.onFolderSelect}
                editPage={props.app.editPage}
                getUrlQuery={props.getUrlQuery}
                managePage={props.app.managePage}
                resetPortlets={props.resetPortlets}
                toggleController={props.toggleController}
                togglePortletbar={props.togglePortletbar}
                onPortletLayoutSave={props.onPortletLayoutSave}
                toggleLeftbar={props.toggleLeftbar}
                loading={props.app.loading}
                largeScreen={largeScreen}
                mediumScreen={mediumScreen}
                instance={props.user.instance}
                username={props.user.name}
                oidc_used={props.user.oidc_used}
                workspaceAdmin={props.workspaces.workspaceAdmin}
                copyUrltoClipboard={props.copyUrltoClipboard}
                changeURL={props.changeURL}
                openSnackbar={props.openSnackbar}
                toggleInfoDialog={props.toggleInfoDialog}
                pageRef={props.pageRef}
            />
            <Leftbar
                open={props.app.leftbarShown}
                toggleLeftbar={props.toggleLeftbar}
                subheader={getWorkspaceDescription()}
                selectedWorkspace={props.workspaces.selectedWorkspace}
                menuData={props.pages.pages}
                selectedPage={props.pages.selectedPage}
            />
            <Portletbar
                open={props.app.portletbarShown}
                togglePortletbar={props.togglePortletbar}
                portlets={props.controllers.controllerPortlets}
                addNewPortlet={props.addNewPortlet}
                workspaces={props.workspaces.workspaces}
            />
            {props.app.infoDialogShown &&
                <InfoModal
                    open={props.app.infoDialogShown}
                    close={props.toggleInfoDialog}
                    apiInfo={props.app.apiInfo}
                />
            }
        </div>
    );
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Header);
