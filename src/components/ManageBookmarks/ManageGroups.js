import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import ManageGroupsForm from './ManageGroupsForm';

const styles = {
    card: {
        margin: 0,
        marginBottom: 5,
        overflowX: 'hidden'
    },
    title: {
        fontSize: 16
    },
    header: {
        padding: 14,
        paddingRight: 28
    },
    content: {
        overflowY: 'auto',
        height: '663px',
        padding: 0
    },
    actions: {
        paddingBottom: 6,
        paddingLeft: 14,
    }
}

class ManageGroups extends Component {

    state = {
    }

    componentDidMount() {
        this.props.fetchBookmarkGroups();
    }

    componentDidUpdate(prevProps) {

        // Fetch portlets if workspaces are already loaded,
        // portlets are not yet fetched and not fetching at the moment

//        if (!this.props.fetchingGroups && !this.props.bookmarks.groups.length) {
//            this.props.fetchBookmarkGroups();
//        }
    }

    handleClick = (itemId, itemState) => () => {
        this.setState({ [itemId]: !itemState });
    }

    onNewGroup = () => {
        const group = {
            id: 'new',
            name: '',
            title: '',
            description: '',
            users:[],
            rules:[]
        }
        this.props.selectBookmarkGroup(group);
    }

    selectGroup = (name) => {
        this.props.fetchBookmarkGroup(name);
    }

    renderGroups = () => {
        let inset = false;
        const { bookmarks } = this.props;

        const groups = bookmarks.groups
            .sort((a, b) => (a.name > b.name) ? 1 : -1);

        if (!groups.length) return;

        const selectedGroup = this.props.bookmarks.selectedGroup ? this.props.bookmarks.selectedGroup.name : null;
        return groups.map(g =>
            <ListItem
                button
                dense
                key={g.name}
                selected={g.name === selectedGroup}
                onClick={() => this.selectGroup(g.name)}
            >
                <ListItemText style={inset ? { paddingLeft: 24 } : {}} primary={g.title} />
            </ListItem>
        );
    }

    render() {
        //if (!this.props.boomarks || this.props.bookmarks.groups) return <Loader />;
        const { classes } = this.props;
        return (
            <Grid container spacing={0}>
                <Grid item xs={4}>
                    <Card className={classes.card}>

                        <CardHeader
                            title="Manage Bookmark Groups"
                            classes={{
                                title: classes.title,
                                root: classes.header
                            }}
                        />
 
                        <Divider light />
                        <CardContent className={classes.content}>
                            <List component="nav">
                                {this.renderGroups()}
                            </List>
                        </CardContent>
                        <Divider light />
                        <CardActions className={classes.actions}>
                            <Button onClick={this.onNewGroup}>
                                New Group
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
                <Grid item xs={8}>
                    {this.props.bookmarks.selectedGroup &&
                        <ManageGroupsForm cols={2}
                            fetchBookmarkGroup={this.props.fetchBookmarkGroup}
                            createBookmarkGroup={this.props.createBookmarkGroup}
                            updateBookmarkGroup={this.props.updateBookmarkGroup}
                            deleteBookmarkGroup={this.props.deleteBookmarkGroup}
                            createBookmarkUser={this.props.createBookmarkUser}
                            deleteBookmarkUser={this.props.deleteBookmarkUser}
                            createBookmarkRule={this.props.createBookmarkRule}
                            deleteBookmarkRule={this.props.deleteBookmarkRule}
                            fetchingGroups={this.props.fetchingGroups}
                            fetchingGroup={this.props.fetchingGroup}
                            openSnackbar={this.props.openSnackbar}
                            item={this.props.bookmarks.selectedGroup} 
                        />
                    }
                </Grid>
            </Grid>
        );
    }
}

export default withStyles(styles)(ManageGroups);
