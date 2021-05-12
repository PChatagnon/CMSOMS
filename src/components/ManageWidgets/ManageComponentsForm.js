import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Divider from '@material-ui/core/Divider';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import MenuItem from '@material-ui/core/MenuItem';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import JsonEditor from '../generic/JsonEditor';
import { capitalizeString } from '../../utils/prettyUtils';

const styles = {
    selectField: {
        marginTop: 15,
        width: 350
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
    textField: {
        fontSize: 14,
        width: 350,
        marginRight: 10
    },
};

class ManageComponentsForm extends Component {

    state = { dialogOpen: false };

    openDialog = () => this.setState({ dialogOpen: true });

    closeDialog = () => this.setState({ dialogOpen: false });

    onDelete = () => {
        this.props.onDelete();
        this.closeDialog();
    }

    render() {
        const { item } = this.props;
        if (!item) return <div />;

        const { classes } = this.props;
        const title = item.id === 'new' ?
            `Add New ${capitalizeString(item.componentType)} Component` :
            `Manage ${capitalizeString(item.componentType)} Component`;
        return (
            <Card className={classes.card}>
                <CardHeader
                    title={title}
                    classes={{
                        title: classes.title,
                        root: classes.header
                    }}
                />
                <Divider light />
                <CardContent>
                    <TextField
                        label="Component Name"
                        className={classes.textField}
                        value={item.name}
                        onChange={event => this.props.onUpdate({ ...item, name: event.target.value })}
                        margin="normal"
                        style={{ marginTop: 0 }}
                    />
                    {item.id !== 'new' &&
                        <TextField
                            label={`Used In ${capitalizeString(item.componentType)}s`}
                            className={classes.textField}
                            value={item.used}
                            disabled={true}
                            margin="normal"
                            style={{ width: 150, marginTop: 0 }}
                        />
                    }
                    {item.id !== 'new' &&
                        <TextField
                            label="Last User"
                            className={classes.textField}
                            value={item.last_user || 'None'}
                            disabled={true}
                            margin="normal"
                            style={{ width: 150, marginTop: 0 }}
                        />
                    }
                    <br />
                    {item.type &&
                        <TextField
                            select
                            label="Component Type"
                            className={classes.selectField}
                            value={item.type}
                            onChange={event => this.props.onUpdate({ ...item, type: event.target.value })}
                            margin="dense"
                            fullWidth
                        >
                            <MenuItem value="table">Table</MenuItem>
                            <MenuItem value="chart">Chart</MenuItem>
                            <MenuItem value="text">Text</MenuItem>
                            <MenuItem value="generic_table">Generic Table</MenuItem>
                            <MenuItem value="generic_chart">Generic Chart</MenuItem>
                        </TextField>
                    }
                    <JsonEditor
                        title='JSON Schema'
                        placeholder='Enter JSON Schema here'
                        json={item.config_schema}
                        onChange={newCofig => this.props.onUpdate({ ...item, config_schema: newCofig })}
                    />
                </CardContent>
                <Divider light />
                <CardActions className={classes.actions}>
                    <div>
                        <Button onClick={this.props.onSave}>
                            Save
                        </Button>
                        <Button onClick={this.openDialog} disabled={item.id === 'new'}>
                            Remove
                        </Button>
                        <Button onClick={this.props.onReset}>
                            Reset
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
                                Are you sure you want to remove this component?
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
            </Card>
        );
    }
}

export default withStyles(styles)(ManageComponentsForm);
