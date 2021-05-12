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
        width: 120
    }
};

class ManagePortletsForm extends Component {

    constructor(props) {
        super(props);
        this.state = this.getInitialState(props);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.item === this.props.item) return;
        this.setState(this.getInitialState(this.props));
    }

    getInitialState = (props = this.props) => {
        const { item, componentType, components } = props;
        return {
            item: {
                ...item,
                configuration: item.configuration ? JSON.stringify(item.configuration, null, 2) : '',
                portlet_component: item.portlet_component
                    ? item.portlet_component
                    : props.components.filter(c => c.type === componentType)[0]
            },
            componentType: componentType,
            componentId: item.portlet_component_id
                ? item.portlet_component_id
                : components.filter(c => c.type === componentType)[0].id,
            dialogOpen: false,
        };
    }

    openDialog = () => this.setState({ dialogOpen: true });

    closeDialog = () => this.setState({ dialogOpen: false });

    onFieldChange = name => event => {
        this.setState({ item: { ...this.state.item, [name]: event.target.value } });
    }

    onSave = () => {
        let item = { ...this.state.item };

        // Validate input fields
        if (item.title === '' || item.description === '' ||
            item.min_size_x === '' || item.min_size_y === '') {
            return this.props.openSnackbar('Please fill in all fields.')
        }

        // Validate json config
        const validJson = prettyJsonString(item.configuration);
        if (!validJson && item.configuration !== '') {
            return this.props.openSnackbar('Portlet configuration is not valid.');
        }

        if (item.configuration.length > MAX_CHAR_SIZE) {
            return this.props.openSnackbar(`Portlet configuration is too long. Maximum size is ${MAX_CHAR_SIZE} chars.`);
        }

        // Config should be saved as json object
        item.configuration = item.configuration ? JSON.parse(item.configuration) : null;

        // Validate json against json schema
        const validation = validateJson(item.portlet_component.config_schema, item.configuration);
        if (!validation.valid) {
            return this.props.openSnackbar(`Configuration error: ${validation.errors}`);
        }

        const selectors = {
            in: item.selectorsIn.map(s => s.id),
            out: item.selectorsOut.map(s => s.id)
        };

        delete item.selectors;
        delete item.selectorsIn;
        delete item.selectorsOut;
        delete item.portlet_component;

        item.min_size_x = parseInt(item.min_size_x, 10);
        item.min_size_y = parseInt(item.min_size_y, 10);
        item.selectors = selectors;

        if (item.id !== 'new') {
            return this.props.updatePortlet(item);
        }
        item.portlet_component_id = this.state.componentId;
        return this.props.addPortlet(item);
    }

    onReset = () => this.setState(this.getInitialState(this.props));

    onDelete = () => {
        this.props.deletePortlet(this.state.item);
        this.closeDialog();
    }

    checkSelector = (selector, selected, key) => {
        const { item } = this.state;
        if (selected) {
            // remove selector from selectors array
            return this.setState({
                item: {
                    ...item, [key]: item[key].filter(s => s.id !== selector.id)
                }
            });
        }
        // add selector to selectors array
        return this.setState({ item: { ...item, [key]: [...item[key], selector] } });
    }

    render() {
        const { item, componentType, componentId } = this.state;
        const { classes } = this.props;
        return (
            <Card className={classes.card}>
                <CardHeader
                    title={item.id === 'new' ? 'Add New Portlet' : 'Manage Portlet'}
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
                    {item.portlet_component && item.portlet_component.config_schema &&
                        <div style={{ width: '45%', display: 'inline-block', marginLeft: 15 }}>
                            <JsonEditor
                                title='JSON Schema (Read Only)'
                                json={JSON.stringify(item.portlet_component.config_schema || "", null, 2)}
                                disabled={true}
                            />
                        </div>
                    }
                    <br />
                    {item.id === 'new' &&
                        <TextField
                            select
                            label="Component Type"
                            className={classes.selectField}
                            value={componentType}
                            onChange={event => {
                                const component = this.props.components.filter(c => c.type === event.target.value)[0];
                                this.setState({
                                    componentType: event.target.value,
                                    componentId: component.id,
                                    item: {
                                        ...this.state.item,
                                        portlet_component: { ...component }
                                    }
                                })
                            }}
                            margin="dense"
                            style={{ marginRight: 10, width: 250 }}
                        >
                            <MenuItem value="table">Custom Table</MenuItem>
                            <MenuItem value="chart">Chart</MenuItem>
                            <MenuItem value="text">Text</MenuItem>
                            <MenuItem value="generic_table">Generic Table</MenuItem>
                            <MenuItem value="generic_chart">Generic Chart</MenuItem>
                        </TextField>
                    }
                    <TextField
                        select
                        label="Component Name"
                        className={classes.selectField}
                        value={componentId}
                        onChange={event => this.setState({
                            componentId: event.target.value,
                            item: {
                                ...this.state.item,
                                portlet_component: {
                                    ...this.props.components.find(c => c.id === event.target.value)
                                }
                            }
                        })}
                        margin="dense"
                        fullWidth
                        disabled={item.id !== 'new'}
                    >
                        {this.props.components
                            .filter(c => item.id === 'new' ? c.type === componentType : c)
                            .sort((a, b) => (a.name > b.name) ? 1 : -1)
                            .map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)
                        }
                    </TextField>
                    <br />
                    <TextField
                        label="Min Size X"
                        className={classes.inlineTextField}
                        value={item.min_size_x}
                        onChange={this.onFieldChange('min_size_x')}
                        margin="normal"
                    />
                    <TextField
                        label="Min Size Y"
                        className={classes.inlineTextField}
                        value={item.min_size_y}
                        onChange={this.onFieldChange('min_size_y')}
                        margin="normal"
                    />
                    <TextField
                        label="Used In Pages"
                        className={classes.inlineTextField}
                        value={item.dependencies ? item.dependencies.portlet_properties : ''}
                        disabled={true}
                        margin="normal"
                    />
                    <br />
                    <div style={{ width: '45%', display: 'inline-block' }}>
                        <SelectorsList
                            title="Selectors In"
                            workspaces={this.props.workspaces}
                            selectors={this.props.selectors}
                            portletSelectors={this.state.item.selectorsIn}
                            checkSelector={(p1, p2) => this.checkSelector(p1, p2, 'selectorsIn')}
                        />
                    </div>
                    <div style={{ width: '45%', display: 'inline-block', marginLeft: 15 }}>
                        <SelectorsList
                            title="Selectors Out (Master-Details)"
                            workspaces={this.props.workspaces}
                            selectors={this.props.selectors}
                            portletSelectors={this.state.item.selectorsOut}
                            checkSelector={(p1, p2) => this.checkSelector(p1, p2, 'selectorsOut')}
                        />
                    </div>
                </CardContent>
                <Divider light />
                <CardActions className={classes.actions}>
                    <div>
                        <Button onClick={this.onSave}>
                            Save
                        </Button>
                        <Button
                            onClick={this.openDialog}
                            disabled={item.id === 'new' || (item.dependencies && (item.dependencies.portlet_properties > 0))}
                        >
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
                                Are you sure you want to remove this portlet?
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

export default withStyles(styles)(ManagePortletsForm);
