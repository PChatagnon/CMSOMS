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
import WebIcon from '@material-ui/icons/Web';
import InsertChartIcon from '@material-ui/icons/InsertChart';
import FormatQuotetIcon from '@material-ui/icons/FormatQuote';
import Collapse from '@material-ui/core/Collapse';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import { Loader } from '../generic/Spinner';
import ManagePortletsForm from './ManagePortletsForm';

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
        height: '663px',
        padding: 0
    },
    actions: {
        paddingBottom: 6,
        paddingLeft: 14,
    }
}

class ManagePortlets extends Component {

    state = {
        tab: "table"
    }

    componentDidUpdate(prevProps) {
        const { workspaces } = this.props;

        // Fetch portlets if workspaces are already loaded,
        // portlets are not yet fetched and not fetching at the moment

        if (workspaces.length && !this.props.fetchingPages && !this.props.fetchingPortlets && !this.props.portlets) {
            this.props.fetchPortlets();
        }
        if (workspaces.length && !this.props.fetchingComponents && !this.props.portletComponents) {
            this.props.fetchPortletComponents();
        }
        if (workspaces.length && !this.props.fetchingSelectors && !this.props.selectors) {
            this.props.fetchSelectors();
        }
    }

    handleClick = (itemId, itemState) => () => {
        this.setState({ [itemId]: !itemState });
    }

    onNewPortlet = () => {
        const portlet = {
            id: 'new',
            title: '',
            description: '',
            configuration: null,
            min_size_x: 4,
            min_size_y: 6,
            selectorsIn: [],
            selectorsOut: [],
            portlet_component_id: null,
            workspace_id: this.props.selectedWorkspace.id
        }
        this.props.selectPortlet(portlet);
    }

    filterPortlets = type => {
        return this.props.portlets.filter(portlet => portlet.portlet_component.type === type);
    }

    renderPortlets = (portlets, inset) => {
        if (!portlets.length) return null;
        const portletId = this.props.selectedPortlet ? this.props.selectedPortlet.id : null;
        return portlets.map(p =>
            <ListItem
                button
                dense
                key={p.id}
                selected={p.id === portletId}
                onClick={() => this.props.selectPortlet(p)}
            >
                <ListItemText style={inset ? { paddingLeft: 24 } : {}} primary={p.title} />
            </ListItem>
        );
    }

    renderComponents = type => {
        const { portletComponents, portlets } = this.props;
        const components = portletComponents
            .filter(c => c.type === type)
            .sort((a, b) => (a.name > b.name) ? 1 : -1);

        if (!components.length) return null;

        return components.map(c => {
            const filtered = portlets
                .filter(p => p.portlet_component_id === c.id)
                .sort((a, b) => (a.title > b.title) ? 1 : -1);

            if (!filtered.length) return null;
            if (filtered.length === 1) {
                return this.renderPortlets(filtered, false);
            }
            const open = this.state[c.id];
            return (
                <div key={c.id}>
                    <ListItem button dense onClick={this.handleClick(c.id, open)}>
                        <ListItemText primary={c.name} />
                        {open ? <ExpandLess /> : <ExpandMore />}
                    </ListItem>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding dense>
                            {this.renderPortlets(filtered, true)}
                        </List>
                    </Collapse>
                </div>
            )
        }
        );
    }

    render() {
        if (!this.props.portlets || !this.props.selectors) return <Loader />;
        const { tab } = this.state;
        const { classes } = this.props;
        return (
            <Grid container spacing={0}>
                <Grid item xs={4}>
                    <AppBar position="static">
                        <Tabs
                            value={tab}
                            variant="scrollable"
                            scrollButtons="auto"
                            onChange={(e, value) => this.setState({ tab: value })}
                        >
                            <Tab label="Tables" value="table" icon={<WebIcon />} />
                            <Tab label="Charts" value="chart" icon={<InsertChartIcon />} />
                            <Tab label="Text" value="text" icon={<FormatQuotetIcon />} />
                        </Tabs>
                    </AppBar>
                    <Card className={classes.card}>
                        <CardHeader
                            title="Manage Portlets"
                            classes={{
                                title: classes.title,
                                root: classes.header
                            }}
                        />
                        <Divider light />
                        <CardContent className={classes.content}>
                            <List component="nav">
                                {tab === 'table' && this.renderComponents('generic_table')}
                                {tab === 'chart' && this.renderComponents('generic_chart')}
                                {this.renderComponents(tab)}
                            </List>
                        </CardContent>
                        <Divider light />
                        <CardActions className={classes.actions}>
                            <Button onClick={this.onNewPortlet}>
                                New Portlet
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
                <Grid item xs={8}>
                    {this.props.selectedPortlet &&
                        <ManagePortletsForm cols={2}
                            item={this.props.selectedPortlet}
                            portlets={this.props.portlets}
                            workspaces={this.props.workspaces}
                            components={this.props.portletComponents}
                            selectors={this.props.selectors}
                            selectPortlet={this.props.selectPortlet}
                            updatePortlet={this.props.updatePortlet}
                            addPortlet={this.props.addPortlet}
                            deletePortlet={this.props.deletePortlet}
                            selectedWorkspace={this.props.selectedWorkspace}
                            openSnackbar={this.props.openSnackbar}
                            componentType={tab}
                        />
                    }
                </Grid>
            </Grid>
        );
    }
}

export default withStyles(styles)(ManagePortlets);
