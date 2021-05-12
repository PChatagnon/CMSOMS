import React, { PureComponent } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Close from '@material-ui/icons/Close';
import Dashboard from '@material-ui/icons/Dashboard';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Collapse from '@material-ui/core/Collapse';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import AddIcon from '@material-ui/icons/Add';
import Fab from '@material-ui/core/Fab';
import Spinner from '../generic/Spinner';

const styles = {
    content: {
        width: 350,
    },
    icon: {
        color: "white",
    },
    title: {
        marginLeft: 10,
    },
    tab: {
        minWidth: 30
    },
    list: {
        width: 350,
        overflowY: 'auto',
        height: '84vh',
    },
    loader: {
        position: 'absolute',
        top: '30%',
        left: '50%'
    }
};

class Portletbar extends PureComponent {

    state = {
        value: 0,
    }

    renderIcon = portlet => {
        return (
            <Fab color="primary"
                aria-label="Add" size="small"
                onClick={() => this.props.addNewPortlet(portlet)}
            >
                <AddIcon />
            </Fab>
        );
    }

    renderPortlets = portlets => {
        return portlets.map(portlet => {
            return (
                <ListItem button dense key={portlet.id}>
                    <ListItemText primary={portlet.title} secondary={portlet.description} />
                    <ListItemSecondaryAction>{this.renderIcon(portlet)}</ListItemSecondaryAction>
                </ListItem>
            );
        });
    }

    handleClick = (itemId, itemState) => () => {
        this.setState({ [itemId]: !itemState });
    }

    filterPortlets = (componentType, workspaceId) => {
        return this.props.portlets.filter(portlet =>
            portlet.portlet_component.type === componentType &&
            portlet.workspace_id === workspaceId
        );
    }

    filterWorkspacePortlets = (componentType, id) => {
        const portlets = componentType === 'table' ?
            [...this.filterPortlets('generic_table', id),
            ...this.filterPortlets('table', id)]
            : componentType === 'chart' ?
            [...this.filterPortlets('generic_chart', id),
            ...this.filterPortlets('chart', id)]
            :this.filterPortlets(componentType, id);

        return portlets.sort((a, b) => (a.title > b.title) ? 1 : -1);
    }

    renderWorkspaces = componentType => {
        return this.props.workspaces.map(workspace => {
            const open = this.state[workspace.id];
            const workspacePortlets = this.filterWorkspacePortlets(componentType, workspace.id);
            if (!workspacePortlets.length) return null;

            return (
                <div key={workspace.id}>
                    <ListItem button dense onClick={this.handleClick(workspace.id, open)}>
                        <ListItemIcon><Dashboard /></ListItemIcon>
                        <ListItemText primary={workspace.title} />
                        {open ? <ExpandLess /> : <ExpandMore />}
                    </ListItem>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding dense>
                            {this.renderPortlets(workspacePortlets)}
                        </List>
                    </Collapse>
                </div>
            );
        });
    }

    renderTab = name => {
        if (!this.props.portlets) {
            return <div className={this.props.classes.loader}><Spinner /></div>;
        }
        return (
            <List
                component="nav"
                className={this.props.classes.list}
            >
                {this.renderWorkspaces(name)}
            </List>
        );
    }

    handleTabChange = (event, value) => this.setState({ value });

    render() {
        if (!this.props.open) return <div />;

        const { classes } = this.props;
        const { value } = this.state;

        return (
            <Drawer
                anchor="right"
                open={this.props.open}
                variant="persistent"
            >
                <div className={classes.content}>
                    <AppBar position="static" color="primary">
                        <Toolbar>
                            <IconButton onClick={this.props.togglePortletbar} >
                                <Close className={classes.icon} />
                            </IconButton>
                            <Typography
                                variant="h6"
                                color="inherit"
                                className={classes.title}
                            >
                                Add Portlets
                            </Typography>
                        </Toolbar>

                        <Tabs
                            value={value}
                            onChange={this.handleTabChange}
                            variant="fullWidth"
                            scrollButtons="auto"
                        >
                            <Tab label="Tables" className={classes.tab} />
                            <Tab label="Charts" className={classes.tab} />
                            <Tab label="Text" className={classes.tab} />
                        </Tabs>
                    </AppBar>
                    {value === 0 && this.renderTab('table')}
                    {value === 1 && this.renderTab('chart')}
                    {value === 2 && this.renderTab('text')}
                </div>
            </Drawer>
        );
    }
}

export default withStyles(styles)(Portletbar);
