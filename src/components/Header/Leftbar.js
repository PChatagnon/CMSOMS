import React, { PureComponent } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';
import Drawer from '@material-ui/core/Drawer';
import ListSubheader from '@material-ui/core/ListSubheader';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Collapse from '@material-ui/core/Collapse';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import FolderOpen from '@material-ui/icons/FolderOpen';
import Close from '@material-ui/icons/Close';
import Web from '@material-ui/icons/Web';

const styles = theme => ({
    list: {
        width: 350,
        overflowY: 'auto',
        height: '94vh',
    },
    nested: {
        paddingLeft: theme.spacing(4),
    },
});

class Leftbar extends PureComponent {

    state = {};

    handleClick = (itemId, itemState) => () => {
        this.setState({ [itemId]: !itemState });
    }

    getPageUrl = (folderPath, page) => {
        return `/${this.props.selectedWorkspace.path}/${folderPath}/${page.path}`;
    }

    renderPages = (folderPath, pages) => {
        return pages.map(page => {
            return (
                <ListItem button key={page.id}
                    className={this.props.classes.nested}
                    component={Link}
                    to={this.getPageUrl(folderPath, page)}
                >
                    <ListItemIcon><Web /></ListItemIcon>
                    <ListItemText primary={page.title} />
                </ListItem>
            );
        });
    }

    renderFolders = (folders) => {
        return folders.map(folder => {
            const open = this.state[folder.id];
            return (
                <div key={folder.id}>
                    <ListItem button onClick={this.handleClick(folder.id, open)}>
                        <ListItemIcon><FolderOpen /></ListItemIcon>
                        <ListItemText primary={folder.title} />
                        {open ? <ExpandLess /> : <ExpandMore />}
                    </ListItem>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {this.renderPages(folder.path, folder.pages)}
                        </List>
                    </Collapse>
                </div>
            );
        });
    }

    getSelectedPage = () => {
        const page = this.props.selectedPage;
        if (!page) return null;
        return page.id;
    }

    render() {
        const { open, toggleLeftbar, subheader, menuData, classes } = this.props;
        return (
            <Drawer anchor="left" open={open} onClose={toggleLeftbar} className="leftMenu">
                <ListItem button onClick={toggleLeftbar}>
                    <ListItemIcon><Close /></ListItemIcon>
                    <ListItemText primary="Close" />
                </ListItem>
                <List
                    component="nav"
                    subheader={<ListSubheader component="div">{subheader}</ListSubheader>}
                    className={classes.list}
                >
                    {this.renderFolders(menuData)}
                </List>
            </Drawer>
        );
    }
}
export default withStyles(styles)(Leftbar);
