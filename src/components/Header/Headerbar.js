import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import HeaderMenu from './HeaderMenu';
import ToolsMenu from './ToolsMenu';

const styles = theme => ({
    appBar: {
        width: '100%',
        whiteSpace: 'nowrap'
    },
    menuButton: {
        color: 'white',
        marginLeft: 8,
        marginRight: 16,
    },
    logo: {
        marginRight: 10,
        marginLeft: -10,
        marginTop: 4,
    },
    titleLink: {
        textDecoration: 'none',
    },
    title: {
        color: 'white',
        fontSize: '1.5rem',
        height: 30
    },
    subtitle: {
        color: 'white',
        fontSize: '0.75rem'
    }
});

const Headerbar = (props) => {

    const { classes, largeScreen, instance, toggleLeftbar } = props;
    return (
        <div className={classes.appBar}>
            <AppBar position="static">
                <Toolbar disableGutters>

                    <IconButton
                        id="menuButton"
                        className={classes.menuButton}
                        color="secondary"
                        aria-label="Menu"
                        onClick={toggleLeftbar}
                    >
                        <MenuIcon style={{ color: 'white' }} data-tut='tutorial_hamburger' />
                    </IconButton>

                    <Link
                        to={{pathname:"/cms/index/index", state: 'resetApp'}}
                    >
                        <img alt='' className={classes.logo} src="/images/cms_logo.png" />
                    </Link>

                    {largeScreen && !props.mediumScreen &&
                        <Link
                            to={{pathname:"/cms/index/index", state: 'resetApp'}}
                            className={classes.titleLink}
                            data-tut='tutorial_oms_title'
                        >
                            <Typography variant="body1" className={classes.title}>
                                CMS OMS
                            </Typography>
                            <Typography className={classes.subtitle}>
                                {instance}
                            </Typography>
                        </Link>
                    }

                    <HeaderMenu
                        workspaces={props.workspaces}
                        selectedWorkspace={props.selectedWorkspace}
                        pages={props.pages}
                        selectedFolder={props.selectedFolder}
                        selectedController={props.selectedController}
                        controllerQueryTitle={props.controllerQueryTitle}
                        selectedPage={props.selectedPage}
                        onFolderSelect={props.onFolderSelect}
                        editPage={props.editPage}
                        getUrlQuery={props.getUrlQuery}
                        managePage={props.managePage}
                        resetPortlets={props.resetPortlets}
                        toggleController={props.toggleController}
                        togglePortletbar={props.togglePortletbar}
                        onPortletLayoutSave={props.onPortletLayoutSave}
                        loading={props.loading}
                        largeScreen={largeScreen}
                    />

                    <ToolsMenu
                        managePage={props.managePage}
                        username={props.username}
                        oidc_used={props.oidc_used}
                        workspaceAdmin={props.workspaceAdmin}
                        selectedWorkspace={props.selectedWorkspace}
                        selectedFolder={props.selectedFolder}
                        selectedPage={props.selectedPage}
                        copyUrltoClipboard={props.copyUrltoClipboard}
                        getUrlQuery={props.getUrlQuery}
                        changeURL={props.changeURL}
                        openSnackbar={props.openSnackbar}
                        largeScreen={largeScreen}
                        toggleInfoDialog={props.toggleInfoDialog}
                        pageRef={props.pageRef}
                    />

                </Toolbar>
            </AppBar>
        </div>
    );
}

export default withStyles(styles)(Headerbar);
