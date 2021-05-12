import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';

import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import JsonAceEditor from '../generic/JsonAceEditor'
import Spinner from '../generic/Spinner';

import { prettyJsonString } from '../../utils/prettyUtils';
import { pageNameFromTitle } from '../../utils/utils';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Checkbox from '@material-ui/core/Checkbox';

import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';

import axios from 'axios';

import { getErrorMessage } from '../../actions/mainActions';
import { Typography } from '@material-ui/core';

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
    textField: {
        marginTop: 10,
        fontSize: 14
    },
    paper: {
        width: '100%',
        marginTop: 10,
        overflowX: 'auto',
    },
    table: {
        minWidth: 650,
    },
    button: {
        marginTop: 15,
        marginRight: 15
    },
    goodRow: { backgroundColor: "#cff9d4" },
    warnRow: { backgroundColor: "#e7ab4b" },
    errRow: { backgroundColor: "#e75d4b" }
};

const steps = ['Page Layout Validation', 'Validation Results', 'Import Results'];

class ManageFolder extends Component {

    constructor(props) {
        super(props);
        this.state = {
            item: { ...props.item },
            dialogOpen: false,

            pageImportSpinnerShow: false,

            pageImportJSON: '{}', //{"controller":{"controller_component":{"name":"FillReportController","workspace":"cms"},"title":"Fill Report","workspace":"cms"},"description":"Bunch Info","path":"bunch_info","portlet_properties":[{"configuration":null,"groupd_id":0,"portlet":{"description":"Full information about one Fill","title":"Fill Details","workspace":"cms"},"portlet_component":{"name":"VerticalDataTable","type":"generic_table","workspace":"cms"},"pos_x":13,"pos_y":0,"size_x":5,"size_y":24},{"configuration":null,"groupd_id":0,"portlet":{"description":"Bunch Info Chart","title":"Bunch Info Chart","workspace":"cms"},"portlet_component":{"name":"BunchInfoChart","type":"chart","workspace":"cms"},"pos_x":0,"pos_y":0,"size_x":13,"size_y":15},{"configuration":{"pagesize":4000},"groupd_id":0,"portlet":{"description":"Bunch Info","title":"Bunch Info","workspace":"cms"},"portlet_component":{"name":"DataTable","type":"generic_table","workspace":"cms"},"pos_x":0,"pos_y":15,"size_x":13,"size_y":16}],"title":"Bunch Info","workspace":"cms"}',

            validationResults: [],
            validationSuccess: false,
            pageImportCheckbox: false,

            importResults: [],
            importSuccess: false,

            currentImportStep: 0
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.item === this.props.item) return;
        this.setState({ item: { ...this.props.item }, currentImportStep: 0 });
    }

    openDialog = () => this.setState({ dialogOpen: true });

    closeDialog = () => this.setState({ dialogOpen: false });

    onSave = () => {
        let { item } = this.state;

        if (item.title === '' || item.description === '') {
            return this.props.openSnackbar('Please fill in all fields.')
        }

        if ('newFolder' in item) {
            delete item.newFolder;
            return this.props.addNewFolder(item);
        }
        this.props.updateFolder(item.id, item);
    }

    onPageImportValidate = () => {
        // Check is JSON is valid before submitting to API
        let validJsonStr = prettyJsonString(this.state.pageImportJSON);

        if (!validJsonStr && this.state.pageImportJSON !== null) {
            return this.props.openSnackbar('JSON is not valid.');
        }

        this.setState({
            pageImportSpinnerShow: true,
            onPageImportCheckbox: false,
            pageImportJSON: validJsonStr
        })

        let headers = { headers: { 'OMS-Workspace-Version': this.props.selectedWorkspace.version } };

        axios.post('/api/pages/import?folder_id=' + this.state.item.id, JSON.parse(validJsonStr), headers)
            .then((response) => {


                if (response.data.hasOwnProperty("results") && response.data.hasOwnProperty("valid")) {
                    this.props.openSnackbar('Validation complete')
                }
                else {
                    this.props.openSnackbar('Validation failed: unkown validation result')
                }

                this.setState({
                    pageImportSpinnerShow: false,
                    currentImportStep: this.state.currentImportStep + 1,
                    validationResults: response.data.hasOwnProperty("results") ? response.data["results"] : [],
                    validationSuccess: response.data.hasOwnProperty("valid") ? response.data["valid"] : false
                })

            },
                (error) => {
                    this.setState({ pageImportSpinnerShow: false })
                    let message = "";
                    try {
                        message = ': ' + error.response["data"]["errors"][0]["detail"]

                    } catch (error) {
                        console.log(error)
                    }

                    this.props.openSnackbar(getErrorMessage(error, 'Validation failed ' + message))
                    console.log(error)
                }
            );
    }

    onPageImportSubmit = () => {

        // Once again check is JSON is valid
        let validJsonStr = prettyJsonString(this.state.pageImportJSON);

        if (!validJsonStr && this.state.pageImportJSON !== null) {
            return this.props.openSnackbar('JSON is not valid.');
        }

        this.setState({
            pageImportSpinnerShow: true
        })

        let headers = { headers: { 'OMS-Workspace-Version': this.props.selectedWorkspace.version } };

        axios.post('/api/pages/import?folder_id=' + this.state.item.id + '&checkbox_checked=' + (this.state.pageImportCheckbox ? 1 : 0), JSON.parse(validJsonStr), headers)
            .then((response) => {

                if (response.data.hasOwnProperty("results") && response.data.hasOwnProperty("valid")) {
                    this.props.openSnackbar('Import complete')
                }
                else {
                    this.props.openSnackbar('Import failed: unkown import result')
                }

                this.setState({
                    pageImportSpinnerShow: false,
                    currentImportStep: this.state.currentImportStep + 1,
                    importResults: response.data.hasOwnProperty("results") ? response.data["results"] : [],
                    importSuccess: response.data.hasOwnProperty("valid") ? response.data["valid"] : false
                })
            },
                (error) => {
                    this.setState({ pageImportSpinnerShow: false })
                    this.props.openSnackbar(getErrorMessage(error, 'Import failed'))
                    console.log(error)
                }
            );
    }

    onDelete = () => {
        this.closeDialog();
        const { item } = this.state;
        if ('newFolder' in item) {
            return this.props.deleteLocalFolder(item.id);
        }
        this.props.deleteFolder(item.id);
    }

    onReset = () => this.setState({ item: { ...this.props.item } });

    removeBtnDisabled = () => {
        if (!this.state.item) return true;
        return this.state.item.pages.length ? true : false;
    }

    onFieldChange = name => event => {
        this.setState({ item: { ...this.state.item, [name]: event.target.value } });
    }

    onImportStepNext = () => this.setState({ currentImportStep: this.state.currentImportStep + 1 });

    onImportStepBack = () => this.setState({ currentImportStep: this.state.currentImportStep - 1 });

    onImportStepReset = () => this.setState({
        currentImportStep: 0,
        pageImportJSON: '',
        pageImportCheckbox: false,
        validationResults: [],
        importResults: [],
    });

    onPageImportCheckbox = event => {
        this.setState({ pageImportCheckbox: event.target.checked });
    }

    getFolderUrl = () => {
        if (!this.state.item) return '/';
        let path = this.state.item.path;
        if (path===undefined) {
            path = pageNameFromTitle(this.state.item.title);
        }
        return `/${this.props.selectedWorkspace.path}/${path}`;
    }

    render() {
        const { classes } = this.props;
        const { item } = this.state;
        const path = this.getFolderUrl();

        const getRowClass = (row) => {
            if (row[0] === "WARN") return classes.warnRow;
            if (row[0] === "ERR") return classes.errRow;
            if (row[0] === "GOOD") return classes.goodRow;
        }

        return (
            <div>
                <Card className={classes.card}>
                    <CardHeader
                        title={"Manage Folder: " + this.props.item.title}
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
                            style={{ marginTop: 0 }}
                            fullWidth
                        />
                        <br />
                        <TextField
                            label="Path"
                            className={classes.textField}
                            value={path}
                            disabled={true}
                            margin="normal"
                            style={{ marginTop: 0 }}
                            fullWidth
                        />
                    </CardContent>
                    <Divider light />
                    <CardActions className={classes.actions}>
                        <div>
                            <Button onClick={this.onSave}>
                                Save
                        </Button>
                            <Button onClick={this.openDialog} disabled={this.removeBtnDisabled()}>
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
                                    Are you sure you want to remove this folder?
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


                <Card className={classes.card}>
                    <CardHeader
                        title={"Page Import"}
                        classes={{
                            title: classes.title,
                            root: classes.header
                        }}
                    />
                    <Divider light />
                    <CardContent>
                        <Stepper activeStep={this.state.currentImportStep}>
                            {steps.map((label, index) => {
                                const stepProps = {};
                                const labelProps = {};
                                return (
                                    <Step key={label} {...stepProps}>
                                        <StepLabel {...labelProps}>{label}</StepLabel>
                                    </Step>
                                );
                            })}
                        </Stepper>

                        {this.state.currentImportStep === 0 && (
                            <div>
                                <JsonAceEditor
                                    title='Page Layout'
                                    placeholder='Enter JSON here'
                                    json={this.state.pageImportJSON}
                                    maxSize={120000}
                                    onChange={newValue => this.setState({ pageImportJSON: newValue })}
                                />
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={this.onPageImportValidate}
                                    className={classes.button}
                                >
                                    Validate
                                </Button>
                                {this.state.pageImportSpinnerShow && (<Spinner className={classes.button} />)}
                            </div>
                        )}
                        {this.state.currentImportStep === 1 && (
                            <div>
                                <Table>
                                    {/* className={classes.table}> */}
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Description</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {this.state.validationResults.map((row, i) => (
                                            <TableRow className={getRowClass(row)} key={i}>
                                                <TableCell>{row[0]}</TableCell>
                                                <TableCell>{row[1]}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Checkbox
                                    checked={this.state.pageImportCheckbox}
                                    onChange={this.onPageImportCheckbox}
                                    disabled={!this.state.validationSuccess}
                                // inputProps={{
                                //     'aria-label': 'primary checkbox',
                                // }}
                                /> By checking this I confirm that I understand what I am doing.
                                <Divider light />
                                <Button disabled={this.state.currentImportStep === 0} onClick={this.onImportStepBack} className={classes.button}>
                                    Back
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={this.onPageImportSubmit}
                                    className={classes.button}
                                    disabled={!this.state.pageImportCheckbox || !this.state.validationSuccess}
                                >
                                    Import
                                </Button>
                                {this.state.pageImportSpinnerShow && (<Spinner className={classes.button} />)}
                            </div>
                        )}
                        {this.state.currentImportStep === 2 && (
                            <div>
                                {this.state.importSuccess && (
                                    <Typography>Import was successful. Please refresh the window.</Typography>
                                )}
                                {!this.state.importSuccess && (
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Description</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {this.state.importResults.map((row, i) => (
                                            <TableRow className={getRowClass(row)} key={i}>
                                                <TableCell>{row[0]}</TableCell>
                                                <TableCell>{row[1]}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>)}

                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={ () => {window.location.reload()}} className={classes.button}
                                >
                                    Refresh
                                </Button>
                            </div>
                        )}



                    </CardContent>

                    {this.state.dialogOpen &&
                        <Dialog
                            open={this.state.dialogOpen}
                            onClose={this.closeDialog}
                        >
                            <DialogTitle>Are you sure?</DialogTitle>
                            <DialogContent>
                                <DialogContentText>
                                    Are you sure you want to remove this folder?
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

            </div>
        );
    }
}
export default withStyles(styles)(ManageFolder);
