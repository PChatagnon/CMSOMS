import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import Divider from '@material-ui/core/Divider';
import Spinner from '../generic/Spinner';
import grey from '@material-ui/core/colors/grey';
import { getVersion, getRelease, getBuildTime } from '../../utils/hostUtils';

export default class InfoModal extends React.PureComponent {

    renderListItem = (title, value) => {
        return (
            <ListItem key={title}>
                <ListItemText
                    primary={<span><span style={{ color: grey[700] }}>{title}: </span>{value}</span>}
                    disabled={true}
                />
            </ListItem>
        )
    }

    renderInfo = () => {
        const { apiInfo } = this.props;
        if (!apiInfo) return <Spinner />;

        const { agg, api } = apiInfo;
        return (
            <div>
                <List component="nav" dense disablePadding
                    subheader={<ListSubheader disableSticky>GUI</ListSubheader>}>
                    {[
                        this.renderListItem('version', getVersion()),
                        this.renderListItem('release', getRelease()),
                        this.renderListItem('build time', getBuildTime())
                    ]}
                </List>
                <Divider />

                <List component="nav" dense disablePadding
                    subheader={<ListSubheader disableSticky>Aggregation API</ListSubheader>}>
                    {[
                        this.renderListItem('version', agg.version),
                        this.renderListItem('branch', agg.branch),
                        this.renderListItem('last commit', agg.git_sha_1),
                        this.renderListItem('build time', agg.timestamp)
                    ]}
                </List>
                <Divider />

                <List component="nav" dense disablePadding
                    subheader={<ListSubheader disableSticky>Portal API</ListSubheader>}>
                    {[
                        this.renderListItem('version', api.version),
                        this.renderListItem('release', api.release),
                        this.renderListItem('build time', api.time)
                    ]}
                </List>
            </div>
        );
    }

    render() {
        return (
            <Dialog
                open={this.props.open}
                onClose={this.props.close}
                scroll="paper"
                aria-labelledby="about"
                fullWidth
            >
                <DialogTitle id="about">About</DialogTitle>
                <Divider light />
                <DialogContent>
                    {this.renderInfo()}
                </DialogContent>
                <Divider light />
                <DialogActions>
                    <Button onClick={this.props.close} color="primary">
                        Cancel
                        </Button>
                </DialogActions>
            </Dialog>
        );
    }
}