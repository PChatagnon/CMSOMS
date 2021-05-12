import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';
import JsonEditor, { MAX_CHAR_SIZE } from '../generic/JsonEditor';
import { prettyJsonString } from '../../utils/prettyUtils';

const styles = {
    container: {
        width: '45%',
        display: 'inline-block'
    },
    textField: {
        fontSize: 14,
    },
    itemMenu: {
        width: 200,
    },
    selectField: {
        marginLeft: 15,
        width: 200,
        paddingRight: 14,
    }
};

class PortletEditModal extends Component {

    constructor(props) {
        super(props);
        this.state = this.getInitialState(props);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.portlet === this.props.portlet) return;
        this.setState(this.getInitialState(this.props));
    }

    getInitialState = (props = this.props) => {
        const { portlet } = props;
        return {
            config: portlet && portlet.configuration
                ? JSON.stringify(portlet.configuration, null, 2)
                : '',
            groupId: portlet ? portlet.group_id : null
        }
    }

    onReset = () => this.setState(this.getInitialState(this.props));

    handleChange = name => event => this.setState({ [name]: event.target.value });

    onSave = () => {
        let portlet = { ...this.props.portlet };
        const { config, groupId } = this.state;

        // Validate json config
        const validJson = prettyJsonString(config);
        if (!validJson && config !== '') {
            return this.props.openSnackbar('Portlet configuration is not valid.');
        }

        if (config.length > MAX_CHAR_SIZE) {
            return this.props.openSnackbar(`Portlet configuration is too long. Maximum size is ${MAX_CHAR_SIZE} chars.`);
        }

        // Config should be saved as json object
        portlet.configuration = config ? JSON.parse(config) : null;

        portlet.group_id = groupId;
        delete portlet.portlet;

        this.props.updatePortlet(portlet);
        this.props.close();
    }

    render() {
        if (!this.props.open || !this.props.portlet) return <div />;

        const { configuration, portlet_component } = this.props.portlet.portlet;
        const { config, groupId } = this.state;
        const { classes } = this.props;
        return (
            <Dialog
                open={this.props.open}
                onClose={this.props.close}
                scroll="paper"
                aria-labelledby="title"
                fullWidth
                maxWidth="lg"
            >
                <DialogTitle id="title">{'Edit Portlet: ' + this.props.portlet.portlet.title}</DialogTitle>
                <Divider light />
                <DialogContent>
                    <div style={{ width: '45%', display: 'inline-block' }}>
                        <JsonEditor
                            title='General Portlet Configuration (Read Only)'
                            json={JSON.stringify(configuration || "", null, 2)}
                            disabled={true}
                        />
                    </div>
                    <div style={{ width: '45%', display: 'inline-block' }}>
                        <JsonEditor
                            title='Portlet Configuration For This Page'
                            json={config}
                            onChange={newCofig => {
                                console.log('bu');
                                return this.setState({ config: newCofig })
                            }}
                        />
                    </div>
                    <br />
                    {portlet_component && portlet_component.config_schema &&
                        <div style={{ width: '45%', display: 'inline-block' }}>
                            <JsonEditor
                                title='Portlet Component JSON Schema (Read Only)'
                                json={JSON.stringify(portlet_component.config_schema || "", null, 2)}
                                disabled={true}
                            />
                        </div>
                    }
                    <div className={classes.container}>
                        <TextField
                            id="component-name"
                            label="Component"
                            value={portlet_component.name}
                            InputProps={{ className: classes.textField }}
                            margin="normal"
                            disabled
                        />
                        <TextField
                            id="md-select"
                            select
                            label="Group Id (Master Details)"
                            value={groupId}
                            className={classes.selectField}
                            InputProps={{ className: classes.textField }}
                            onChange={this.handleChange('groupId')}
                            margin="normal"
                            SelectProps={{
                                MenuProps: {
                                    className: classes.itemMenu,
                                }
                            }}
                        >
                            <MenuItem value={0}>0</MenuItem>
                            <MenuItem value={1}>1</MenuItem>
                            <MenuItem value={2}>2</MenuItem>
                            <MenuItem value={3}>3</MenuItem>
                            <MenuItem value={4}>4</MenuItem>
                            <MenuItem value={5}>5</MenuItem>
                        </TextField>
                    </div>
                </DialogContent>
                <Divider light />
                <DialogActions>
                    <Button onClick={this.onSave} color="primary">
                        Save
                    </Button>
                    <Button onClick={this.onReset} color="primary">
                        Reset
                    </Button>
                    <Button onClick={this.props.close} color="primary">
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default withStyles(styles)(PortletEditModal);