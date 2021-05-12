import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';
import Tooltip from '@material-ui/core/Tooltip';
import MenuItem from '@material-ui/core/MenuItem';
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import InputAdornment from '@material-ui/core/InputAdornment';
import DashboardIcon from '@material-ui/icons/Dashboard';
import FileFolderOpen from '@material-ui/icons/FolderOpen';
import WebIcon from '@material-ui/icons/Web';
import Select from '@material-ui/core/Select';
import CreateIcon from '@material-ui/icons/Create';
import SettingsIcon from '@material-ui/icons/Settings';
import CircularProgress from '@material-ui/core/CircularProgress';
import Button from '@material-ui/core/Button';

const styles = {
    selectField: {
        color: "white"
    },
    selectFieldIcon: {
        fill: 'white'
    },
    pointerCursor: {
        cursor: "pointer",
    },
    defaultCursor: {
        cursor: "default",
    },
    buttonRoot: {
        fontSize: 14,
        padding: '0px 0px 2px',
        textTransform: 'none',
        '&$buttonDisabled': {
            color: 'white'
        }
    },
    buttonDisabled: {}
}

class HeaderMenu extends Component {

    state = {
        workspaceTooltip: false,
        folderTooltip: false,
        pageTooltip: false,
        editPageTooltip: false,
        managePageTooltip: false,
        controllerTooltip: false
    }

    handleTooltip = (name, state) => {
        this.setState({ [name]: state });
    }

    renderWorkspaces = () => {
        const { workspaces } = this.props;
        if (!workspaces) return;
        return workspaces.map(workspace => {
            return (
                <MenuItem
                    key={workspace.id}
                    value={workspace.id}
                    component={Link}
                    to={`/${workspace.path}`}
                >
                    {workspace.title}
                </MenuItem>
            );
        });
    }

    renderWorkspacesDropdown = () => {
        const { classes, selectedWorkspace } = this.props;
        return (
            <Tooltip title='Workspace' open={this.state.workspaceTooltip}>
                <Select
                    data-tut='tutorial_workspaces'
                    className={classes.selectField}
                    style={{ paddingLeft: 15 }}
                    classes={{ icon: classes.selectFieldIcon }}
                    onMouseEnter={() => this.handleTooltip('workspaceTooltip', true)}
                    onMouseLeave={() => this.handleTooltip('workspaceTooltip', false)}
                    onMouseDown={() => this.handleTooltip('workspaceTooltip', false)}
                    disableUnderline
                    value={selectedWorkspace ? selectedWorkspace.id : ''}
                    startAdornment={
                        <InputAdornment position="start">
                            <DashboardIcon className={classes.defaultCursor} />
                        </InputAdornment>
                    }
                >
                    {this.renderWorkspaces()}
                </Select>
            </Tooltip>
        );
    }

    renderFolders = () => {
        return this.props.pages.map(folder => {
            return (
                <MenuItem
                    key={folder.id}
                    value={folder.id}
                >
                    {folder.title}
                </MenuItem>
            );
        });
    }

    renderFoldersDropdown = () => {
        if (!this.props.pages) return;
        if (!this.props.pages.length) return;
        if (!this.props.selectedFolder) return;

        const { classes, selectedFolder } = this.props;
        return (
            <Tooltip title='Folder' open={this.state.folderTooltip}>
                <Select
                    data-tut='tutorial_folders'
                    className={classes.selectField}
                    classes={{ icon: classes.selectFieldIcon }}
                    onMouseEnter={() => this.handleTooltip('folderTooltip', true)}
                    onMouseLeave={() => this.handleTooltip('folderTooltip', false)}
                    onMouseDown={() => this.handleTooltip('folderTooltip', false)}
                    onChange={this.props.onFolderSelect}
                    disableUnderline
                    value={selectedFolder ? selectedFolder.id : ''}
                    startAdornment={
                        <InputAdornment position="start">
                            <FileFolderOpen className={classes.defaultCursor} />
                        </InputAdornment>
                    }
                >
                    {this.renderFolders()}
                </Select>
            </Tooltip>
        );
    }

    getPageUrl = (page) => {
        if (!page) return '/';
        return `/${this.props.selectedWorkspace.path}/${this.props.selectedFolder.path}/${page.path}`;
    }

    renderPages = () => {
        if (!this.props.selectedFolder) return;
        if (!this.props.selectedFolder.pages.length) return;

        return this.props.selectedFolder.pages.map(page => {
            return (
                <MenuItem
                    key={page.id}
                    value={page.id}
                    component={Link}
                    to={this.getPageUrl(page)}
                >
                    {page.title}
                </MenuItem>
            );
        });
    }

    renderPagesDropdown = () => {
        if (!this.props.pages) return;
        if (!this.props.pages.length) return;
        if (!this.props.selectedPage) return;

        const { classes, selectedPage } = this.props;
        return (
            <Tooltip title='Page' open={this.state.pageTooltip}>
                <Select
                    data-tut='tutorial_pages'
                    className={classes.selectField}
                    classes={{ icon: classes.selectFieldIcon }}
                    onMouseEnter={() => this.handleTooltip('pageTooltip', true)}
                    onMouseLeave={() => this.handleTooltip('pageTooltip', false)}
                    onMouseDown={() => this.handleTooltip('pageTooltip', false)}
                    disableUnderline
                    value={selectedPage ? selectedPage.id : ''}
                    startAdornment={
                        <InputAdornment position="start">
                            <WebIcon className={classes.defaultCursor} />
                        </InputAdornment>
                    }
                >
                    {this.renderPages()}
                </Select>
            </Tooltip>
        );
    }

    renderEditPageDropdown = () => {
        if (!this.props.editPage) return;
        const selectedPageUrl = this.getPageUrl(this.props.selectedPage) + this.props.getUrlQuery();
        const { classes } = this.props;
        return (
            <Tooltip title='Edit Page' open={this.state.editPageTooltip}>
                <Select
                    data-tut='tutorial_pages'
                    className={classes.selectField}
                    classes={{ icon: classes.selectFieldIcon }}
                    onMouseEnter={() => this.handleTooltip('editPageTooltip', true)}
                    onMouseLeave={() => this.handleTooltip('editPageTooltip', false)}
                    onMouseDown={() => this.handleTooltip('editPageTooltip', false)}
                    onChange={event => {
                        switch (event.target.value) {
                            case "add": return this.props.togglePortletbar();
                            case "save": return this.props.onPortletLayoutSave();
                            case "reset": return this.props.resetPortlets();
                            default: return;
                        }
                    }}
                    value=""
                    displayEmpty
                    disableUnderline
                    startAdornment={
                        <InputAdornment position="start">
                            <CreateIcon className={classes.defaultCursor} />
                        </InputAdornment>
                    }
                >
                    <MenuItem value={""} disabled>Edit</MenuItem>
                    <MenuItem value={"add"}>
                        Add portlets
                    </MenuItem>
                    <MenuItem value={"save"}>
                        Save
                    </MenuItem>
                    <MenuItem value={"reset"}>
                        Reset
                    </MenuItem>
                    <MenuItem value={"close"} component={Link} to={selectedPageUrl}>
                        Cancel
                    </MenuItem>
                </Select>
            </Tooltip>
        );
    }

    renderManagePageDropdown = () => {
        const { managePage } = this.props;
        if (!managePage) return;

        const workspacePath = this.props.selectedWorkspace ? this.props.selectedWorkspace.path : null;
        const manageURL = `/${workspacePath}/manage/`;

        const { classes } = this.props;
        return (
            <Tooltip title='Manage' open={this.state.managePageTooltip}>
                <Select
                    className={classes.selectField}
                    classes={{ icon: classes.selectFieldIcon }}
                    onMouseEnter={() => this.handleTooltip('managePageTooltip', true)}
                    onMouseLeave={() => this.handleTooltip('managePageTooltip', false)}
                    onMouseDown={() => this.handleTooltip('managePageTooltip', false)}
                    value={managePage}
                    displayEmpty
                    disableUnderline
                    startAdornment={
                        <InputAdornment position="start">
                            <CreateIcon className={classes.defaultCursor} />
                        </InputAdornment>
                    }
                >
                    <MenuItem value={'workspace'} component={Link} to={manageURL + 'workspace'}>
                        Manage Workspace
                    </MenuItem>
                    <MenuItem value={'pages'} component={Link} to={manageURL + 'pages'}>
                        Manage Pages
                    </MenuItem>
                    <MenuItem value={'widgets'} component={Link} to={manageURL + 'widgets'}>
                        Manage Widgets
                    </MenuItem>
                    <MenuItem value={'bookmarks'} component={Link} to={manageURL + 'bookmarks'}>
                        Manage Bookmarks
                    </MenuItem>
                    <MenuItem value={'cancel'} component={Link} to={{ pathname: '/' + workspacePath, state: 'exitManageMode' }}>
                        Cancel
                    </MenuItem>
                </Select>
            </Tooltip>
        );
    }

    renderControllerButton = () => {
        const { selectedController, managePage, loading } = this.props;
        if (loading) return (
            <CircularProgress thickness={5} size={18} style={{ color: "white", marginTop: 5 }} />
        );

        const emptyController = selectedController ? false : true;
        if (emptyController || managePage) return;

        const staticController = selectedController &&
            selectedController.configuration &&
            'static' in selectedController.configuration ?
            selectedController.configuration.static : false;

        const { classes } = this.props;
        return (
            <Tooltip title='Controller' open={this.state.controllerTooltip}>
                <Button
                    data-tut='tutorial_controller'
                    className={classes.selectField}
                    classes={{
                        root : classes.buttonRoot,
                        disabled : classes.buttonDisabled
                    }}
                    onMouseEnter={() => this.handleTooltip('controllerTooltip', true)}
                    onMouseLeave={() => this.handleTooltip('controllerTooltip', false)}
                    onClick={() => {
                        this.handleTooltip('controllerTooltip', false);
                        return staticController ? null : this.props.toggleController();
                    }}
                    startIcon={<SettingsIcon className={classes.defaultCursor} />}
                    disabled={staticController === true}
                >
                    {this.props.controllerQueryTitle}
                </Button>
            </Tooltip>
        );
    }

    render() {
        const { largeScreen } = this.props;
        return (
            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" style={{ color: 'white', margin: 0 }} />} arial-label="Breadcrumb">
                {this.renderWorkspacesDropdown()}
                {largeScreen && this.renderFoldersDropdown()}
                {largeScreen && this.renderPagesDropdown()}
                {largeScreen && this.renderEditPageDropdown()}
                {largeScreen && this.renderManagePageDropdown()}
                {this.renderControllerButton()}
            </Breadcrumbs>
        );
    }
}
export default withStyles(styles)(HeaderMenu);
