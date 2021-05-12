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
import { Loader } from '../generic/Spinner';
import ManageControllersForm from './ManageControllersForm';

const styles = {
    card: {
        margin: 10,
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
        height: '688px',
        padding: 0
    },
    actions: {
        paddingBottom: 6,
        paddingLeft: 14,
    },
}

class ManageControllers extends Component {

    constructor(props) {
        super(props);
        this.state = {
            controller: this.getNewController(props)
        };
    }

    componentDidMount() {
        const { workspaces, controllers, fetchingPages, fetchingControllers, fetchingControllerComponents, controllerComponents } = this.props;

        // Fetch controllers if workspaces are already loaded,
        // controllers are not yet fetched and not fetching at the moment
        if (workspaces.length && !fetchingPages && !fetchingControllers && !controllers) {
            this.props.fetchControllers();
        }

        if (workspaces.length && !fetchingControllerComponents && !controllerComponents) {
            this.props.fetchControllerComponents();
        }
    }

    onNew = () => this.setState({ controller: this.getNewController() });

    onDelete = controller => {
        this.props.deleteController(controller);
        this.onNew();
    }

    getNewController = (props = this.props) => {
        return {
            id: 'new',
            title: '',
            name: '',
            description: '',
            selectors: [],
            workspace_id: props.workspaceId,
            controller_component: null,
            controller_component_id: null,
        }
    }

    renderControllers = () => {
        const controllerId = this.state.controller ? this.state.controller.id : null;
        return this.props.controllers
            .sort((a, b) => (a.title > b.title) ? 1 : -1)
            .map(controller => {
                return (
                    <ListItem
                        button
                        dense
                        key={controller.id}
                        selected={controller.id === controllerId}
                        onClick={() => this.setState({ controller: controller })}
                    >
                        <ListItemText primary={controller.title} />
                    </ListItem>
                );
            });
    }

    render() {
        if (!this.props.controllers || !this.props.controllerComponents) return <Loader />;
        const { classes } = this.props;
        return (
            <Grid container spacing={0}>
                <Grid item xs={4}>
                    <Card className={classes.card}>
                        <CardHeader
                            title='Manage Controllers'
                            classes={{
                                title: classes.title,
                                root: classes.header
                            }}
                        />
                        <Divider light />
                        <CardContent className={classes.content}>
                            <List component="nav">
                                {this.renderControllers()}
                            </List>
                        </CardContent>
                        <Divider light />
                        <CardActions className={classes.actions}>
                            <Button onClick={this.onNew}>
                                New Controller
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
                <Grid item xs={8}>
                    {this.state.controller &&
                        <ManageControllersForm
                            cols={2}
                            item={this.state.controller}
                            updateController={this.props.updateController}
                            addController={this.props.addController}
                            deleteController={this.onDelete}
                            openSnackbar={this.props.openSnackbar}
                            workspaces={this.props.workspaces}
                            selectors={this.props.selectors}
                            components={this.props.controllerComponents}
                        />
                    }
                </Grid>
            </Grid>
        );
    }
}

export default withStyles(styles)(ManageControllers);