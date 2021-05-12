import React, { Component } from 'react';

import MoreVertIcon from '@material-ui/icons/MoreVert';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import PrintIcon from '@material-ui/icons/Print';
import RefreshIcon from '@material-ui/icons/Refresh';
import CloseIcon from '@material-ui/icons/Close';

import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Slide from '@material-ui/core/Slide';
import ReactToPrint from "react-to-print";
import { generateId } from '../../utils/utils';

const styles = {
    appBar: {
        position: 'relative',
    },
    menuItem: {
        fontSize: 16,
        minHeight: 24,
    },
    closeButton: {
        marginRight: 10,
    },
    flex: {
        flex: 1,
    }
};

const Transition = React.forwardRef((props, ref) => <Slide direction="up" {...props} ref={ref} />);

class FullscreenModal extends Component {

    state = {
        anchorEl: null,
        key: generateId('portlet')
    }

    handleMenuOpen = event => {
        this.setState({ anchorEl: event.currentTarget });
    }

    handleMenuClose = () => {
        this.setState({ anchorEl: null });
    }

    refreshPage = () => this.setState({ key: generateId('portlet') });

    render() {
        if (!this.props.open || !this.props.portlet) return <div />;

        const { portlet, controllerTitle, classes } = this.props;
        const menuOpen = Boolean(this.state.anchorEl);
        let title = portlet.portlet.title;
        title += controllerTitle ? ` (${controllerTitle})` : '';

        return (
            <Dialog
                fullScreen
                open={true}
                onClose={this.props.close}
                TransitionComponent={Transition}
            >
                <AppBar className={classes.appBar} id='fullScreenHeader'>
                    <Toolbar>
                        <IconButton className={classes.closeButton} onClick={this.props.close} color="inherit" aria-label="Close">
                            <CloseIcon />
                        </IconButton>

                        <Typography className={classes.flex} variant="h6" color="inherit">
                            {title}
                        </Typography>

                        <div>
                            <IconButton
                                aria-owns={menuOpen ? 'menu-appbar' : null}
                                aria-haspopup="true"
                                onClick={this.handleMenuOpen}
                                focusRipple={false}
                                color="inherit"
                            >
                                <MoreVertIcon />
                            </IconButton>
                            <Menu
                                id="menu-appbar"
                                anchorEl={this.state.anchorEl}
                                open={menuOpen}
                                onClick={this.handleMenuClose}
                                onClose={this.handleMenuClose}
                            >
                                <MenuItem className={classes.menuItem} onClick={this.props.copyUrltoClipboard}>
                                    <ListItemIcon><FileCopyIcon /></ListItemIcon>
                                    <ListItemText primary="Copy Page URL" />
                                </MenuItem>

                                <ReactToPrint
                                    trigger={() => (
                                        <MenuItem className={classes.menuItem}>
                                            <ListItemIcon><PrintIcon /></ListItemIcon>
                                            <ListItemText primary="Print" />
                                        </MenuItem>
                                    )}
                                    content={() => this.pageRef}
                                />

                                <MenuItem className={classes.menuItem} onClick={this.refreshPage}>
                                    <ListItemIcon><RefreshIcon /></ListItemIcon>
                                    <ListItemText primary="Refresh" />
                                </MenuItem>

                                <MenuItem className={classes.menuItem} onClick={this.props.close}>
                                    <ListItemIcon><CloseIcon /></ListItemIcon>
                                    <ListItemText primary="Close" />
                                </MenuItem>
                            </Menu>
                        </div>
                    </Toolbar>
                </AppBar>
                <div style={{ margin: 5 }} ref={el => (this.pageRef = el)}>
                    {this.props.renderPortlet(portlet, { fullScreen: true, portletKey: this.state.key })}
                </div>
            </Dialog>
        )
    }
}

export default withStyles(styles)(FullscreenModal);