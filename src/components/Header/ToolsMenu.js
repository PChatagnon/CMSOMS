import React, { PureComponent } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';
import Tooltip from '@material-ui/core/Tooltip';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import Paper from '@material-ui/core/Paper';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import PrintIcon from '@material-ui/icons/Print';
import CreateIcon from '@material-ui/icons/Create';
import RefreshIcon from '@material-ui/icons/Refresh';
//import HelpIcon from '@material-ui/icons/Help';
import InfoIcon from '@material-ui/icons/Info';
import PermIdentityIcon from '@material-ui/icons/PermIdentity';
import PersonIcon from '@material-ui/icons/Person';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import BugReportIcon from '@material-ui/icons/BugReport';
import blue from '@material-ui/core/colors/blue';
import ReactToPrint from "react-to-print";
import moment from 'moment';
import { LinkWrapper } from '../generic/ExtLink.js';

import BookmarkMenu from './BookmarkMenu';

const styles = {
    container: {
        marginLeft: 'auto'
    },
    menuItem: {
        fontSize: 16,
        minHeight: 24,
    },
    menuButton: {
        color: 'white',
        marginLeft: 4,
        marginRight: 4,
    },
    time: {
        padding: 5,
        backgroundColor: blue[600],
        color: 'white',
        display: 'inline-block',
        maxWidth: 150,
        minWidth: 135,
        fontSize: 14,
        verticalAlign: 'middle'
    },
    timeIcon: {
        float: 'left',
        padding: 5,
        color: 'white',
        display: 'inline-block'
    },
};

class ToolsMenu extends PureComponent {

    constructor() {
        super();
        this.state = {
            anchorEl: null,
            time: {
                utc: "loading",
                local: "loading"
            }
        }
    }

    componentDidMount() {
        const intervalId = setInterval(() => {
            let format = (moment().unix() % 2 === 0) ? "HH:mm" : "HH mm";
            this.setState({
                time: {
                    utc: moment().utc().format(format) + ' UTC',
                    local: moment().utc().local().format(format) + ' Local'
                }
            });
        }, 1000);
        this.setState({ intervalId: intervalId });
    }

    componentWillUnmount() {
        clearInterval(this.state.intervalId);
    }

    handleOpen = event => {
        this.setState({ anchorEl: event.currentTarget });
    }

    handleClose = () => {
        this.setState({ anchorEl: null });
    }

    getManageWorkspaceUrl = () => {
        if (!this.props.selectedWorkspace) return '';
        return `/${this.props.selectedWorkspace.path}/manage/workspace`;
    }

    getEditPageUrl = () => {
        const { selectedWorkspace, selectedFolder, selectedPage } = this.props;
        if (!selectedWorkspace || !selectedFolder || !selectedPage) return '/';
        return `/${selectedWorkspace.path}/${selectedFolder.path}/${selectedPage.path}/edit${this.props.getUrlQuery()}`;
    }

    redirectEditMode = () => {
        const { largeScreen } = this.props;
        if (!largeScreen) {
            return this.props.openSnackbar('Edit Mode can not be accessible in a mobile view or low resolution devices.');
        }
        return this.props.changeURL(this.getEditPageUrl());
    }

    renderMenuItems = () => {
        if (this.props.managePage) return null;
        const { classes, workspaceAdmin } = this.props;
        const items = workspaceAdmin ?
            [
                <MenuItem key={1} className={classes.menuItem} onClick={this.redirectEditMode}>
                    <ListItemIcon><CreateIcon /></ListItemIcon>
                    <ListItemText primary="Edit Page" />
                </MenuItem>,
                <MenuItem key={2} className={classes.menuItem} component={Link} to={this.getManageWorkspaceUrl()}>
                    <ListItemIcon><CreateIcon /></ListItemIcon>
                    <ListItemText primary="Manage Workspace" />
                </MenuItem>
            ] : [];

        return [
            ...items,
            <MenuItem key={3} className={classes.menuItem} onClick={this.props.copyUrltoClipboard}>
                <ListItemIcon><FileCopyIcon /></ListItemIcon>
                <ListItemText primary="Copy Page URL" />
            </MenuItem>,
            <MenuItem key={4} className={classes.menuItem} onClick={() => window.location.reload()}>
                <ListItemIcon><RefreshIcon /></ListItemIcon>
                <ListItemText primary="Refresh" />
            </MenuItem>
        ];
    }

    renderTimePanel = () => {
        const { classes } = this.props;
        return (
            <Paper className={classes.time} elevation={1}>
                <AccessTimeIcon className={classes.timeIcon} />
                <div>
                    {this.state.time.utc}<br />
                    {this.state.time.local}
                </div>
            </Paper>
        );
    }

    oidc_logout = () => {
        const prefix = window.location.protocol + "//" + window.location.hostname;
        const prefixenc = (window.location.protocol === 'https:'? 'https%3A%2F%2F' : 'http%3A%2F%2F') + window.location.hostname;
        const have_port = !([0,80,443].includes(window.location.port));
        const port = have_port ? ':' + window.location.port : '';
        const portenc = have_port ? '%3A' + window.location.port : '';
        return prefix + port + '/redirect_uri?logout=' + prefixenc + portenc +  '%2Flogout.html';
    }

    render() {
        const { classes, largeScreen, username, oidc_used, selectedWorkspace, selectedFolder, selectedPage, getUrlQuery } = this.props;
        const { anchorEl } = this.state;
        const open = Boolean(anchorEl);

        return (
            <div className={classes.container} >

                <BookmarkMenu // or make it subfolder of tools menu? see:
                    selectedWorkspace={selectedWorkspace}
                    selectedFolder={selectedFolder}
                    selectedPage={selectedPage}
                    getUrlQuery={getUrlQuery}
                >
                </BookmarkMenu>
 
                {largeScreen && this.renderTimePanel()}

                <Tooltip title='Menu'>
                    <IconButton
                        id="toolsMenuButton"
                        className={classes.menuButton}
                        aria-label="More"
                        aria-owns={open ? 'tools-menu' : null}
                        aria-haspopup="true"
                        onClick={this.handleOpen}
                        focusRipple={false}
                    >
                        <MoreVertIcon style={{ color: 'white' }} data-tut='tutorial_toolsmenu' />
                    </IconButton>
                </Tooltip>

                <Menu
                    id="tools-menu"
                    anchorEl={anchorEl}
                    open={open}
                    onClick={this.handleClose}
                    onClose={this.handleClose}
                >
                    <MenuItem className={classes.menuItem}>
                        <ListItemIcon><PersonIcon /></ListItemIcon>
                        <ListItemText primary={username} />
                    </MenuItem>
                    <Divider />
                    {this.renderMenuItems()}
                    <MenuItem className={classes.menuItem}
                        target='_blank' component={LinkWrapper}
                        to={'https://its.cern.ch/jira/projects/CMSOMS/issues'}
                    >
                        <ListItemIcon><BugReportIcon /></ListItemIcon>
                        <ListItemText primary="Report An Issue" />
                    </MenuItem>

                    <ReactToPrint
                        trigger={() => (
                            <MenuItem className={classes.menuItem}>
                                <ListItemIcon><PrintIcon /></ListItemIcon>
                                <ListItemText primary="Print" />
                            </MenuItem>
                        )}
                        content={() => this.props.pageRef}
                    />

                    {/*
                    <MenuItemclassName={classes.menuItem}
                        target='_blank' component={Link}
                        to='https://twiki.cern.ch/twiki/bin/viewauth/CMS/OMSPortalHelp'
                    >
                        <ListItemIcon><HelpIcon /></ListItemIcon>
                        <ListItemText primary="Help" />
                    </MenuItem>
                    */}
                    <MenuItem className={classes.menuItem} onClick={this.props.toggleInfoDialog}>
                        <ListItemIcon><InfoIcon /></ListItemIcon>
                        <ListItemText primary="About" />
                    </MenuItem>
                    {!oidc_used && username !== 'Stranger' &&
                        <MenuItem className={classes.menuItem}
                            target="_self" component={LinkWrapper}
                            to={'https://login.cern.ch/adfs/ls/?wa=wsignout1.0'}
                        >
                            <ListItemIcon><PermIdentityIcon /></ListItemIcon>
                            <ListItemText primary="Sign Out" />
                        </MenuItem>
                    }
                    {oidc_used && username !== 'Stranger' &&
                        <MenuItem className={classes.menuItem}
                            target="_self" component={LinkWrapper}
                            to={this.oidc_logout()}
                        >
                            <ListItemIcon><PermIdentityIcon /></ListItemIcon>
                            <ListItemText primary="Sign Out" />
                        </MenuItem>
                    }
                </Menu>
            </div>
        );
    }
}
export default withStyles(styles)(ToolsMenu);
