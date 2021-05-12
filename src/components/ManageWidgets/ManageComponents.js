import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
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
import { Loader } from '../generic/Spinner';
import ManageComponentsForm from './ManageComponentsForm';
import { prettyJsonString } from '../../utils/prettyUtils';
import { MAX_CHAR_SIZE } from '../generic/JsonEditor';

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
        height: '667px',
        padding: 0
    },
    actions: {
        paddingBottom: 6,
        paddingLeft: 14,
    },
}

class ManageComponents extends Component {

    constructor(props) {
        super(props);
        this.state = {
            tab: 0,
            component: this.getNewComponent(props, 'portlet'),
        };
    }

    componentDidMount() {
        const { workspaces } = this.props;

        if (workspaces.length && !this.props.fetchingPortletComponents && !this.props.portletComponents) {
            this.props.fetchPortletComponents();
        }

        if (workspaces.length && !this.props.fetchingControllerComponents && !this.props.controllerComponents) {
            this.props.fetchControllerComponents();
        }

        if (workspaces.length && !this.props.fetchingControllers && !this.props.controllers) {
            this.props.fetchControllers();
        }

        if (workspaces.length && !this.props.fetchingPages && !this.props.fetchingPortlets && !this.props.portlets) {
            this.props.fetchPortlets();
        }
    }

    onNewComponent = type => () => this.setState({ component: this.getNewComponent(this.props, type) });

    getNewComponent = (props, type) => {
        return {
            id: 'new',
            name: '',
            config_schema: '',
            workspace_id: props.workspaceId,
            componentType: type,
            type: type === 'portlet' ? 'table' : '',
            used: 0
        }
    }

    onDelete = () => {
        const { component } = this.state;
        const componentType = component.componentType;

        if (componentType === 'portlet') {
            this.props.deletePortletComponent(component);
        } else {
            this.props.deleteControllerComponent(component);
        }
        this.onNewComponent(componentType)();
    }

    onSave = () => {
        let item = { ...this.state.component };
        const componentType = item.componentType;

        if (item.name === '') {
            return this.props.openSnackbar('Please fill in all fields.')
        }

        // Validate json config
        const validJson = prettyJsonString(item.config_schema);
        if (!validJson && item.config_schema !== '') {
            return this.props.openSnackbar('Portlet configuration is not valid.');
        }

        if (item.config_schema.length > MAX_CHAR_SIZE) {
            return this.props.openSnackbar(`Portlet configuration is too long. Maximum size is ${MAX_CHAR_SIZE} chars.`);
        }

        // Config should be saved as json object
        item.config_schema = item.config_schema ? JSON.parse(item.config_schema) : null;

        if (item.id !== 'new') {
            if (componentType === 'portlet') {
                return this.props.updatePortletComponent(item);
            }
            return this.props.updateControllerComponent(item);
        }

        if (componentType === 'portlet') {
            this.props.addPortletComponent(item);
        } else {
            this.props.addControllerComponent(item);
        }
        this.onNewComponent(componentType)();
    }

    onUpdate = component => this.setState({ component: { ...component } });

    onReset = () => {
        const { component } = this.state;
        const componentType = component.componentType;
        if (component.id === 'new') {
            return this.onNewComponent(componentType)();
        }
        const components = this.filterComponents(componentType);
        const oldComponent = components.find(c => c.id === component.id);
        return this.renderComponent(oldComponent, componentType);
    }

    filterComponents = type => {
        const components = type === 'portlet'
            ? this.props.portletComponents
            : this.props.controllerComponents;
        if (!components.length) return null;
        return components.filter(c => c.workspace_id === this.props.workspaceId);
    }

    getUsedNumber = (type, id) => {
        const components = type === 'portlet' ? this.props.portlets : this.props.controllers;
        const componentFilter = type === 'portlet' ? 'portlet_component_id' : 'controller_component_id';
        return components && components.length > 0 ?
            components.filter(c => c[componentFilter] === id).length : 0;
    }

    renderComponent = (component, type) => {
        this.setState({
            component: {
                ...component,
                componentType: type,
                used: this.getUsedNumber(type, component.id),
                config_schema: component.config_schema ? JSON.stringify(component.config_schema, null, 2) : '',
            }
        })
    }

    renderComponents = type => {
        const components = this.filterComponents(type);
        if (!components.length) return null;

        const componentId = this.state.component ? this.state.component.id : null;
        return components
            .sort((a, b) => (a.name > b.name) ? 1 : -1)
            .map(c =>
                <ListItem
                    button
                    dense
                    key={c.id}
                    selected={c.id === componentId}
                    onClick={() => this.renderComponent(c, type)}
                >
                    <ListItemText primary={c.name} />
                </ListItem>
            );
    }

    render() {
        if (!this.props.portletComponents || !this.props.controllerComponents) {
            return <Loader />;
        }
        const { tab } = this.state;
        const { classes } = this.props;
        return (
            <Grid container spacing={0}>
                <Grid item xs={4}>
                    <AppBar position="static">
                        <Tabs
                            value={tab} variant="fullWidth"
                            onChange={(e, value) => this.setState({ tab: value })}
                        >
                            <Tab label="Portlets" />
                            <Tab label="Controllers" />
                        </Tabs>
                    </AppBar>
                    <Card className={classes.card}>
                        <CardHeader
                            title={`Manage Components: ${tab === 0 ? 'Portlets' : 'Controllers'}`}
                            classes={{
                                title: classes.title,
                                root: classes.header
                            }}
                        />
                        <Divider light />
                        <CardContent className={classes.content}>
                            <List component="nav">
                                {this.renderComponents(tab === 0 ? 'portlet' : 'controller')}
                            </List>
                        </CardContent>
                        <Divider light />
                        <CardActions className={classes.actions}>
                            <Button onClick={this.onNewComponent('portlet')}>
                                New Portlet
                            </Button>
                            <Button onClick={this.onNewComponent('controller')}>
                                New Controller
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
                <Grid item xs={8}>
                    {this.state.component &&
                        <ManageComponentsForm
                            cols={2}
                            item={this.state.component}
                            onUpdate={this.onUpdate}
                            onSave={this.onSave}
                            onDelete={this.onDelete}
                            onReset={this.onReset}
                        />
                    }
                </Grid>
            </Grid>
        );
    }
}

export default withStyles(styles)(ManageComponents);
