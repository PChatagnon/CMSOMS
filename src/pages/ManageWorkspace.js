import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { loadingCompleted, openSnackbar } from '../actions/appActions';
import { updateWorkspace } from '../actions/workspaceActions';
import { validateLdapName } from '../actions/appActions';

import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import FaceIcon from '@material-ui/icons/Face';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';

function mapStateToProps(state) {
    return {
        app: state.app,
        workspaces: state.workspaces,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        ...bindActionCreators({
            loadingCompleted, openSnackbar, updateWorkspace, validateLdapName,
        }, dispatch),
        dispatch
    };
}

const styles = {
    card: {
        margin: 10, marginBottom: 5, overflowX: 'hidden'
    },
    title: {
        fontSize: 16,
    },
    subheader: {
        fontSize: 14,
    },
    header: {
        padding: 14,
        paddingRight: 28
    },
    content: {
        padding: 14,
        paddingTop: 0,
        overflowY: 'auto'
    },
    actions: {
        paddingBottom: 6,
        paddingLeft: 14,
    },
    chip: {
        margin: 4,
    },
    wrapper: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    textField: {
        width: 450,
        fontSize: 15
    },
    adminButton: {
        margin: 4,
        verticalAlign: 'bottom'
    }
};

class ManageWorkspace extends React.Component {

    constructor(props) {
        super(props);
        const { selectedWorkspace } = props.workspaces;
        this.state = {
            description: selectedWorkspace ? selectedWorkspace.description : '',
            admins: selectedWorkspace ? selectedWorkspace.admins.split(';') : null,
            admin: '',
        };
    }

    componentDidUpdate(prevProps) {
        this.props.loadingCompleted();

        const { selectedWorkspace } = this.props.workspaces;
        if (prevProps.workspaces.selectedWorkspace === selectedWorkspace) return;

        this.setState({
            description: selectedWorkspace.description,
            admins: selectedWorkspace.admins.split(';'),
        });
    }

    componentDidMount() {
        this.props.loadingCompleted();
    }

    onFieldChange = name => event => {
        this.setState({ [name]: event.target.value });
    }

    onReset = () => {
        const { selectedWorkspace } = this.props.workspaces;
        this.setState({
            description: selectedWorkspace ? selectedWorkspace.description : '',
            admins: selectedWorkspace ? selectedWorkspace.admins.split(';') : null,
            admin: '',
        });
    }

    onSave = () => {
        const { selectedWorkspace } = this.props.workspaces;
        const workspace = {
            id: selectedWorkspace.id,
            description: this.state.description,
            admins: this.state.admins,
        }
        this.props.updateWorkspace(workspace);
    }

    onAdminDelete = (admin) => {
        this.setState({
            admins: this.state.admins.filter(item => item !== admin),
        });
    }

    onAdminAdd = () => {
        const { admin } = this.state;

        if (admin === '') {
            this.props.openSnackbar('Please enter a valid username or e-group.');
            return;
        }

        const found = this.state.admins.find(item => item === admin);
        if (found) {
            this.props.openSnackbar('This username or e-group is already added.');
            return;
        }

        this.props.validateLdapName(admin)
            .then(response => {
                if (!response) return;
                this.setState({
                    admins: this.state.admins.concat(this.state.admin),
                    admin: '',
                });
            });
    }

    renderAdmins = () => {
        const { admins } = this.state;
        if (!admins) {
            return (<Chip label="This workspace doesn't contain any admins." />);
        }
        return this.state.admins.map(admin => {
            return (
                <Chip
                    key={admin}
                    icon={<FaceIcon />}
                    label={admin}
                    onDelete={() => this.onAdminDelete(admin)}
                    className={this.props.classes.chip}
                />
            );
        });
    }

    render() {
        const { classes } = this.props;
        return (
            <Card className={classes.card}>
                <CardHeader
                    title='Manage Workspace'
                    subheader='Change description, manage workspace admins'
                    classes={{
                        title: classes.title,
                        subheader: classes.subheader,
                        root: classes.header
                    }}
                />
                <Divider light />
                <CardContent className={classes.content}>
                    <div>
                        <TextField
                            label="Description"
                            className={classes.textField}
                            value={this.state.description}
                            onChange={this.onFieldChange('description')}
                            margin="normal"
                            fullWidth
                        />
                        <br />
                        <TextField
                            label='Add New Admin'
                            onChange={this.onFieldChange('admin')}
                            value={this.state.admin}
                            className={classes.textField}
                            margin="normal"
                        />
                        <Button className={classes.adminButton} onClick={this.onAdminAdd}>
                            Add Admin
                        </Button>
                        <br />
                        <div>
                            <Typography variant="subtitle2" gutterBottom style={{ marginTop: 10 }}>
                                Workspace admins
                            </Typography>
                            <div style={styles.wrapper}>
                                {this.renderAdmins()}
                            </div>
                        </div>
                    </div>
                </CardContent>
                <Divider light />
                <CardActions className={classes.actions}>
                    <Button onClick={this.onSave}>
                        Save
                        </Button>
                    <Button onClick={this.onReset}>
                        Reset
                    </Button>
                </CardActions>
            </Card>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(ManageWorkspace));