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

class SelectorsList extends PureComponent {

    state = {
        checked: [],
    }

    handleClick = (itemId, itemState) => () => {
        this.setState({ [itemId]: !itemState });
    }

    renderSelectors = (selectors) => {
        const { portletSelectors, checkSelector, classes } = this.props;
        return selectors.map(selector => {
            const selected = portletSelectors.find(s => s.id === selector.id);
            return (
                <ListItem
                    button
                    dense
                    key={selector.id}
                    className={classes.nested}
                    onClick={() => checkSelector(selector, selected)}
                >
                    <Checkbox
                        className={classes.checkbox}
                        checked={selected ? true : false}
                        onChange={() => checkSelector(selector, selected)}
                        color='primary'
                        tabIndex={-1}
                        disableRipple
                    />
                    <ListItemText primary={selector.title} />
                    <Tooltip title={`${selector.name} (${selector.data_type}) `}>
                        <IconButton className={classes.iconButton} disableRipple>
                            <InfoIcon className={classes.icon} />
                        </IconButton>
                    </Tooltip>
                </ListItem>
            );
        });
    }

    renderSelectorsList = () => {
        const { workspaces, selectors } = this.props;
        return workspaces.map(workspace => {
            const filteredSelectors = selectors
                .filter(s => s.workspace_id === workspace.id)
                .sort((a, b) => (a.title > b.title) ? 1 : -1);
            if (!filteredSelectors.length) return null;
            const open = this.state[workspace.id];
            return (
                <div key={workspace.id}>
                    <ListItem button dense onClick={this.handleClick(workspace.id, open)} >
                        <ListItemIcon><DashboardIcon /></ListItemIcon>
                        <ListItemText primary={workspace.title} />
                        {open ? <ExpandLess /> : <ExpandMore />}
                    </ListItem>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding dense>
                            {this.renderSelectors(filteredSelectors)}
                        </List>
                    </Collapse>
                </div>
            );
        });
    }

    render() {
        const { classes, title } = this.props;
        return (
            <div className={classes.root}>
                <Typography variant="body2" className={classes.title}>
                    {title}
                </Typography>
                <Divider light />
                <List>{this.renderSelectorsList()}</List>
            </div>
        );
    }
}

export default withStyles(styles)(SelectorsList);