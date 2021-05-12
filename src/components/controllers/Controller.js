import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Collapse from '@material-ui/core/Collapse';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import Tooltip from '@material-ui/core/Tooltip';
import getController from './ControllerMap';

const styles = {
    card: {
        margin: 10, marginBottom: 5, overflowX: 'hidden'
    },
    title: {
        fontSize: 15,
    },
    subheader: {
        fontSize: 14,
    },
    header: {
        padding: 14,
        paddingBottom: 0,
        paddingRight: 28
    },
    content: {
        padding: 0,
        paddingLeft: 16,
        overflowY: 'auto'
    },
    actions: {
        paddingBottom: 6,
        paddingLeft: 14,
    }
};

class Controller extends Component {

    onApply = () => {
        this.props.updateQuery(this.props.controllerState, this.props.controller.controller_component.name, this.props.locationSearch);
    }

    onOK = () => {
        this.onApply();
        this.toggle();
    }

    onReset = () => this.props.loadController(this.props.controller, null, true, false, {});

    toggle = () => this.props.toggleController();

    getSearch = () => { return this.props.locationSearch };

    render() {
        const { controller, classes } = this.props;
        if (!controller) return <div />;

        const { name } = controller.controller_component;
        const ControllerComponent = getController(name);
        const height = ControllerComponent.controllerHeight;
        return (
            <Collapse in={this.props.visible} timeout='auto'>
                <Card
                    className={classes.card}
                    data-tut='tutorial_controller_box'
                    id='controllerContainer'
                >
                    <CardHeader
                        title={controller.title}
                        subheader={controller.description}
                        action={
                            <Tooltip title='Hide Controller'>
                                <IconButton onClick={this.toggle}>
                                    <ExpandLessIcon />
                                </IconButton>
                            </Tooltip>
                        }
                        classes={{
                            title: classes.title,
                            subheader: classes.subheader,
                            root: classes.header
                        }}
                    />
                    <CardContent className={classes.content} style={{ height: height - 120 }}>
                        <ControllerComponent
                            componentName={name}
                            controllerState={this.props.controllerState}
                            updateState={this.props.updateControllerState}
                            updateQuery={this.props.updateQuery}
                            getSearch={this.getSearch}
                            controllerData={this.props.controllerData}
                            controllerExportData={this.props.controllerExportData}
                            updateControllerData={this.props.updateControllerData}
                            configuration={controller.configuration || {}}
                        />
                    </CardContent>
                    <CardActions className={classes.actions}>
                        <Tooltip title='Apply changes'>
                            <Button onClick={this.onApply}>Apply</Button>
                        </Tooltip>
                        <Tooltip title='Apply and close Controller'>
                            <Button onClick={this.onOK}>OK</Button>
                        </Tooltip>
                        <Tooltip title='Close Controller'>
                            <Button onClick={this.toggle}>Close</Button>
                        </Tooltip>
                        <Tooltip title='Reset Controller values'>
                            <Button onClick={this.onReset}>Reset</Button>
                        </Tooltip>
                    </CardActions>
                </Card>
            </Collapse>
        );
    }
}

export default withStyles(styles)(Controller);
