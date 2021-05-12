import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Divider from '@material-ui/core/Divider';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { List, ListItem, ListItemText } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Tooltip from '@material-ui/core/Tooltip';

const styles = {
    selectField: {
        marginTop: 15,
        width: 380
    },
    card: {
        margin: 10,
        overflowX: 'hidden'
    },
    title: {
        fontSize: 16
    },
    header: {
        padding: 14,
        paddingRight: 28
    },
    actions: {
        paddingBottom: 6,
        paddingLeft: 14,
    },
    margin: {
        margin: 6,
    },
    padding: {
        padding: 4,
    },
    textField: {
        marginTop: 10,
        fontSize: 12
    },
    inlineTextField: {
        marginTop: 10,
        marginRight: 10,
        fontSize: 14,
        width: 240
    }
};

class ManageGroupsForm extends Component {

    constructor(props) {
        super(props);
        this.state = this.getInitialState(props);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.item === this.props.item) return;
        this.setState(this.getInitialState(this.props));
    }

    getInitialState = (props = this.props) => {
        return {
            item: {
                id: null,
                name: '',
                title: '',
                description: '',
                users: [],
                rules: [],
                ...props.item
            },
            origTitle: props.item.title,
            origDescription: props.item.description,
            onActionType: '',
            onActionName: '',
            onActionValue: '',
            dialogOpen: false,
            addDialogOpen: false,
            selectedUser:null,
            selectedRule:null
        }
    }

    openDialog = () => this.setState({ dialogOpen: true });

    closeDialog = () => this.setState({ dialogOpen: false });

    openAddDialog = () => this.setState({ addDialogOpen: true });

    closeAddDialog = () => this.setState({ addDialogOpen: false });

    onItemFieldChange = name => event => {
        this.setState({ item: { ...this.state.item, [name]: event.target.value } });
    }

    onFieldChange = name => event => {
        this.setState({ [name]:event.target.value });
    }

    onCreateGroup = () => {
        let item = { ...this.state.item };

        // Validate input fields
        if (item.name === '' || item.descriptin === '') {
            return this.props.openSnackbar('Please fill in all fields.')
        }

        if ( !item.id || item.id !== 'new') {
            if (this.state.origTitle !== item.title ||
                this.state.origDescription !== item.description)
                return this.props.updateBookmarkGroup(item.name, item);
        }

        return this.props.createBookmarkGroup(item.name, item);
    }

    openDialogAdd = (actionType) => {
        this.setState({
            onActionType: actionType,
            onActionValue: '',
            addDialogOpen: true
        })
    }

    onAddAction = () => {

        if (this.state.onActionValue === '') {
            return this.props.openSnackbar('Please fill in name.')
        }
        if (this.state.item.name === '') {
            return this.props.openSnackbar('Group name not set.')
        }

        if (this.state.onActionType === 'user') 
            this.props.createBookmarkUser(this.state.onActionValue, this.state.item.name);
        else if (this.state.onActionType === 'rule') 
            this.props.createBookmarkRule(this.state.onActionValue, this.state.item.name);
        this.closeAddDialog();
    }

    openDialogDelete = (actionType, name) => {
        this.setState({
            onActionType: actionType,
            onActionName: name,
            dialogOpen: true
        })
    }

    onDeleteAction = () => {

        if (this.state.onActionName === '') {
            return this.props.openSnackbar('Please fill in name/value.')
        }
        if (this.state.onActionType !== 'group' && this.state.item.name === '') {
            return this.props.openSnackbar('Group name not set.')
        }

        if (this.state.onActionType === 'group')
            this.props.deleteBookmarkGroup(this.state.onActionName);
        else if (this.state.onActionType === 'user')
            this.props.deleteBookmarkUser(this.state.onActionName, this.state.item.name);
        else if (this.state.onActionType === 'rule')
            this.props.deleteBookmarkRule(this.state.onActionName, this.state.item.name);
        this.closeDialog();
    }


    onDeleteGroup = () => {
        this.props.deleteBookmarkGroup(this.state.item.name);
        this.closeDialog();
    }

    renderUsers = () => {
        return this.state.item.users.map(u =>
            <ListItem
                button
                dense
                key={u}
                selected={u === this.state.selectedUser}
                onClick={() => { this.setState({selectedUser: u})}}
            >
                <ListItemText primary={u} />
            </ListItem>
        );
    }

    renderRules = () => {
        return this.state.item.rules.map(r =>
            <ListItem
                button
                dense
                key={r}
                selected={r === this.state.selectedRule}
                onClick={() => { this.setState({selectedRule: r})}}
            >
                <ListItemText primary={r} />
            </ListItem>
        );
    }


    render() {
        const { item } = this.state;
        const { classes } = this.props;
        return (
            <Card className={classes.card}>
                <CardHeader
                    title={item.id && item.id === 'new' ? 'Add New Group' : 'Manage Group'}
                    classes={{
                        title: classes.title,
                        root: classes.header
                    }}
                />
                <Divider light />
                <CardContent>
                    <TextField
                        label="Name"
                        className={classes.textField}
                        value={item.name}
                        onChange={this.onItemFieldChange('name')}
                        margin="normal"
                        style={{ marginTop: 0 }}
                        fullWidth
                        disabled={!item.id || item.id !== 'new'}
                    />
                    <br />
                    <TextField
                        label="Title"
                        className={classes.textField}
                        value={item.title}
                        onChange={this.onItemFieldChange('title')}
                        margin="normal"
                        fullWidth
                    />
                    <br />
                    <TextField
                        label="Description"
                        className={classes.textField}
                        value={item.description}
                        onChange={this.onItemFieldChange('description')}
                        margin="normal"
                        fullWidth
                    />
                    <br />
                    { (!item.id || item.id !== 'new') &&

                        <React.Fragment>
                        <div style={{ width: '45%', display: 'inline-block' }}>

                            <Tooltip title="SSO usernames allowed to modify bookmarks withing page matching rules">
                                <CardHeader
                                    title="Users"
                                    classes={{
                                        title: classes.title,
                                        root: classes.header
                                    }}
                                />
                            </Tooltip>
 
                        </div>
                        <div style={{ width: '45%', display: 'inline-block', marginLeft: 15 }}>

                            <Tooltip title="URL path matching rules: /$workspace/$folder/$path, /$workspace/$folder/* or /$workspace/*">
                                <CardHeader
                                    title="Rules"
                                    classes={{
                                        title: classes.title,
                                        root: classes.header
                                    }}
                                />
                            </Tooltip>
                        </div>
 

                        <div style={{ width: '45%', display: 'inline-block' }}>

                            <List component="nav">
                                {this.renderUsers()}
                            </List>
 
                            <CardActions className={classes.actions}>
                                <div>
                                    <Button onClick={() => this.openDialogAdd('user')} >
                                        Add
                                    </Button>
                                    <Button
                                        onClick={() => this.openDialogDelete('user',this.state.selectedUser)} disabled={!this.state.selectedUser}
                                    >
                                        Delete
                                    </Button>
                               </div>
                           </CardActions>
 
                        </div>
                        <div style={{ width: '45%', display: 'inline-block', marginLeft: 15 }}>

                            <List component="nav">
                                {this.renderRules()}
                            </List>
 
                            <CardActions className={classes.actions}>
                                <div>
                                    <Button onClick={() => this.openDialogAdd('rule')}  >
                                        Add
                                    </Button>
                                    <Button
                                        onClick={() => this.openDialogDelete('rule',this.state.selectedRule)} disabled={!this.state.selectedRule}
                                    >
                                        Delete
                                    </Button>
                               </div>
                           </CardActions>
                        </div>
                        </React.Fragment>
                    }
                    <br />
                </CardContent>
                <Divider light />
                <CardActions className={classes.actions}>
                    <div>
                        <Button onClick={this.onCreateGroup}
                            disabled = { item.title === this.state.origTitle && item.description === this.state.origDescription }
                        >
                            Save
                        </Button>
                        <Button
                            onClick={() => this.openDialogDelete('group', item.name)}
                            disabled={item.id && item.id === 'new'}
                        >
                            Delete
                        </Button>
                    </div>
                </CardActions>
                {this.state.dialogOpen &&
                    <Dialog
                        open={this.state.dialogOpen}
                        onClose={this.closeDialog}
                    >
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                Are you sure you want to remove {this.state.onActionType} {this.state.onActionName}?
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={this.closeDialog} color="primary" autoFocus>
                                Cancel
                            </Button>
                            <Button onClick={this.onDeleteAction} color="primary">
                                Submit
                            </Button>
                        </DialogActions>
                    </Dialog>
                }

                {this.state.addDialogOpen &&
                    <Dialog
                        open={this.state.addDialogOpen}
                        onClose={this.closeAddDialog}
                        fullWidth
                    >
                        <DialogTitle>Add {this.state.onActionType}</DialogTitle>

                        <div style={{ display: 'inline-block', marginLeft: 24 }}>
                        <TextField
                            label={"New "+ this.state.onActionType}
                            className={classes.inlineTextField}
                            value={this.state.onActionValue}
                            onChange={this.onFieldChange('onActionValue')}
                            margin="normal"
                            fullWidth
                        />
                        </div>
 
                        <DialogActions>
                            <Button onClick={this.closeAddDialog} color="primary" autoFocus>
                                Cancel
                            </Button>
                            <Button onClick={this.onAddAction} color="primary">
                                Submit
                            </Button>
                        </DialogActions>
                    </Dialog>
                }
 
            </Card>
        );
    }
}

export default withStyles(styles)(ManageGroupsForm);
