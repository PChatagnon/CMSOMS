import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Divider from '@material-ui/core/Divider';
import Badge from '@material-ui/core/Badge';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import MenuItem from '@material-ui/core/MenuItem';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

const styles = {
    selectField: {
        marginTop: 15,
        marginRight: 10,
        width: 250
    },
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
    margin: {
        margin: 6,
    },
    padding: {
        padding: 4,
    },
    textField: {
        marginTop: 10,
        fontSize: 14
    },
    inlineTextField: {
        marginTop: 12,
        marginRight: 10,
        fontSize: 14,
        width: 250
    }
};

class ManageSelectorsForm extends Component {

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

    onReset = () => this.setState({ item: { ...this.props.item } });

    onFieldChange = name => event => {
        this.setState({ item: { ...this.state.item, [name]: event.target.value } });
    }

    onSave = () => {
        const { item } = this.state;

        if (item.title === '' || item.description === ''
            || item.name === '' || item.attribute === '') {
            return this.props.openSnackbar('Please fill in all fields.')
        }
        
        item.value = !item.value || item.value.trim() === '' ? null : item.value.trim();

        if (item.id !== 'new') {
            return this.props.updateSelector(item);
        }
        this.props.addSelector(item);
        this.onReset();
    }

    onDelete = () => {
        this.props.deleteSelector(this.state.item.id);
        this.closeDialog();
    }

    isEditable = () => {
        const { item } = this.state;
        const notUsed = item.dependencies.controllers === 0 && item.dependencies.portlets === 0;
        return item.id === 'new' || notUsed;
    }

    render() {
        const { item } = this.state;
        const { classes } = this.props;
        const editable = this.isEditable();
        return (
            <Card className={classes.card}>
                <CardHeader
                    title={item.id === 'new' ? 'Add New Selector' : 'Edit Selector'}
                    classes={{
                        title: classes.title,
                        root: classes.header
                    }}
                />
                <Divider light />
                <CardContent>
                    <div>
                        Selector is used in:
                        <Badge color="primary" showZero badgeContent={item.dependencies.controllers} className={classes.margin}>
                            <span className={classes.padding}>Controllers,</span>
                        </Badge>
                        <Badge color="primary" showZero badgeContent={item.dependencies.portlets} className={classes.margin}>
                            <span className={classes.padding}>Portlets</span>
                        </Badge>
                    </div>
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
                        fullWidth
                    />
                    <br />
                    <TextField
                        label="Name"
                        className={classes.inlineTextField}
                        value={item.name}
                        onChange={this.onFieldChange('name')}
                        margin="normal"
                        fullWidth
                        disabled={item.id !== 'new'}
                    />
                    <TextField
                        select
                        label="Data Type"
                        className={classes.selectField}
                        value={item.data_type}
                        onChange={this.onFieldChange('data_type')}
                        margin="dense"
                        fullWidth
                        disabled={!editable}
                    >
                        <MenuItem value="STRING">STRING</MenuItem>
                        <MenuItem value="BOOLEAN">BOOLEAN</MenuItem>
                        <MenuItem value="DATE">DATE</MenuItem>
                    </TextField>
                    <br />
                    <TextField
                        label="Attribute"
                        className={classes.inlineTextField}
                        value={item.attribute}
                        onChange={this.onFieldChange('attribute')}
                        margin="normal"
                        fullWidth
                        disabled={!editable}
                    />
                    <TextField
                        select
                        label="Operator"
                        className={classes.selectField}
                        value={item.operator}
                        onChange={this.onFieldChange('operator')}
                        margin="dense"
                        fullWidth
                        disabled={!editable}
                    >
                        <MenuItem value="EQ">EQ - Equal</MenuItem>
                        <MenuItem value="NEQ">NEQ - Not Equal</MenuItem>
                        <MenuItem value="GT">GT - Greater than</MenuItem>
                        <MenuItem value="GE">GE - Greater than or Equal</MenuItem>
                        <MenuItem value="LT">LT - Less than</MenuItem>
                        <MenuItem value="LE">LE - Less than or Equal</MenuItem>
                        <MenuItem value="LIKE">LIKE - Search for string</MenuItem>
                    </TextField>
                    {item.data_type === 'BOOLEAN' &&
                        <TextField
                            label="Value (Optional)"
                            className={classes.inlineTextField}
                            value={item.value || ''}
                            onChange={this.onFieldChange('value')}
                            margin="normal"
                            fullWidth
                            disabled={!editable}
                        />
                    }
                </CardContent>
                <Divider light />
                <CardActions className={classes.actions}>
                    <div>
                        <Button onClick={this.onSave}>
                            Save
                        </Button>
                        <Button onClick={this.openDialog} disabled={!editable || item.id === 'new'}>
                            Remove
                        </Button>
                        <Button onClick={this.onReset}>
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
                                Are you sure you want to remove this selector?
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

export default withStyles(styles)(ManageSelectorsForm);