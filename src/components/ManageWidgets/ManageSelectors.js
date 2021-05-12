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
import ManageSelectorsForm from './ManageSelectorsForm';

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
        height: '667px',
        padding: 0
    },
    actions: {
        paddingBottom: 6,
        paddingLeft: 14,
    },
}

class ManageSelectors extends Component {

    constructor(props) {
        super(props);
        this.state = {
            selector: this.getNewSelector(props)
        };
    }

    onNewSelector = () => this.setState({ selector: this.getNewSelector() });

    onDeleteSelector = id => {
        this.props.deleteSelector(id);
        this.onNewSelector();
    }

    getNewSelector = (props = this.props) => {
        return {
            id: 'new',
            title: '',
            name: '',
            description: '',
            data_type: 'STRING',
            workspace_id: props.workspaceId,
            dependencies: { controllers: 0, portlets: 0 },
            operator: 'EQ',
            attribute: '',
            value: null
        }
    }

    renderSelectors = () => {
        const selectedId = this.state.selector ? this.state.selector.id : null;
        return this.props.selectors.map(selector => {
            return (
                <ListItem
                    button
                    dense
                    key={selector.id}
                    selected={selector.id === selectedId}
                    onClick={() => this.setState({ selector: selector })}
                >
                    <ListItemText primary={selector.title} />
                </ListItem>
            );
        });
    }

    render() {
        if (!this.props.selectors) return <Loader />;
        const { classes } = this.props;
        return (
            <Grid container spacing={0}>
                <Grid item xs={4}>
                    <Card className={classes.card}>
                        <CardHeader
                            title='Manage Selectors'
                            classes={{
                                title: classes.title,
                                root: classes.header
                            }}
                        />
                        <Divider light />
                        <CardContent className={classes.content}>
                            <List component="nav">
                                {this.renderSelectors()}
                            </List>
                        </CardContent>
                        <Divider light />
                        <CardActions className={classes.actions}>
                            <Button onClick={this.onNewSelector}>
                                New Selector
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
                <Grid item xs={8}>
                    {this.state.selector &&
                        <ManageSelectorsForm
                            item={this.state.selector}
                            updateSelector={this.props.updateSelector}
                            addSelector={this.props.addSelector}
                            deleteSelector={this.onDeleteSelector}
                            openSnackbar={this.props.openSnackbar}
                        />
                    }
                </Grid>
            </Grid>
        );
    }
}

export default withStyles(styles)(ManageSelectors);