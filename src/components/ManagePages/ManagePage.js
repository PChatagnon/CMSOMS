import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import CardMui from '@material-ui/core/Card';
import CardHeaderMui from '@material-ui/core/CardHeader';
import CardContentMui from '@material-ui/core/CardContent';
import CardActionsMui from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import ControllersList from './ControllersList';

import { pageNameFromTitle } from '../../utils/utils';

const styles = {
    card: {
        margin: 10,
        marginLeft: 0,
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
    textField: {
        marginTop: 10,
        fontSize: 14
    }
};

class ManagePage extends Component {

    constructor(props) {
        super(props);
        this.state = {
            item: { ...props.item },
            dialogOpen: false
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.item === this.props.item) return;
        this.setState({ item: { ...this.props.item } });
    }

    openDialog = () => this.setState({ dialogOpen: true });

    closeDialog = () => this.setState({ dialogOpen: false });

    onFieldChange = name => event => {
        this.setState({ item: { ...this.state.item, [name]: event.target.value } });
    }

    onReset = () => this.setState({ item: { ...this.props.item } });

    onSave = () => {
        let { item } = this.state;
        item.controller_id = item.controller_id === 0 ? null : item.controller_id;

        if (item.title === '' || item.description === '') {
            return this.props.openSnackbar('Please fill in all fields.')
        }

        if ('newPage' in item) {
            delete item.newPage;
            return this.props.addNewPage(item);
        }
        this.props.updatePage(item.id, item);
    }

    onDelete = () => {
        this.closeDialog();
        const { item } = this.state;
        if ('newPage' in item) {
            return this.props.deleteLocalPage(item.id);
        }
        this.props.deletePage(item);
    }

    getPageUrl = () => {
        if (!this.state.item) return '/';
        const folder = this.props.findItem(this.state.item.folder_id);
        let path = this.state.item.path;
        if (path===undefined) {
            path = pageNameFromTitle(this.state.item.title);
        }
        return `/${this.props.selectedWorkspace.path}/${folder.path}/${path}`;
    }

    render() {
        const { classes } = this.props;
        const { item } = this.state;
        const path = this.getPageUrl();

        return (
            <CardMui className={classes.card}>
                <CardHeaderMui
                    title={"Manage Page: " + this.props.item.title}
                    classes={{
                        title: classes.title,
                        root: classes.header
                    }}
                />
                <Divider light />
                <CardContentMui>
                    <TextField
                        label="Title"
                        className={classes.textField}
                        value={item.title}
                        onChange={this.onFieldChange('title')}
                        margin="normal"
                        style={{ marginTop: 0 }}
                        fullWidth
                    />
                    <br />
                    <TextField
                        label="Description"
                        className={classes.textField}
                        value={item.description}
                        onChange={this.onFieldChange('description')}
                        margin="normal"
                        style={{ marginTop: 0 }}
                        fullWidth
                    />
                    <br />
                    <TextField
                        label="Path"
                        className={classes.textField}
                        value={path}
                        disabled={true}
                        margin="normal"
                        style={{ marginTop: 0 }}
                        fullWidth
                    />
                    <br />
                    <ControllersList
                        title="Controllers"
                        workspaces={this.props.workspaces}
                        controllers={this.props.controllers}
                        selectedId={this.state.item.controller_id}
                        newPage={'newPage' in this.state.item}
                        checkController={(id) => this.setState({ item: { ...this.state.item, controller_id: id } })}
                    />
                </CardContentMui>
                <Divider light />
                <CardActionsMui className={classes.actions}>
                    <div>
                        <Button onClick={this.onSave}>
                            Save
                        </Button>
                        <Button onClick={this.openDialog}>
                            Remove
                        </Button>
                        <Button onClick={this.onReset}>
                            Reset
                        </Button>
                        <Button disabled={'newPage' in this.props.item}
                            onClick={() => this.props.changeURL(this.getPageUrl())}>
                            View
                        </Button>
                        <Button disabled={'newPage' in this.props.item}
                            onClick={() => this.props.changeURL(this.getPageUrl() + '/edit')}>
                            Edit
                        </Button>
                        <Button onClick={() => window.open(`/api/pages/${this.state.item.id}/export`, '_blank')}>
                            Export
                        </Button>
                    </div>
                </CardActionsMui>
                {this.state.dialogOpen &&
                    <Dialog
                        open={this.state.dialogOpen}
                        onClose={this.closeDialog}
                    >
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                Are you sure you want to remove this page?
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={this.closeDialog} color="primary">
                                Cancel
                            </Button>
                            <Button onClick={this.onDelete} color="primary" autoFocus>
                                Submit
                            </Button>
                        </DialogActions>
                    </Dialog>
                }
            </CardMui>
        );
    }
}
export default withStyles(styles)(ManagePage);
