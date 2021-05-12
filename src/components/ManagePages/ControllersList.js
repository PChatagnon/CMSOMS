import React, { PureComponent } from 'react';
import { withStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Collapse from '@material-ui/core/Collapse';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import Checkbox from '@material-ui/core/Checkbox';
import InfoIcon from '@material-ui/icons/Info';
import DashboardIcon from '@material-ui/icons/Dashboard';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import Divider from '@material-ui/core/Divider';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
    root: {
        overflowY: 'auto',
        height: 360,
        border: '1px solid rgba(0, 0, 0, 0.08)',
        marginTop: 8
    },
    nested: {
        paddingLeft: theme.spacing(4)
    },
    title: {
        padding: 8
    },
    iconButton: {
        width: 24,
        height: 24,
        padding: 3
    },
    icon: {
        top: 0,
        bottom: 0,
        width: 18,
        height: 18
    },
    listItemIcon: {
        paddingRight: 0,
        padding: 2,
        minWidth: 34
    },
    checkbox: {
        width: 24,
        height: 24,
        padding: 0,
        paddingRight: 12,
        '&&:hover': {
            backgroundColor: 'transparent',
        },
    }
});

const EMPTY_CONTROLLER = [{
    id: 0,
    title: 'Empty Controller',
    description: 'Completely Empty Controller',
    selectors: [],
}];

class ControllersList extends PureComponent {

    state = {
        checked: [],
    }

    handleClick = (itemId, itemState) => () => {
        this.setState({ [itemId]: !itemState });
    }

    renderControllers = (controllers, nested = true, checkbox = true) => {
        const { selectedId, checkController, classes } = this.props;
        return controllers.map(controller => {
            let selectors = controller.selectors.length ?
                "Selectors:" + controller.selectors.map(s => ' ' + s.title).toString().substring(0, 150) :
                "This controller doesn't contain any selectors."
            selectors += selectors.length === 160 ? '...' : '';
            return (
                <ListItem
                    button
                    dense
                    key={controller.id}
                    className={nested ? classes.nested : null}
                    onClick={() => checkController(controller.id)}
                >
                    {checkbox &&
                        <Checkbox
                            className={classes.checkbox}
                            checked={controller.id === selectedId}
                            onChange={() => checkController(controller.id)}
                            color='primary'
                            tabIndex={-1}
                            disableRipple
                        />
                    }
                    <ListItemText
                        primary={controller.title}
                        secondary={selectors}
                    />
                    <Tooltip title={`${controller.description} `}>
                        <IconButton className={classes.iconButton} disableRipple>
                            <InfoIcon className={classes.icon} />
                        </IconButton>
                    </Tooltip>
                </ListItem>
            );
        });
    }

    renderAllControllers = () => {
        const { workspaces, controllers, classes } = this.props;
        return workspaces.map(workspace => {
            const filteredControllers = controllers.filter(c => c.workspace_id === workspace.id);
            if (!filteredControllers.length) return null;
            const open = this.state[workspace.id];
            return (
                <div key={workspace.id}>
                    <ListItem button dense onClick={this.handleClick(workspace.id, open)} >
                        <ListItemIcon className={classes.listItemIcon}>
                            <DashboardIcon />
                        </ListItemIcon>
                        <ListItemText primary={workspace.title} />
                        {open ? <ExpandLess /> : <ExpandMore />}
                    </ListItem>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding dense>
                            {this.renderControllers(filteredControllers)}
                        </List>
                    </Collapse>
                </div>
            );
        });
    }

    renderList = () => {
        const { selectedId, newPage } = this.props;
        if (newPage) return (
            <div>
                {this.renderControllers(EMPTY_CONTROLLER, false)}
                {this.renderAllControllers()}
            </div>
        );

        const controller = this.props.controllers.find(c => c.id === selectedId);
        if (controller) return this.renderControllers([controller], false, false);

        return this.renderControllers(EMPTY_CONTROLLER, false, false)
    }

    render() {
        const { classes, title } = this.props;
        return (
            <div className={classes.root}>
                <Typography variant="body2" className={classes.title}>
                    {title}
                </Typography>
                <Divider light />
                <List>{this.renderList()}</List>
            </div>
        );
    }
}

export default withStyles(styles)(ControllersList);