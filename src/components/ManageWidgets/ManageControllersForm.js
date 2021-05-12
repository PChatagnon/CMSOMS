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
import SelectorsList from './SelectorsList';
import JsonEditor, { MAX_CHAR_SIZE } from '../generic/JsonEditor';
import { prettyJsonString } from '../../utils/prettyUtils';
import { validateJson } from '../generic/JsonValidator';

const styles = {
    selectField: {
        marginTop: 15,
        width: 350
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
};

class ManageControllersForm extends Component {

    constructor(props) {
        super(props);
        this.state = this.getInitialState(props);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.item === this.props.item) return;
        this.setState(this.getInitialState(this.props));
    }

    getInitialState = (props = this.props) => {
        const { item, components } = props;
        return {
            item: {
                ...item,
                controller_component_id: item.controller_component_id || components[0].id,
                controller_component: item.controller_component || components[0],
                configuration: item.configuration ? JSON.stringify(item.configuration, null, 2) : '',
            },
            selectors: item ? [...item.selectors] : [],
            dialogOpen: false,
        };
    }

    openDialog = () => this.setState({ dialogOpen: true });

    closeDialog = () => this.setState({ dialogOpen: false });

    onFieldChange = name => event => {
        this.setState({ item: { ...this.state.item, [name]: event.target.value } });
    }

    onSave = () => {
        const { selectors } = this.state;
        let item = { ...this.state.item };

        // Validate input fields
        if (item.title === '' || item.description === '') {
            return this.props.openSnackbar('Please fill in all fields.')
        }

        // Validate json config
        const validJson = prettyJsonString(item.configuration);
        if (!validJson && item.configuration !== '') {
            return this.props.openSnackbar('Controller configuration is not valid.');
        }

        if (item.configuration.length > MAX_CHAR_SIZE) {
            return this.props.openSnackbar(`Portlet configuration is too long. Maximum size is ${MAX_CHAR_SIZE} chars.`);
        }

        // Config should be saved as json object
        item.configuration = item.configuration ? JSON.parse(item.configuration) : null;

        // Validate json against json schema
        const validation = validateJson(item.controller_component.config_schema, item.configuration);
        if (!validation.valid) {
            return this.props.openSnackbar(`Configuration error: ${validation.errors}`);
        }

        item.selectors = selectors;
        item.selector_ids = selectors.map(s => s.id);

        delete item.selectors;
        delete item.controller_component;

        if (item.id !== 'new') {
            return this.props.updateController(item);
        }
        this.props.addController(item);
        this.onReset();
    }

    onDelete = () => {
        this.props.deleteController(this.state.item);
        this.closeDialog();
    }

    onReset = () => this.setState(this.getInitialState(this.props));

    checkSelector = (selector, selected) => {
        const { selectors } = this.state;
        if (selected) {
            // remove selector from selectors array
            return this.setState({ selectors: selectors.filter(s => s.id !== selector.id) });
        }
        // add selector to selectors array
        return this.setState({ selectors: [...selectors, selector] });
    }

    render() {
        if (!this.props.item) return <div />;
        const { item } = this.state;
        const { classes } = this.props;
        return (
            <Card className={classes.card}>
                <CardHeader
                    title={item.id === 'new' ? 'Add New Controller' : 'Manage Controller'}
                    classes={{
                        title: classes.title,
                        root: classes.header
                    }}
                />
                <Divider light />
                <CardContent>
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
                    <div style={{ width: '45%', display: 'inline-block' }}>
                        <JsonEditor
                            title='Configuration'
                            json={item.configuration}
                            onChange={newCofig => this.setState({ item: { ...this.state.item, configuration: newCofig } })}
                        />
                    </div>
                    {item.controller_component && item.controller_component.config_schema &&
                        <div style={{ width: '45%', display: 'inline-block', marginLeft: 15 }}>
                            <JsonEditor
                                title='JSON Schema (Read Only)'
                                json={JSON.stringify(item.controller_component.config_schema || "", null, 2)}
                                disabled={true}
                            />
                        </div>
                    }
                    <br />
                    <TextField
                        select
                        label="Component Name"
                        className={classes.selectField}
                        value={item.controller_component_id}
                        onChange={event => {
                            const component = this.props.components.filter(c => c.id === event.target.value)[0];
                            this.setState({
                                item: {
                                    ...this.state.item,
                                    controller_component_id: component.id,
                                    controller_component: { ...component }
                                }
                            })
                        }}
                        margin="dense"
                        fullWidth
                        disabled={item.id !== 'new'}
                    >
                        {this.props.components
                            .sort((a, b) => (a.name > b.name) ? 1 : -1)
                            .map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)
                        }
                    </TextField>
                    {item.id !== 'new' &&
                        <TextField
                            label="Used In Pages"
                            className={classes.textField}
                            value={item.dependencies ? item.dependencies.pages : ''}
                            disabled={true}
                            margin="dense"
                            style={{ width: 150, marginTop: 15, marginLeft: 10 }}
                        />
                    }
                    <br />
                    <div style={{ width: '45%' }}>
                        <SelectorsList
                            title="Selectors"
                            workspaces={this.props.workspaces}
                            selectors={this.props.selectors}
                            portletSelectors={this.state.selectors}
                            checkSelector={this.checkSelector}
                        />
                    </div>
                </CardContent>
                <Divider light />
                <CardActions className={classes.actions}>
                    <div>
                        <Button onClick={this.onSave}>
                            Save
                        </Button>
                        <Button onClick={this.openDialog} disabled={item.id === 'new'}>
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
                                Are you sure you want to remove this controller?
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
            </Card >
        );
    }
}

export default withStyles(styles)(ManageControllersForm);