import React, { Component } from 'react';
import { prettyFloat } from '../../../utils/prettyUtils';
import { diffDatetime, dateToUnix, unixToDatetime, formatDatetime, formatDatetimeUtc } from '../../../utils/dateUtils';
import CRUDTable from '../generic/datatable/CRUDTable';
import Grid from '@material-ui/core/Grid';
import AddBox from '@material-ui/icons/AddBox';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import { withStyles } from '@material-ui/core/styles';
import Comment from '@material-ui/icons/Comment';
import CallSplit from '@material-ui/icons/CallSplit';
import LowPriority from '@material-ui/icons/LowPriority';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { Button, Divider } from '@material-ui/core';
import Tooltip from '@material-ui/core/Tooltip';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Snackbar from '@material-ui/core/Snackbar';
import axios from 'axios';
import katex from 'katex';
import Checkbox from '@material-ui/core/Checkbox';
import { isEqual } from 'lodash';


const API_URL = "/crud-api"; // Production

//refresh intervals before resetting the page to 1
const CHANGE_PAGE_RESET_INTS = 5;

const styles = {
    textBox: {
        marginTop: 8
    }
}

const HtmlTooltip = withStyles((theme) => ({
    tooltip: {
        backgroundColor: '#f5f5f9',
        color: 'rgba(0, 0, 0, 0.87)',
        maxWidth: 220,
        fontSize: theme.typography.pxToRem(14),
        border: '1px solid #dadde9',
    },
}))(Tooltip);

const StyledTableCell = withStyles((theme) => ({
    head: {
        backgroundColor: "#dddddd",
    },
    body: {
        fontSize: 14,
    },
}))(TableCell);

class DowntimesPanel extends Component {

    state = {
        tableRef: React.createRef(),

        show_pending_ack_only: false,

        downtime_split_seconds: 1,
        downtime1_duration: null,
        downtime2_duration: null,
        downtime_split_time: null,

        active_tab: false,
        active_row: null,
        custom_comment_id: null,
        selected_row_id: null, //downtime id

        snackbar_message: "",
        snackbar_open: false,
        useUtc: false,

        new_comment : {
            start_time: null,
            stop_time: null,
            duration: null,

            group_name: "",
            group_valid: true,
            downtime_groups_id: null,

            category_name: "",
            category_valid: true,
            downtime_categories_id: null,

            subsystem_name: "",
            subsystem_valid: true,
            downtime_subsystems_id: null,

            partition_name: "",
            partition_valid: true,
            downtime_partitions_id: null,

            fed_name: "",
            fed_valid: true,
            downtime_feds_id: null,

            details: "",
        },

        current_entry: null
    }
    // New comment details text
    details = ""
    new_details_ref = React.createRef();

    // New comment dropdowns
    downtime_group_categories = { "": [] }
    subsystem_partitions = { "": [] }

    // timer (TODO: use configuration + defaults)
    paused = false;
    defaultInterval = 30;

    //should get get from configuratio
    lastPage = 1;
    lastPageSize = 10;
    resetPageCount = 0;

    componentDidMount() {

        this.timerID = null;

        this.loadData();
    }

    componentWillUnmount() {
        this.stopTimer();
    }

    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, this.loadData);
        this.props.shouldRefresh(this.props, this.loadData);
    }

    startTimer(cb, sec) {
        clearInterval(this.timerID);
        this.timerID = setInterval(cb, sec*1000);
    }

    stopTimer() {
        clearInterval(this.timerID);
        this.timerID = null;
    }

    loadData = () => {
        //this.props.showLoader();
        this.setState({ active_tab: false, active_row: null })
        this.props.hideLoader();

        const ctrlData = this.props.controllerExportData;
        const query = this.props.query;

        //TODO: add as configuration parameter
        //const inervalTime = this.props.configuration ? this.props.configuration.autorefresh_time : null;
        this.resetPageCount = 0;

        if (ctrlData.autoQueryStates.includes(query.filterBy)) {
            this.startTimer(
                () => {
                    if (this.state.tableRef.current) {

                        if (this.resetPageCount === 1) {
                            this.state.tableRef.current.onQueryChange(true, false, false)
                            this.setState({ active_tab: false, active_row: null }); //probably possible to keep entry for edits, but for now this is disabled
                        }
                        else
                            this.state.tableRef.current.onQueryChange(false, false, false)

                        if (this.resetPageCount>0) this.resetPageCount--;
                    }
                },
                //intervalTime || this.defaultInterval
                this.defaultInterval
            )
        } else {
            this.stopTimer();
        }

        //console.log(query)
        //console.log(ctrlData)
    }
    postLoadData = (data) => {
        //update comments table if it has changed
        if (this.state.selected_row_id)
            data.forEach( (item) => {
                if (item.id === this.state.selected_row_id && !isEqual(this.state.active_row, item.attributes)) {
                    console.log("not equal, updating comments table")
                    this.setState({active_row: item.attributes});
                }
            });
    }

    // Click on a row in a Downtimes Table
    handleCommentRowChange = (event, rowData) => {

        if (!this.state.active_row)
            return;
        if (!this.props.controllerExportData.isOperator)
            return;

        const newState = {  active_tab: 1, custom_comment_id: rowData.comment_id };

        this.handleCommentChange(rowData, newState, this.state.new_comment, true);
    }

    //handles comment /row state change
    handleCommentChange = (rowData, customState, customCommentState, backup) => {

        this.setState({

            ...customState,

            new_comment: {
                ...customCommentState,
                group_name: rowData.group_name || "",
                downtime_groups_id: this.getSelectedGroupId(rowData.group_name),
                category_name: rowData.category_name || "",
                subsystem_name: rowData.subsystem_name || "",
                downtime_subsystems_id: this.getSelectedSubsystemId(rowData.subsystem_name),
                partition_name: rowData.partition_name || "",
                fed_name: rowData.fed_name || "",
                details: rowData.details || "",
            }
        }, () => {
            const cstate = this.state.new_comment;
            const cat_id =  this.getSelectedCategoryId(rowData.category_name);
            const part_id = this.getSelectedPartitionId(rowData.partition_name);
            //second state set
            this.setState({
                new_comment: {
                    ...cstate,
                    downtime_categories_id: cat_id,
                    downtime_partitions_id: part_id,
                    group_valid: this.isGroupValid(cstate.downtime_groups_id),
                    category_valid: this.isCategoryValid(cat_id),
                    subsystem_valid: this.isSubsystemValid(cstate.downtime_subsystems_id),
                    partition_valid: this.isPartitionValid(part_id),
                }
            }, () => {
                    const cstate = this.state.new_comment;
                    const feds_id =  this.getSelectedFedTableId(rowData.fed_name);
                    this.setState({
                        new_comment: {
                            ...cstate,
                            downtime_feds_id: feds_id,
                            fed_valid: this.isFedValid(cstate.fed_name)
                        }
                    }, !backup ? undefined : () => {
                            //parameter copy for split downtime
                            const params_copy = Object.assign({}, this.state.new_comment);
                            this.setState({
                                current_entry: params_copy
                            })
                    })
            })
        })
        this.details = ""
        if (this.new_details_ref.current)
            this.new_details_ref.current.value = ""
    }

    // Click on a row in a Downtimes Table
    handleCommentRowChangeForTab = () => {

        if (this.state.custom_comment_id)
            return;

        if (!this.state.active_row)
            return;
        const rowData = this.state.active_row;

        //no backup
        this.handleCommentChange(rowData, {}, this.state.new_comment, false);
    }


    // Reset custom row
    resetCommentRowChange = () => {

        if (!this.state.custom_comment_id) return;

        const params_copy = Object.assign({}, this.state.current_entry);

        this.setState({
            custom_comment_id: null,
            new_comment: params_copy,
        })
        this.details = ""
        if (this.new_details_ref.current)
            this.new_details_ref.current.value = ""
    }

    // Click on a row in a Downtimes Table
    handleRowChange = (event, id, rowData) => {

        if (id === this.state.selected_row_id || id === null) {
            // Unselect
            this.setState({
                active_tab: false,
                active_row: null,
                custom_comment_id: null,
                selected_row_id: null,
                downtime1_duration: null,
                downtime2_duration: null,
                downtime_split_time: null
            });
        } else {
            // Select
            // Make sure we do not loose seconds while rounding
            if (!this.props.controllerExportData.isOperator) {
              this.setState({
                  active_tab: 0,
                  active_row: rowData,
                  custom_comment_id: null,
                  selected_row_id: id
              });
              return;
            }
            let duration1 = Math.ceil(rowData.lost_time / 2)
            let duration2 = rowData.lost_time - duration1

            const newState = {
                active_tab: rowData.comments && rowData.comments.length ? 0 : 1,
                active_row: rowData,

                custom_comment_id: null,
                selected_row_id: id,
                downtime_split_seconds: duration1,
                downtime1_duration: diffDatetime(0, duration1),
                downtime2_duration: diffDatetime(0, duration2),
                downtime_split_time: unixToDatetime(dateToUnix(rowData.start_time_utc, false) + duration1 * 1000, !this.state.useUtc)
            }

            //initial comment values
            const newCommentState = {
                start_time: rowData.start_time,
                stop_time: rowData.stop_time,
                lost_time_str: rowData.lost_time_str
            }

            //TODO: check if backup is needed for this case
            this.handleCommentChange(rowData, newState, newCommentState, true);
        }
    }

    // Switch between Tabs (Create new comment, Comments, Split, Merge)
    handleTabChange = (event, new_tab) => {
        this.setState({ active_tab: new_tab },
                      () => {
                          if (this.state.active_tab === 0) this.resetCommentRowChange()
                          if (this.state.active_tab === 1) this.handleCommentRowChangeForTab();
                      });
    }

    // Downtime Split Tab. input for seconds
    handleSplitInputChange = (event) => {
        if (event.target.value) {
            let downtime_split_seconds = Number(event.target.value)

            downtime_split_seconds = Math.min(downtime_split_seconds, this.state.active_row.lost_time - 1)

            this.setState({
                downtime_split_seconds: downtime_split_seconds,
                downtime1_duration: diffDatetime(0, downtime_split_seconds),
                downtime2_duration: diffDatetime(0, this.state.active_row.lost_time - downtime_split_seconds),
                //utc time to unix time and shifter time back to local time to avoid DST ambiguity
                downtime_split_time: unixToDatetime(dateToUnix(this.state.active_row.start_time_utc, false) + downtime_split_seconds * 1000, !this.state.useUtc)
            });

        }
    }

    getSelectedGroup = () => {
        const ctrlData = this.props.controllerExportData;
        const selectedGroupArr = this.state.new_comment && this.state.new_comment.downtime_groups_id ?
                               ctrlData.groupData.filter(g => g.id === this.state.new_comment.downtime_groups_id): [];
        return selectedGroupArr.length ? selectedGroupArr[0] : null;
    }

    getSelectedGroupId = (name) => {
        if (!name) return null;
        const ctrlData = this.props.controllerExportData;
        const selectedGroupArr = ctrlData.groupData.filter(g => g.attributes.name === name);
        return selectedGroupArr.length ? selectedGroupArr[0].id : null;
    }

    isGroupValid = (id) => {
        if (id === null) return true;
        const ctrlData = this.props.controllerExportData;
        const selectedGroupArr = ctrlData.groupData.filter(g => g.id === id);
        return selectedGroupArr.length ? selectedGroupArr[0].attributes.valid : true;
    }

    getSelectedCategoryId = (name) => {
        if (!name) return null;
        const selectedGroup = this.getSelectedGroup();
        const selectedCatArr = selectedGroup && selectedGroup.attributes.categories ?
                                     selectedGroup.attributes.categories.filter(c => c.attributes.name === name): [];
        return selectedCatArr.length ? selectedCatArr[0].id : null;
    }

    isCategoryValid = (id) => {
        if (id === null) return true;
        const selectedGroup = this.getSelectedGroup();
        const selectedCatArr = selectedGroup && selectedGroup.attributes.categories ?
                                     selectedGroup.attributes.categories.filter(c => c.id === id): [];
        return selectedCatArr.length ? selectedCatArr[0].attributes.valid : true;
    }


    getSelectedSubsystem = () => {
        const ctrlData = this.props.controllerExportData;
        const selectedSubsysArr = this.state.new_comment && this.state.new_comment.downtime_subsystems_id ?
                               ctrlData.subsystemData.filter(s => s.id === this.state.new_comment.downtime_subsystems_id): [];
        return selectedSubsysArr.length ? selectedSubsysArr[0] : null;
    }

    getSelectedSubsystemId = (name) => {
        if (!name) return null;
        const ctrlData = this.props.controllerExportData;
        const selectedSubsysArr = ctrlData.subsystemData.filter(s => s.attributes.name === name);
        return selectedSubsysArr.length ? selectedSubsysArr[0].id : null;
    }

    isSubsystemValid = (id) => {
        if (id === null) return true;
        const ctrlData = this.props.controllerExportData;
        const selectedSubsysArr = ctrlData.subsystemData.filter(s => s.id === id);
        return selectedSubsysArr.length ? selectedSubsysArr[0].attributes.valid : true;
    }

    getSelectedPartition = () => {
        const selectedSubsystem = this.getSelectedSubsystem();
        const selectedPartitionArr = selectedSubsystem && selectedSubsystem.attributes.partitions && this.state.new_comment.downtime_partitions_id ?
                                     selectedSubsystem.attributes.partitions.filter(p => p.id === this.state.new_comment.downtime_partitions_id): [];
        return selectedPartitionArr.length ? selectedPartitionArr[0] : null;
    }

    getSelectedPartitionId = (name) => {
        if (!name) return null;
        const selectedSubsystem = this.getSelectedSubsystem();
        const selectedPartitionArr = selectedSubsystem && selectedSubsystem.attributes.partitions ?
                                     selectedSubsystem.attributes.partitions.filter(p => p.attributes.name === name): [];
        return selectedPartitionArr.length ? selectedPartitionArr[0].id : null;
    }

    getPartition = () => {
        const selectedSubsystem = this.getSelectedSubsystem();
        const selectedPartitionArr = selectedSubsystem && selectedSubsystem.attributes.partitions && this.state.new_comment.partition_name ?
                                     selectedSubsystem.attributes.partitions.filter(p => p.attributes.name === this.state.new_comment.partition_name): [];
        return selectedPartitionArr.length ? selectedPartitionArr[0] : null;
    }

    isPartitionValid = (id) => {
        if (id === null) return true;
        const selectedSubsystem = this.getSelectedSubsystem();
        const selectedPartitionArr = selectedSubsystem && selectedSubsystem.attributes.partitions ?
                                     selectedSubsystem.attributes.partitions.filter(p => p.id === id): [];
        return selectedPartitionArr.length ? selectedPartitionArr[0].attributes.valid : true;
    }

    getSelectedFedTableId = (name) => {
        if (!name) return null;
        const selectedPartition = this.getPartition();
        if (selectedPartition && selectedPartition.attributes.fedid_to_id) {
            const id = selectedPartition.attributes.fedid_to_id[name];
            return id ? id: null;
        }
        return null;
    }

    isFedValid = (name) => {
        if (!name) return true;
        const selectedPartition = this.getPartition();
        if (selectedPartition && selectedPartition.attributes.fedids_valid) {
            const valid = selectedPartition.attributes.fedids_valid[name];
            return valid !== undefined ? valid : true;
        }
        return true;
    }

    handleGroupChange = (event) => {

        const name = event.target.value;
        if (name) {
            const gs = this.props.controllerExportData.groupData.filter( g => g.attributes.name === name)
            if (gs.length) {
                const id = gs[0].id
                const valid = gs[0].attributes.valid
                this.setState({ new_comment: { ...this.state.new_comment, downtime_groups_id: id, group_name: name, group_valid: valid,
                                               downtime_categories_id: null, category_name: "", category_valid: true} });
                console.log("Handle group change: " + name)
                return;
            }
        }
        this.setState({ new_comment: { ...this.state.new_comment, downtime_groups_id: null, group_name: "", group_valid: true,
                                       downtime_categories_id: null, category_name: "", category_valid: true}});
    }

    handleCategoryChange = (event) => {
        const name = event.target.value;
        const selectedGroup = this.getSelectedGroup();

        if (name && selectedGroup && selectedGroup.attributes.categories) {
            const cs = selectedGroup.attributes.categories.filter( c => c.attributes.name === name);
            if (cs.length) {
                const id = cs[0].id;
                const valid = cs[0].attributes.valid;
                this.setState({ new_comment: { ...this.state.new_comment, downtime_categories_id: id, category_name: name, category_valid: valid } })
                console.log("Handle category change: " + name);
                return;
            }
        }
        this.setState({ new_comment: { ...this.state.new_comment, downtime_categories_id: null, category_name: "", category_valid: true } })
    }

    handleSubsystemChange = (event) => {
        const name = event.target.value;
        if (name) {
            const ss = this.props.controllerExportData.subsystemData.filter( s => s.attributes.name === name)
            if (ss.length) {
                const id = ss[0].id;
                const valid = ss[0].attributes.valid;
                this.setState({ new_comment: { ...this.state.new_comment, downtime_subsystems_id: id, subsystem_name: name,
                                               downtime_partitions_id: null, partition_name: "", downtime_feds_id: null, fed_name: "",
                                               subsystem_valid: valid, partition_valid: true, fed_valid:true } });
                console.log("Handle subsystem change: " + name)
                return;
            }
        }
        this.setState({ new_comment: { ...this.state.new_comment, downtime_subsystems_id: null, subsystem_name: "",
                                       downtime_partitions_id: null, partition_name: "", downtime_feds_id: null, fed_name: "",
                                       subsystem_valid: true, partition_valid: true, fed_valid:true } });
    }

    handlePartitionChange = (event) => {
        const name = event.target.value;
        const selectedSubsystem = this.getSelectedSubsystem();
        if (name && selectedSubsystem && selectedSubsystem.attributes.partitions) {
            const ps = selectedSubsystem.attributes.partitions.filter( p => p.attributes.name === name);
            if (ps.length) {
                const id = ps[0].id
                const valid = ps[0].attributes.valid
                this.setState({ new_comment: { ...this.state.new_comment, downtime_partitions_id: id, partition_name: name, downtime_feds_id: null, fed_name: "",
                                               partition_valid: valid, fed_valid: true } })
                console.log("Handle partition change: " + name);
                return;
            }
        }
        this.setState({ new_comment: { ...this.state.new_comment, downtime_partitions_id: null, partition_name: "", downtime_feds_id: null, fed_name: "",
                                       partition_valid: true, fed_valid: true } })
    }

    handleFedChange = (event) => {
        const name = event.target.value;
        const selectedPartition = this.getSelectedPartition();
        if (name && selectedPartition && selectedPartition.attributes.fedid_to_id) {
            const id = selectedPartition.attributes.fedid_to_id[name];
            const valid = selectedPartition.attributes.fedids_valid[name];
            if (id) {
                console.log("Handle FED ID change: " + name);
                this.setState({ new_comment: { ...this.state.new_comment, downtime_feds_id: id, fed_name: name, fed_valid: valid } })
                return;
            }
        }

        this.setState({ new_comment: { ...this.state.new_comment, downtime_feds_id: null, fed_name: "", fed_valid: true } })
    }


    handleNewComment = () => {
        if (!this.props.controllerExportData.isOperator) { return }
        let comment = Object.assign({}, this.state.new_comment)
        comment.details = this.details
        //comment.downtimes_id = this.state.active_row.id
        comment.downtimes_id = this.state.active_row.downtimes_id
        console.log('new comment for ' + comment.downtimes_id)

        delete comment['start_time']
        delete comment['stop_time']
        delete comment['lost_time_str']

        //not allowed by CRUD-API
        delete comment['downtime_groups_id']
        delete comment['group_name']
        delete comment['category_name']
        delete comment['subsystem_name']
        delete comment['partition_name']
        delete comment['fed_name']

        delete comment['group_valid']
        delete comment['category_valid']
        delete comment['subsystem_valid']
        delete comment['partition_valid']
        delete comment['fed_valid']

        if (comment.downtime_partitions_id === null) {
            delete comment['downtime_partitions_id']
            delete comment['downtime_feds_id']
        } else if (comment.downtime_feds_id === null) {
            delete comment['downtime_feds_id']
        }

        axios.put(API_URL + "/downtime_comments", comment)
            .then((response) => {
                this.setState({
                    snackbar_message: "New comment was successfully created",
                    snackbar_open: true,
                    active_row: null,
                    selected_row_id: null
                })
                this.state.tableRef.current && this.state.tableRef.current.onQueryChange(false, true, true)
            })
            .catch((error) => {
                console.log(error)
                this.setState({ snackbar_message: "Failed to create new comment: " + error.response.data.errors[0].detail, snackbar_open: true })
            })
    }
    handleSplit = () => {
        if (!this.props.controllerExportData.isOperator) { return }

        const row = this.state.current_entry;
        if (!row) return;

        const url = API_URL + "/downtimes/" + this.state.active_row.downtimes_id + "/split"

        const data = {
            seconds: this.state.downtime_split_seconds,
            comment1_categories_id: row.downtime_categories_id,
            comment1_subsystems_id: row.downtime_subsystems_id,
            comment2_categories_id: row.downtime_categories_id,
            comment2_subsystems_id: row.downtime_subsystems_id
        }
        if  (row.downtime_partitions_id) {
            data.comment1_partitions_id = row.downtime_partitions_id
            data.comment2_partitions_id = row.downtime_partitions_id
            if  ( row.downtime_feds_id) {
                data.comment1_feds_id = row.downtime_feds_id
                data.comment2_feds_id = row.downtime_feds_id
            }
        }

        axios.post(url, data)
            .then((response) => {
                this.setState({
                    snackbar_message: "Downtime split was successful",
                    snackbar_open: true,
                    active_row: null,
                    selected_row_id: null
                })
                this.state.tableRef.current && this.state.tableRef.current.onQueryChange(false, true, true)
            })
            .catch((error) => {
                console.log(error.response.data.errors[0])
                this.setState({ snackbar_message: "Failed to split downtime: " + error.response.data.errors[0].detail, snackbar_open: true })
            })
    }

    handleUndoSplit = () => {
        if (!this.props.controllerExportData.isAdmin) { return }

        const url = API_URL + "/downtimes/" + this.state.active_row.downtimes_id + "/undosplit"

        axios.post(url)
            .then((response) => {
                this.setState({
                    snackbar_message: "Downtime undo split was successful",
                    snackbar_open: true,
                    active_row: null,
                    selected_row_id: null
                })
                this.state.tableRef.current && this.state.tableRef.current.onQueryChange(false, true, true)
            })
            .catch((error) => {
                console.log(error.response.data.errors[0])
                this.setState({ snackbar_message: "Failed to undo split: " + error.response.data.errors[0].detail, snackbar_open: true })
            })
    }

    renderCustomFilterInputs = () => {
        return (
            <div>
                <Checkbox
                    checked={this.state.show_pending_ack_only}
                    color="primary"
                    onChange={
                        () => this.setState({show_pending_ack_only: !this.state.show_pending_ack_only}, this.state.tableRef.current.onQueryChange(true, false, true))
                    }
                />
                Show missing-ACK only &nbsp;
                <Checkbox
                    checked={this.state.useUtc}
                    color="primary"
                    onChange={
                        () => this.setState({useUtc: !this.state.useUtc}, this.state.tableRef.current.onQueryChange(false, false, true))
                    }
                />
                UTC time
            </div>

        );
    }

    isErrorRow = rowData => {
      if (rowData.group_name === "UNDECIDED" || rowData.category_name === "UNDECIDED" ||
         rowData.subsystem_name === "UNDECIDED" || rowData.partition_name === "UNDECIDED" ||
         rowData.fed_name === -1) return true;
      return false;
    }

    rowColor = rowData => {
        if (this.isErrorRow(rowData))
          return "error.main";
        if (rowData.source === "Operator")
            return "#1a237e";
        return "";
    }

    filterValid = (filter, arr) => {
        if (!filter) return arr;
        let ret = [];
        arr.forEach( item => { if (item.attributes.valid) ret.push(item) })
        return ret;
    }

    filterValidFeds = (filter, feds) => {
        if (!filter) return feds;
        let ret = [];
        Object.keys(feds).forEach( key => { if (feds[key]===true) ret[key]=true } );
        return ret;
    }

    sortedDropdownText = (valid, data) => {
        return this.filterValid(valid, data)
            .sort( (a, b) => a.attributes.name > b.attributes.name )
            .map( entry => (
                <option key={entry.id} value={entry.attributes.name}>
                    {entry.attributes.name}
                </option>
                )
            );
    }

    render() {

        const ctrlData = this.props.controllerExportData;
        const selectedGroup = this.getSelectedGroup();
        const selectedSubsystem = this.getSelectedSubsystem();
        const selectedPartition = this.getSelectedPartition();
        const isSortable = ctrlData.fullMode;

        return (
            <div>
                <Snackbar
                    open={this.state.snackbar_open}
                    onClick={() => { this.setState({ snackbar_open: false }) }}
                    message={this.state.snackbar_message}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                />
                <CRUDTable
                    ref={this.state.tableRef}
                    fields={[
                    {
                        label: "Start time",
                        name: 'start_time',
                        api_type:'html',
                        sortable: isSortable,
                        render: rowData => <Box color={this.rowColor(rowData)}>{rowData.start_time || ""}</Box>
                    },
                    {
                        label: "Stop time",
                        name: 'stop_time',
                        api_type:'html',
                        sortable: isSortable,
                        render: rowData => <Box color={this.rowColor(rowData)}>{rowData.stop_time || ""}</Box>
                    },
                    {
                        label: "Run(s)",
                        name: 'start_run_number', //type: html
                        api_type: 'html',
                        sortable: isSortable,
                        render: rowData => <Box color={this.rowColor(rowData)}>
                            {rowData.start_run_number}
                            {(rowData.start_run_number!==rowData.stop_run_number && rowData.stop_fill_number) &&
                                (<span> : {rowData.stop_run_number}</span>)}
                            </Box>
                    },
                    {
                        label: "Fill",
                        name: 'start_fill_number',
                        api_type: 'html',
                        sortable: isSortable,
                        render: rowData => <Box color={this.rowColor(rowData)}>
                            {rowData.start_fill_number}
                            {(rowData.start_fill_number!==rowData.stop_fill_number && rowData.stop_fill_number) &&
                            (<span> : {rowData.stop_fill_number}</span>)}
                            </Box>
                    },
                    {
                        label: "Lost lumi",
                        name: 'lost_lumi',
                        api_type: 'html',
                        sortable: false, //not supported by the DB view
                        render: rowData =>
                            <Box color={this.rowColor(rowData)}>
                                {rowData.lost_lumi > 0 ? rowData.lost_lumi : ""}
                                {
                                    (!isNaN(rowData.lost_lumi) && rowData.lost_lumi > 0)
                                    && rowData.hasOwnProperty("lost_lumi_units")
                                    && (<span dangerouslySetInnerHTML={{ __html: " "+katex.renderToString(rowData.lost_lumi_units) }} />)
                                }
                            </Box>
                    },
                    {
                        label: "Lost time",
                        name: 'lost_time_str',
                        api_type:'html',
                        sortable: isSortable,
                        render: rowData => <Box color={this.rowColor(rowData)}>{rowData.lost_time_str || ""}</Box>
                    },
                    {
                        label: "Group",
                        name: 'group_name',
                        api_type:'html',
                        sortable: isSortable,
                        render: rowData => <Box color={this.rowColor(rowData)}>{rowData.group_name}</Box>
                        //render: rowData => <Box color={rowData.group_name === "UNDECIDED" ? "error.main": ""}>{rowData.group_name}</Box>
                    },
                    {
                        label: "Category",
                        name: 'category_name',
                        api_type:'html',
                        sortable: isSortable,
                        render: rowData => <Box color={this.rowColor(rowData)}>{rowData.category_name}</Box>
                        //render: rowData => <Box color={rowData.category_name === "UNDECIDED" ? "error.main": ""}>{rowData.category_name}</Box>
                    },
                    {
                        label: "Subsystem",
                        name: 'subsystem_name',
                        api_type:'html',
                        sortable: isSortable,
                        render: rowData => <Box color={this.rowColor(rowData)}>{rowData.subsystem_name}</Box>
                        //render: rowData => <Box color={rowData.subsystem_name === "UNDECIDED" ? "error.main": ""}>{rowData.subsystem_name}</Box>
                    },

                    {
                        label: "Partition",
                        name: 'partition_name',
                        api_type:'html',
                        sortable: isSortable,
                        render: rowData => <Box color={this.rowColor(rowData)}>{rowData.partition_name}</Box>
                        //render: rowData => <Box color={rowData.partition_name === "UNDECIDED" ? "error.main": ""}>{rowData.partition_name}</Box>
                    },
                    {
                        label: "FED ID",
                        name: 'fed_name',
                        api_type:'html',
                        sortable: isSortable,
                        render: rowData => <Box color={this.rowColor(rowData)}>{rowData.fed_name === -1 ? "UNDECIDED": rowData.fed_name}</Box>
                        //render: rowData => <Box color={rowData.fed_name === -1 ? "error.main": ""}>{rowData.fed_name === -1 ? "UNDECIDED": rowData.fed_name}</Box>
                    },
                    {
                        label: "Details",
                        name: 'details',
                        api_type: 'html',
                        render: rowData => <HtmlTooltip
                            placement="left"
                            title={
                                <React.Fragment>
                                    <Typography color="inherit">Details</Typography>
                                    {rowData.details}
                                </React.Fragment>
                            }
                        >
                            <Box color={this.rowColor(rowData)}>
                                {
                                    (rowData.details != null) && rowData.details.length > 30 ?
                                    rowData.details.substr(0, 30) + "..." : rowData.details
                                }
                            </Box>
                        </HtmlTooltip>
                    }
                    ]}


                    query={this.props.query} 
                    urlParams={this.props.urlParams}

                    getEndpoint={(data_query) =>
                        {

                            let url = API_URL + "/downtimes?"

                            // Add pagination
                            url += 'page[size]=' + data_query.pageSize
                            url += '&page[number]=' + (data_query.page)
                            url += '&filter[enabled][EQ]=true'

                            //page changed, set timer to reset back to page 1 if in liveMode page
                            if (!ctrlData.fullMode && data_query.page && data_query.pageSize) {
                              if (data_query.page === 1 && this.resetPageCount !== 0) {
                                this.resetPageCount = 0
                                this.lastPage = 1;
                                this.lastPageSize = data_query.pageSize;
                              }
                              if (data_query.page !== 1 && (this.lastPage !== data_query.page || this.lastPageSize !==  data_query.pageSize)) {
                                this.resetPageCount = CHANGE_PAGE_RESET_INTS;
                                this.lastPage = data_query.page;
                                this.lastPageSize = data_query.pageSize;
                              }
                            }

                            const { stable_beams_only } = this.props.query;
                            if (stable_beams_only)
                              url += '&filter[stable_beams][EQ]=true' //not yet supported in CRUD API

                            // Add Date range filter
                            const { cms_date_to, cms_date_from } = this.props.query;
                            if (cms_date_to && cms_date_from) {
                                url += '&filter[start_time][GE]=' + cms_date_from + 'T00:00:00'
                                url += '&filter[stop_time][LE]=' + cms_date_to + 'T00:00:00'
                            }

                            // Add Fill range filter
                            const { start_fill_number, stop_fill_number } = this.props.query;
                            if (start_fill_number && stop_fill_number) {
                                url += '&filter[start_fill_number][GE]=' + start_fill_number
                                url += '&filter[stop_fill_number][LE]=' + stop_fill_number
                            }

                            // Add Fill range filter based on fill range from Era
                            const { cms_era_name } = this.props.query;
                            if (cms_era_name) {
                                const era = this.props.controllerExportData.eraMap[cms_era_name];
                                url += '&filter[start_fill_number][GE]=' + era.start_fill
                                if (era.end_fill)
                                    url += '&filter[stop_fill_number][LE]=' + era.end_fill
                            }

                            //sorting
                            if (data_query.orderBy === null) {
                                url+="&sort=-start_time";
                            }
                            else if (data_query.orderBy !== false)  {
                              if (data_query.orderBy === "lost_time_str") data_query.orderBy = "lost_time";
                              if (data_query.order === 'desc') url+='&sort=-'+data_query.orderBy;
                              else url+='&sort='+data_query.orderBy;
                            }

                            const { group_id, category_id, subsystem_id } = this.props.query;
                            const { groupNames, categoryNames, subsystemNames } = this.props.controllerExportData.nameMapping;

                            if (group_id)
                                url += '&filter[group_name][EQ]='+ groupNames[group_id];

                            if (category_id)
                                url += '&filter[category_name][EQ]='+ categoryNames[category_id];

                            if (subsystem_id)
                                url += '&filter[subsystem_name][EQ]='+ subsystemNames[subsystem_id];

                            if (this.state.show_pending_ack_only)
                                url += '&filter[acknowledged][EQ]=false'

                            //console.log("(DEBUG) URL: " + url)
                            return url;
                    }}

                    fetchData={(url) => 
                        new Promise((resolve, reject) => {
                            axios.get(url)
                                .then(response => {
                                    let result = response.data;
                                    var data = []
                                    if (result.data) {
                                        data = result.data.map(row => {
                                            var { attributes, meta } = row
                                            attributes["start_time"] = this.state.useUtc ?
                                                                         formatDatetimeUtc(new Date(attributes["start_time"]+"Z"))
                                                                         : formatDatetime(new Date(attributes["start_time"]+"Z"))
                                            attributes["stop_time"] = attributes.stop_time ? 
                                                                        this.state.useUtc ?
                                                                          formatDatetimeUtc(new Date(attributes["stop_time"]+"Z"))
                                                                          : formatDatetime(new Date(attributes["stop_time"]+"Z"))
                                                                      : "" 
                                            attributes["start_time_utc"] = formatDatetimeUtc(new Date(attributes["start_time"]+"Z"))
                                            //attributes["stop_time_utc"] = attributes.stop_time ? formatDatetimeUtc(new Date(attributes["stop_time"]+"Z")) : ""
                                            attributes["lost_lumi"] = prettyFloat(attributes.lost_lumi, 3)
                                            attributes["lost_time_str"] = attributes.lost_time? diffDatetime(0, attributes.lost_time) : ""
                                            attributes["comment_count"] = attributes.comments.length
                                            attributes.fill = attributes.fill || ""
                                            attributes.group_name = attributes.group_name || ""
                                            attributes.category_name = attributes.category_name || ""
                                            attributes.subsystem_name = attributes.subsystem_name || ""
                                            attributes.partition_name = attributes.partition_name || ""
                                            attributes.fed_name = attributes.fed_name || ""
                                            //attributes.id = row.id

                                            if (meta && meta.hasOwnProperty("units") && meta.units.hasOwnProperty("lost_lumi")) {
                                                attributes["lost_lumi_units"] = meta.units.lost_lumi
                                            }
                                            //return {attributes:attributes, id : row.id}
                                            return {attributes:attributes, id : attributes.downtimes_id}
                                        })
                                    }

                                    resolve({
                                        data: data,
                                        page: result.meta ? result.meta.page : 1,
                                        totalCount: result.meta ? result.meta.total_matches : 0
                                    })
                                })
                        })
                    }
                    postLoadData={this.postLoadData}
                    shouldUpdate={this.props.shouldUpdate}
                    onRowClick={this.handleRowChange}
                    renderCustomFilterInputs={this.renderCustomFilterInputs}
                    hideRowsPerPage={true}

                    configuration={this.props.configuration}
                    showLoader={this.props.showLoader}
                    hideLoader={this.props.hideLoader}
                    onFailure={this.props.onFailure}
                />
                {this.state.active_row &&
                <Paper square style={{ padding: 10, 'paddingRight': 10 }}>
                    <Tabs
                        value={this.state.active_tab}
                        indicatorColor="primary"
                        textColor="primary"
                        onChange={this.handleTabChange}
                        aria-label="disabled tabs example"
                    >
                        {/* <Tab value={-1} disabled /> */}
                        {(this.state.active_row) && (<Tab value={0} label="Comments" icon={<Comment />} />)}
                        {(ctrlData.isOperator) && (this.state.active_row) && (<Tab value={1} label="New Comment" icon={<AddBox />} />)}
                        {(ctrlData.isOperator) && (this.state.active_row) && (<Tab value={2} label="Split" icon={<CallSplit />} />)}
                        {(ctrlData.isAdmin) && (this.state.active_row) && this.state.active_row.children && (<Tab value={3} label="Undo Split" icon={<LowPriority />} />)}

                    </Tabs>

                    {(this.state.active_tab === 1) && (this.state.active_row) && (
                      <Box>
                        <React.Fragment>
                            <TextField

                                id="start_time"
                                label="Start time"
                                value={this.state.new_comment.start_time}
                                style={{ margin: 10 }}
                                variant="filled"
                                InputProps={{
                                    readOnly: true,
                                    disableUnderline: true
                                }}
                            />
                            <TextField
                                id="stop_time"
                                label="Stop time"
                                value={this.state.new_comment.stop_time}
                                style={{ margin: 10 }}
                                variant="filled"
                                InputProps={{
                                    readOnly: true,
                                    disableUnderline: true
                                }}
                            />
                            <TextField
                                id="duration"
                                label="Lost time"
                                value={this.state.new_comment.lost_time_str}
                                style={{ margin: 10 }}
                                variant="filled"
                                InputProps={{
                                    readOnly: true,
                                    disableUnderline: true
                                }}
                            />

                            <TextField
                                id="downtime_group"
                                select
                                label="Group"
                                style={{ margin: 10, width: '20ch' }}
                                value={this.state.new_comment.group_name}
                                variant="outlined"
                                onChange={this.handleGroupChange}
                                SelectProps={{
                                    native: true
                                }}
                                error={this.state.new_comment.group_name === "UNDECIDED"}
                                helperText={this.state.new_comment.group_name === "UNDECIDED" ? "Please select" : null}
                                disabled={!this.state.new_comment.category_valid || !this.state.new_comment.group_valid}
                            >
                                {false && <option aria-label="None" key="" value="" />}
                                {ctrlData.groupData && this.sortedDropdownText(this.state.new_comment.group_valid,ctrlData.groupData)}
                            </TextField>

                            <TextField
                                id="downtime_category"
                                select
                                label="Category"
                                style={{ margin: 10, width: '20ch' }}
                                value={this.state.new_comment.category_name}
                                onChange={this.handleCategoryChange}
                                variant="outlined"
                                SelectProps={{
                                    native: true
                                }}
                                error={this.state.new_comment.category_name === "UNDECIDED" || this.state.new_comment.category_name === ""}
                                helperText={this.state.new_comment.category_name === "UNDECIDED" ||  this.state.new_comment.category_name === "" ? "Please select" : null}
                                disabled={!this.state.new_comment.category_valid || !this.state.new_comment.group_valid}
                            >
                                <option aria-label="None" key="" value="" />
                                { selectedGroup && selectedGroup.attributes.categories &&
                                  this.sortedDropdownText(this.state.new_comment.category_valid, selectedGroup.attributes.categories)
                                }
                            </TextField>

                            <TextField
                                id="downtime_subsystem"
                                select
                                label="Subsystem"
                                style={{ margin: 10, width: '20ch' }}
                                value={this.state.new_comment.subsystem_name}
                                onChange={this.handleSubsystemChange}
                                variant="outlined"
                                SelectProps={{
                                    native: true
                                }}
                                error={this.state.new_comment.subsystem_name === "UNDECIDED"}
                                helperText={this.state.new_comment.subsystem_name === "UNDECIDED" ? "Please select" : null}
                                disabled={!this.state.new_comment.fed_valid || !this.state.new_comment.partition_valid || !this.state.new_comment.subsystem_valid}
                            >
                                {false && <option aria-label="None" key="" value="" />}
                                {ctrlData.subsystemData && this.sortedDropdownText(this.state.new_comment.subsystem_valid,ctrlData.subsystemData)}
                            </TextField>

                            <TextField
                                id="downtime_partition"
                                select
                                label="Partition"
                                style={{ margin: 10, width: '20ch' }}
                                value={this.state.new_comment.partition_name}
                                onChange={this.handlePartitionChange}
                                variant="outlined"
                                SelectProps={{
                                    native: true
                                }}
                                error={this.state.new_comment.partition_name === "UNDECIDED"}
                                helperText={this.state.new_comment.partition_name === "UNDECIDED" ? "Please select" : null}
                                disabled={!this.state.new_comment.fed_valid || !this.state.new_comment.partition_valid || !this.state.new_comment.subsystem_valid}
                            >
                                <option aria-label="None" key="" value="" />
                                { selectedSubsystem && selectedSubsystem.attributes.partitions &&
                                  this.sortedDropdownText(this.state.new_comment.partition_valid, selectedSubsystem.attributes.partitions)
                                }
                            </TextField>

                            <TextField
                                id="downtime_fed"
                                select
                                label="FED"
                                style={{ margin: 10 }}
                                value={this.state.new_comment.fed_name}
                                onChange={this.handleFedChange}
                                variant="outlined"
                                SelectProps={{
                                    native: true,
                                }}
                                error={this.state.new_comment.fed_name === "-1" || this.state.new_comment.fed_name === "0"}
                                helperText={this.state.new_comment.fed_name === "-1" || this.state.new_comment.fed_name === "0" ? "Please select" : null}
                                disabled={!this.state.new_comment.fed_valid || !this.state.new_comment.partition_valid || !this.state.new_comment.subsystem_valid}
                            >
                                <option aria-label="None" key={""} value={""} />
                                { selectedPartition && selectedPartition.attributes.fedid_to_id && selectedPartition.attributes.fedids_valid &&
                                      Object.keys(this.filterValidFeds(this.state.new_comment.fed_valid, selectedPartition.attributes.fedids_valid))
                                            .sort( (a, b) => parseInt(a.fedid) > parseInt(b.fedid) )
                                            .map( fedid => {
                                                const id = selectedPartition.attributes.fedid_to_id[fedid];
                                                return (
                                                    <option key={id} value={fedid}>
                                                        {fedid}
                                                    </option>
                                                )
                                            })
                                }
                            </TextField>
                        </React.Fragment>
                        <React.Fragment>
                          <Box style={{ 'paddingRight': 20 }}>
                            <TextField
                                id="prev_details"
                                label="Previous details"
                                value={this.state.new_comment.details}
                                style={{ margin: 10 }}
                                rowsMax={2}
                                multiline
                                fullWidth
                                variant="filled"
                                InputProps={{
                                    readOnly: true,
                                    disableUnderline: true
                                }}
                                InputLabelProps={{
                                    shrink: true
                                }}
                                onClick={
                                    () => {
                                        //if (this.details.length === 0) return;
                                        if (this.state.new_comment.details === undefined)
                                            return;
                                        this.new_details_ref.current.value = this.state.new_comment.details;
                                        this.details =  this.state.new_comment.details;
                                    }
                                }
                            />
                            <TextField
                                inputRef={this.new_details_ref}
                                id="new_details"
                                label="New details"
                                placeholder="Enter new details or click on previous details to copy"
                                style={{ margin: 10 }}
                                rowsMax={5}
                                multiline
                                fullWidth
                                required
                                variant="outlined"
                                InputLabelProps={{
                                    shrink: true
                                }}
                                onChange={(e) => { this.details = e.target.value; }}
                            />
                          </Box>
                        </React.Fragment>

                        <React.Fragment>
                        <Button
                            color="primary"
                            onClick={this.handleNewComment}>
                            Save new comment
                        </Button>
                        </React.Fragment>

                    </Box>
                    )}

                    {/* Comments */}
                    {(this.state.active_tab === 0) && (<div>

                        <TableContainer style={{ maxHeight: (this.props.portletHeight - 350 - 150) }}>
                            <Table stickyHeader aria-label="sticky table" size="small">
                                <TableHead>
                                    {this.state.active_row &&
                                    <TableRow>
                                        <StyledTableCell>Selected</StyledTableCell>
                                        <StyledTableCell>Comment ID</StyledTableCell>
                                        <StyledTableCell>Source time</StyledTableCell>
                                        <StyledTableCell>Source</StyledTableCell>
                                        <StyledTableCell>Group</StyledTableCell>
                                        <StyledTableCell>Subsystem</StyledTableCell>
                                        <StyledTableCell>Category</StyledTableCell>
                                        <StyledTableCell>Partition</StyledTableCell>
                                        <StyledTableCell>FED ID</StyledTableCell>
                                        <StyledTableCell>Details</StyledTableCell>
                                    </TableRow>
                                    }
                                </TableHead>
                                <TableBody>
                                    {this.state.active_row &&
                                        (this.state.active_row.comments.map((comment) => (

                                            <TableRow key={comment.attributes.comment_id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={
                                                            this.state.custom_comment_id ?
                                                                comment.attributes.comment_id === this.state.custom_comment_id :
                                                                comment.attributes.comment_id === this.state.active_row.comment_id
                                                        }
                                                        onChange={event => this.handleCommentRowChange(event, comment.attributes)}
                                                        disabled={!this.props.controllerExportData.isOperator}
                                                    />
                                                </TableCell>
                                                <TableCell>{comment.attributes.comment_id}</TableCell>
                                                <TableCell>
                                                    {this.state.useUtc ?
                                                        formatDatetimeUtc(new Date(comment.attributes.source_time+"Z"))
                                                        : formatDatetime(new Date(comment.attributes.source_time+"Z"))
                                                    }
                                                </TableCell>
                                                <TableCell>{comment.attributes.source}</TableCell>
                                                <TableCell>{comment.attributes.group_name}</TableCell>
                                                <TableCell>{comment.attributes.subsystem_name}</TableCell>
                                                <TableCell>{comment.attributes.category_name}</TableCell>
                                                <TableCell>{comment.attributes.partition_name}</TableCell>
                                                <TableCell>{comment.attributes.fed_name === -1 ? "UNDECIDED": comment.attributes.fed_name }</TableCell>
                                                <TableCell>{comment.attributes.details}</TableCell>
                                            </TableRow>
                                        )))
                                    }
                                </TableBody>
                            </Table>
                        </TableContainer>

                    </div>)}

                    {this.state.active_tab === 0 && this.state.active_row && !this.state.active_row.comments.length &&
                         <div>
                             <Box
                                 style={styles.textBox}
                                 display="flex"
                                 justifyContent="center" >
                                 <Typography variant="body1">Downtime has no comments</Typography>
                             </Box>
                         </div>
                    }

                    {/* Split */}
                    {(this.state.active_tab === 2) && (<div>
                        {this.state.active_row && (
                            <Grid container spacing={5} style={{ padding: 10 }}>
                                <Grid item xs={6}>
                                    <TableContainer component={Paper}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <StyledTableCell></StyledTableCell>
                                                    <StyledTableCell>Start time</StyledTableCell>
                                                    <StyledTableCell>Stop time</StyledTableCell>
                                                    <StyledTableCell>Group</StyledTableCell>
                                                    <StyledTableCell>Category</StyledTableCell>
                                                    <StyledTableCell>Subsystem</StyledTableCell>
                                                    <StyledTableCell>Partition</StyledTableCell>
                                                    <StyledTableCell>Duration</StyledTableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell>Downtime#1</TableCell>
                                                    <TableCell>{this.state.active_row.start_time}</TableCell>
                                                    <TableCell>{this.state.downtime_split_time}</TableCell>
                                                    <TableCell>{this.state.active_row.group_name}</TableCell>
                                                    <TableCell>{this.state.active_row.category_name}</TableCell>
                                                    <TableCell>{this.state.active_row.subsystem_name}</TableCell>
                                                    <TableCell>{this.state.active_row.partition_name}</TableCell>
                                                    <TableCell><b>{this.state.downtime1_duration}</b></TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>Downtime#2</TableCell>
                                                    <TableCell>{this.state.downtime_split_time}</TableCell>
                                                    <TableCell>{this.state.active_row.stop_time}</TableCell>
                                                    <TableCell>{this.state.active_row.group_name}</TableCell>
                                                    <TableCell>{this.state.active_row.category_name}</TableCell>
                                                    <TableCell>{this.state.active_row.subsystem_name}</TableCell>
                                                    <TableCell>{this.state.active_row.partition_name}</TableCell>
                                                    <TableCell><b>{this.state.downtime2_duration}</b></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Grid>
                                {(this.state.active_row.lost_time === 1) && (
                                    <Typography>
                                        Downtime is too short to be split
                                    </Typography>
                                )}
                                {(this.state.active_row.lost_time > 1) && (
                                    <Grid item xs={6}>
                                        <Typography>
                                            Length of first downtime in seconds
                                    </Typography>

                                        <TextField
                                            id="outlined-basic"
                                            label="SECONDS"
                                            variant="outlined"
                                            margin="normal"
                                            value={this.state.downtime_split_seconds}
                                            style={{ width: 250 }}
                                            onChange={this.handleSplitInputChange}
                                            inputProps={{
                                                step: 1,
                                                min: 1,
                                                max: this.state.active_row.lost_time - 1,
                                                type: 'number'
                                            }}
                                        />

                                        <Divider component={'br'} />
                                        <Button
                                            color="secondary"
                                            onClick={this.handleSplit}>
                                            Split
                                        </Button>
                                    </Grid>
                                )}
                            </Grid>
                        )}
                    </div>)}
                    {/* Undo Split */}
                    {(this.state.active_tab === 3) && (this.state.active_row) && (<div>
                        <Grid container spacing={5} style={{ padding: 10 }}>
                            <Grid item xs={8}>
                                <TableContainer style={{ maxHeight: (this.props.portletHeight - 350 - 150) }}>
                                    <Table stickyHeader aria-label="sticky table">
                                        <TableHead>
                                            <TableRow>
                                                <StyledTableCell>Start time</StyledTableCell>
                                                <StyledTableCell>Stop time</StyledTableCell>
                                                <StyledTableCell>Lost time</StyledTableCell>
                                                <StyledTableCell>Lost lumi</StyledTableCell>
                                                <StyledTableCell>Group</StyledTableCell>
                                                <StyledTableCell>Category</StyledTableCell>
                                                <StyledTableCell>Subsystem</StyledTableCell>
                                                <StyledTableCell>Partition</StyledTableCell>
                                                <StyledTableCell>FED ID</StyledTableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {this.state.active_row &&
                                                (this.state.active_row.children.map((child) => (
                                                    <TableRow key={child.id}>
                                                        <TableCell>{child.attributes.start_time.replace("T", " ")}</TableCell>
                                                        <TableCell>{child.attributes.stop_time.replace("T", " ")}</TableCell>
                                                        <TableCell>{diffDatetime(0, child.attributes.duration)}</TableCell>
                                                        <TableCell>{child.attributes.lost_lumi}</TableCell>
                                                        <TableCell>{child.attributes.group_name}</TableCell>
                                                        <TableCell>{child.attributes.category_name}</TableCell>
                                                        <TableCell>{child.attributes.subsystem_name}</TableCell>
                                                        <TableCell>{child.attributes.partition_name}</TableCell>
                                                        <TableCell>{child.attributes.fed_name}</TableCell>
                                                    </TableRow>
                                                )))
                                            }
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography>
                                    <b>IMPORTANT</b>
                                    <Divider component={'br'} />
                                    - Selected downtime will be re-enabled
                                    <Divider component={'br'} />
                                    - Both child Downtimes will be DELETED
                                    <Divider component={'br'} />
                                    - All Shift Leader comments created for child Downtimes will be DELETED
                                    <Divider component={'br'} />
                                    <Divider component={'br'} />
                                    Do you wish to continue?
                                </Typography>

                                <Divider component={'br'} />
                                <Button
                                    color="secondary"
                                    onClick={this.handleUndoSplit}>
                                    Undo Split
                                        </Button>
                            </Grid>
                        </Grid>

                    </div>)}

                </Paper> }
            </div >
        );
    }
}

export default DowntimesPanel;
