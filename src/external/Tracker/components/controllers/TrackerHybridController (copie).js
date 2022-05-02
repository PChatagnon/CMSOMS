import React, {
	Component
}
	from 'react';
import {
	withStyles
}
	from '@material-ui/core/styles';
import AutoComplete from '../../../../components/generic/Autocomplete';


import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import Resthub from '../../../../components/providers/Resthub';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControl from '@material-ui/core/FormControl';
import Radio from '@material-ui/core/Radio';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Chip from '@material-ui/core/Chip';
import FaceIcon from '@material-ui/icons/Face';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import Slider from '@material-ui/core/Slider';
import FolderIcon from '@material-ui/icons/Folder';
import CircularProgress from '@material-ui/core/CircularProgress';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';



const styles = {
	radioGroup: {
		float: 'left',
		maxWidth: 170,
		minWidth: 160,
	},
	radioButton: {
		marginTop: 20
	},
	inputContainer: {
		display: 'inline-block',
		maxWidth: 700,
		minWidth: 400,
	},
	textField: {
		width: 300,
		fontSize: 14
	},
	inputField: {
		display: 'inline-block',
		marginLeft: 10,
		marginRight: 10,
		marginTop: 5,
		verticalAlign: 'top',
		width: 200
	},
	autocomplete: {
		marginTop: 30,
		margin: 10
	},
	itemMenu: {
		width: 200,
	},
	selectField: {
		marginTop: 10,
		width: 200
	},
	optionsContainer: {
		marginLeft: 30,
		marginTop: 10,
		display: 'inline-block',
		verticalAlign: 'top',
		maxWidth: 1000,
		minWidth: 300
	},
	button: {
		marginLeft: 10,
		marginTop: 10
	}
}

const RESTHUB_URL = '/tracker-resthub';



class TrackerHybridController extends Component {


	static hybrid_conditions_DB = {
		"2SFE": "c9800",
		"PSFE": "c9820",
		"2SSH": "",
		"PSROH": "c9840",
		"PSPOH": ""
	};

	static hybrid_part_DB = {
		"2SFE": "p6640",
		"PSFE": "p6740",
		"2SSH": "p6660",
		"PSROH": "p6760",
		"PSPOH": "p6780"
	};

	static controllerHeight = 450;

	constructor() {
		super();
		this.state = {
			errMessage: '',
			url: '',
			loading: false,
			tab: "simple",
			kindOfModule: "All",
			kindOfModule_List: [],
			kindOfHybrid: "All",
			kindOfHybrid_List: [],
			spacingOfHybrid: "All",
			spacing_List: [],
			sideOfModule: "All",
			sideOfModule_List: [],
			batchOfHybrid: "All",
			batch_List: ["All"],
			contractorOfHybrid: "All",
			serialNumbersOfHybrids: [],
			availableHybrids: [],
			serialNumbersRange: [0, 10],
			serialNumbersLimits: [0, 10],
			selectedBatch: "",
			DialogOpen: false,
			DisplayHybridList: false
		}
	}

	static controllerInit(urlQuery, controller) {

		let urlMetadata = controller.configuration.urlMetadata;

		let mode_inConfig = controller.configuration.mode;

		let id = 0;
		let module_type = mode_inConfig.length ? mode_inConfig.split('_')[0] : "2S";
		let hybrid_type = mode_inConfig.length ? mode_inConfig.split('_')[1] : "FE";
		let run = '',
			runs = [];
		let initialData = [];
		const serialNumbersLimits = [];
		const serialNumbersRange = [];

		let part_DB = controller.configuration.part_tables[module_type + "_" + hybrid_type];
		console.log("this.controller")
		console.log(controller)


		let initData = () => {

			return {
				data: {
					runs: runs
				},
				exportData: {
					tracker_data: initialData,
					tracker_moduleType: module_type,
					tracker_hybridType: hybrid_type,
					limitrangeup: 150,
					limitrangedown: 145
				},
				state: {
					tracker_moduleType: module_type,
					tracker_hybridType: hybrid_type,
					tracker_id: id
				}
			}
		}

		return Resthub.json2("SELECT h.SERIAL_NUMBER FROM trker_cmsr.p" + controller.configuration.part_tables[module_type + "_" + hybrid_type] + " h", null, null, null, RESTHUB_URL)
			.then(resp => {
				const serialNumbersOfHybrids = resp.data.data.map(s => s.serialNumber).filter(s => typeof (s) != "undefined").map(s => s.substring(12, s.length)).map(s => parseInt(s)).filter(s => !isNaN(s)).sort(function(a, b){return a-b})
				const serialNumbersLimits = [serialNumbersOfHybrids[0], serialNumbersOfHybrids[serialNumbersOfHybrids.length - 1]]
				const serialNumbersRange = [serialNumbersOfHybrids[0], serialNumbersOfHybrids[serialNumbersOfHybrids.length - 1]]
				console.log("intitialisation of the controller")
				console.log(resp)
				console.log(serialNumbersLimits)
				//Add here initialization if necessary
				console.log("this.state")
				console.log(this.controller)
				this.setState({
					serialNumbersRange: serialNumbersLimits,
					serialNumbersLimits: serialNumbersLimits
				});

				return initData();
			}).catch(err => initData());
	}

	static controllerQueryTitle(state) {
		return `${state.tracker_moduleType}/${state.tracker_hybridType}`;
	}

	//////////////////////Batch render\\\\\\\\\\\\\\\\\\\\\\

	fetchBatchNumbers = () => {

		let emptyBatch = () => {
			let {
				controllerData
			} = this.props;
			controllerData.runs = [];
			this.props.updateControllerData(controllerData);
			let {
				controllerState
			} = this.props;
			controllerState.tracker_hmRunNumber = [];
			this.props.updateState(controllerState);
		}

		let part_DB = this.props.configuration.part_tables[this.props.controllerState.tracker_moduleType + "_" + this.props.controllerState.tracker_hybridType];

		let search_string = "'%"
		if (this.props.controllerState.tracker_moduleType != "All") search_string += this.props.controllerState.tracker_moduleType
		if (this.props.controllerState.tracker_hybridType != "All") search_string += "%" + this.props.controllerState.tracker_hybridType
		if (this.state.spacingOfHybrid != "All") search_string += "%" + this.state.spacingOfHybrid.replace('.', '')
		if (this.state.sideOfModule != "All") search_string += "%" + this.state.sideOfModule
		search_string += "%-%' "

		let sql = "SELECT DISTINCT h.BATCH_NUMBER FROM trker_cmsr.p" + part_DB + " h "
		sql += " where h.SERIAL_NUMBER LIKE " + search_string
		if (this.state.contractorOfHybrid != "All") sql += " AND h.MANUFACTURER = '" + this.state.contractorOfHybrid + "'"

		return Resthub.json2(sql, null, null, null, RESTHUB_URL)
			.then(response => {
				const batches = response.data.data;
				this.updateBatch(batches);
			}).catch(err => emptyBatch());
	}


	updateBatch = (batchs) => {
		var batch_List = batchs.map(s => s.batchNumber).filter(s => typeof (s) != "undefined")
		batch_List.unshift("All");

		//console.log(batch_List)

		this.setState({
			batch_List: batch_List,
			errMessage: ''
		});
	}

	/////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

	//working version
	getHybridSerialNumber = () => {
		let part_DB = this.props.configuration.part_tables[this.props.controllerState.tracker_moduleType + "_" + this.props.controllerState.tracker_hybridType];

		let search_string = "'%"
		if (this.props.controllerState.tracker_moduleType != "All") search_string += this.props.controllerState.tracker_moduleType
		if (this.props.controllerState.tracker_hybridType != "All") search_string += "%" + this.props.controllerState.tracker_hybridType
		if (this.state.spacingOfHybrid != "All") search_string += "%" + this.state.spacingOfHybrid.replace('.', '')
		if (this.state.sideOfModule != "All") search_string += "%" + this.state.sideOfModule
		search_string += "%-%' "

		let sql = "SELECT h.SERIAL_NUMBER,h.BATCH_NUMBER FROM trker_cmsr.p" + part_DB + " h "
		sql += " where h.SERIAL_NUMBER LIKE " + search_string
		if (this.state.contractorOfHybrid != "All") sql += " AND h.MANUFACTURER = '" + this.state.contractorOfHybrid + "'"
		if (this.state.batchOfHybrid != "All" && this.state.batchOfHybrid != "") sql += " AND h.BATCH_NUMBER = '" + this.state.batchOfHybrid + "'"

		console.log("I'm here")
		return Resthub.json2(sql, null, null, null, RESTHUB_URL)
			.then(response => {
				const serial_numbers = response.data.data;
				console.log("serial_numbers")
				console.log(serial_numbers)
				this.getRunNumbers(serial_numbers)
				//this.updateSerialNumbers(serial_numbers);
			}).catch(err => emptyBatch());
	}

	getRunNumbers = (hybridList) => {
		let urlDatasets = this.props.configuration.urlDatasets;
		let urlRuns = this.props.configuration.urlRuns;
		let part_DB = this.props.configuration.part_tables[this.props.controllerState.tracker_moduleType + "_" + this.props.controllerState.tracker_hybridType];
		let cond_DB = this.props.configuration.condition_tables[this.props.controllerState.tracker_moduleType + "_" + this.props.controllerState.tracker_hybridType];



		let sql = "SELECT h.SERIAL_NUMBER, r.run_number FROM trker_cmsr.p" + part_DB + " h," + urlRuns + " r, " + urlDatasets + " d, trker_cmsr.c" + cond_DB + " c "
		sql += " where ("
		hybridList.map((s, index) => {
			sql += " h.SERIAL_NUMBER='" + s.serialNumber+"'" ;
			if (index == hybridList.length - 1) { sql += ")" }
			else sql += " or ";
		})
		sql += " and c.PART_SERIAL_NUMBER=h.serial_number and c.condition_data_set_id = d.id and d.run_id=r.id ORDER BY h.serial_number"

		console.log("sql")
		console.log(sql)

		return Resthub.json2(sql, null, null, null, RESTHUB_URL)
			.then(response => {
				const run_list = response.data.data;
				console.log("serial_numbers after run selection")
				console.log(run_list.sort(function (a, b) { return b.runNumber - a.runNumber }))
				hybridList.map(s => {
					//sort run_list so the highest run number is taken
					if(typeof(run_list.find( serialnumber_run => (serialnumber_run.serialNumber == s.serialNumber)))!='undefined'){
						var matching_serial_number = run_list.find( serialnumber_run => (serialnumber_run.serialNumber == s.serialNumber));
						console.log(matching_serial_number.runNumber)
						s.runNumber = matching_serial_number.runNumber;
					}
					else s.runNumber = 'undefined';
				})
				
				console.log(hybridList)
				this.updateSerialNumbers(hybridList);

			}).catch(err => emptyBatch());
	}


	validateSerialNumber = (serial_number) => {
		var initSerialNumber = ['2SFEH', '2SSEH', 'PSPOH', 'PSROH', 'PSFEH']
		return initSerialNumber.includes(serial_number.substring(0, 5));

	}


	updateSerialNumbers = (serial_numbers) => {

		var availableHybrids = serial_numbers.filter(s => this.validateSerialNumber(s.serialNumber))
		var serialNumbersOfHybrids = serial_numbers.map(s => s.serialNumber).filter(s => typeof (s) != "undefined").map(s => s.substring(12, s.length)).map(s => parseInt(s)).filter(s => !isNaN(s)).sort(function (a, b) { return a - b })


		this.setState({
			availableHybrids: availableHybrids,
			serialNumbersOfHybrids: serialNumbersOfHybrids
		},
			() => { this.updateSlider(); this.fetchBatchNumbers(); console.log(this.state) }
		);
	}

	updateSlider = () => {
		this.setState({
			serialNumbersLimits: [this.state.serialNumbersOfHybrids[0], this.state.serialNumbersOfHybrids[this.state.serialNumbersOfHybrids.length - 1]],
			serialNumbersRange: [this.state.serialNumbersOfHybrids[0], this.state.serialNumbersOfHybrids[this.state.serialNumbersOfHybrids.length - 1]]
		});
	}

	getBarcodeAndRun = (serial_number) => {
		let urlDatasets = this.props.configuration.urlDatasets;
		let urlRuns = this.props.configuration.urlRuns;

		let part_DB = this.props.configuration.part_tables[this.props.controllerState.tracker_moduleType + "_" + this.props.controllerState.tracker_hybridType];
		let cond_DB = this.props.configuration.condition_tables[this.props.controllerState.tracker_moduleType + "_" + this.props.controllerState.tracker_hybridType];

		let sqlRun = "SELECT m.part_barcode,m.kind_of_hm_set_id, m.kind_of_hm_config_id, r.run_number, da.kind_of_condition_id FROM " + urlRuns + " r, " + urlDatasets + " d, " + urlDatasets + " da, " + urlMetadata + " m "
			+ "where m.part_barcode  LIKE '" + batchNumber + "%"
			+ "' AND m.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType
			+ "' AND m.KIND_OF_HM_STRUCT_ID = '" + this.props.controllerState.tracker_hmStructType + "'";

		if (this.props.controllerState.tracker_hmConfigType != "All") { sqlRun = sqlRun + " AND m.KIND_OF_HM_CONFIG_ID = '" + this.props.controllerState.tracker_hmConfigType + "'" }
		if (this.props.controllerState.tracker_hmSetType != "All") { sqlRun = sqlRun + " AND m.KIND_OF_HM_SET_ID = '" + this.props.controllerState.tracker_hmSetType + "'" }

		sqlRun = sqlRun + "  and m.condition_data_set_id = d.id and d.run_id=r.id ";
		sqlRun = sqlRun + "and d.run_id= da.run_id"
		sqlRun = sqlRun + " and ("
		condition_tables.map((cond, index) => index == 0 ? sqlRun = sqlRun + "da.kind_of_condition_id='" + cond + "'" : sqlRun = sqlRun + " or da.kind_of_condition_id='" + cond + "'");
		sqlRun = sqlRun + ")"
		sqlRun = sqlRun + " ORDER BY m.part_barcode";

		return Resthub.json2(sqlRun, null, null, null, RESTHUB_URL)
			.then(response => {
				let barcodeList1 = [];
				for (var item in response.data.data) {
					barcodeList1.push({
						barcode: response.data.data[item].partBarcode,
						runNumber: response.data.data[item].runNumber,
						Config: response.data.data[item].kindOfHmConfigId,
						Set: response.data.data[item].kindOfHmSetId,
						Condition_ID: response.data.data[item].kindOfConditionId
					})
				}
				let filteredBarcodeList = this.filterKindOfHM(barcodeList1);
				return filteredBarcodeList;
			});

	}


	filterRuns = (barcodeList) => { //Filter the last run available for a given barcode, set and config. Handles "All" cases for Config and Set.

		let filteredList = [];

		for (var item in barcodeList) {
			var index_l = filteredList.findIndex((item_f) => (item_f.barcode == barcodeList[item].barcode && item_f.Config == barcodeList[item].Config && item_f.Set == barcodeList[item].Set && item_f.Condition_ID == barcodeList[item].Condition_ID && item_f.runNumber < barcodeList[item].runNumber))
			var index_h = filteredList.findIndex((item_f) => (item_f.barcode == barcodeList[item].barcode && item_f.Config == barcodeList[item].Config && item_f.Set == barcodeList[item].Set && item_f.Condition_ID == barcodeList[item].Condition_ID && item_f.runNumber > barcodeList[item].runNumber))
			if (index_l > -1) {
				filteredList.splice(index_l, 1);


				filteredList.push({
					barcode: barcodeList[item].barcode,
					runNumber: barcodeList[item].runNumber,
					Config: barcodeList[item].Config,
					Set: barcodeList[item].Set,
					Condition_ID: barcodeList[item].Condition_ID
				})

			}
			else if (index_h == -1) {
				// Add only if new or of run number is higher than current filter
				filteredList.push({
					barcode: barcodeList[item].barcode,
					runNumber: barcodeList[item].runNumber,
					Config: barcodeList[item].Config,
					Set: barcodeList[item].Set,
					Condition_ID: barcodeList[item].Condition_ID
				})
			}

		}
		return filteredList;
	}

	writeHybridList = () => {

		let HybridList = []
		this.setState({ loading: true });
		this.state.availableHybrids.filter(s => (parseInt(s.serialNumber.substring(12, s.length).replace(/^0+/, ''))) >= this.state.serialNumbersRange[0] && parseInt(s.serialNumber.substring(12, s.length).replace(/^0+/, '')) <= this.state.serialNumbersRange[1]).forEach(s => {
			HybridList.push({
				serial_number: s.serialNumber,
				batch_number: s.batchNumber,
				run_number: s.runNumber
			})
		})
		//console.log("HybridList");
		//console.log(HybridList);

		return HybridList;
	}

	onBatchAdd = () => {
		let {
			controllerExportData
		} = this.props;


		var HybridList = this.writeHybridList()

		HybridList.map(s => {
			if (HybridList.length > 0 && !controllerExportData.tracker_data.find(item => item.serial_number === (s.serial_number))) {
				controllerExportData.tracker_data.push(s)
			}
		})
		this.props.updateControllerData(controllerExportData);

		let {
			controllerState
		} = this.props;

		controllerState.tracker_id = controllerState.tracker_id + 1;
		this.props.updateState(controllerState);
		this.setState({ loading: false });



	}

	onIDDelete = (value) => {
		let {
			controllerExportData, controllerData
		} = this.props;
		let update_tracker_data = [];
		update_tracker_data = controllerExportData.tracker_data.filter(item => item.serial_number !== value);
		controllerExportData.tracker_data = update_tracker_data;
		this.props.updateControllerData(controllerExportData);

		let {
			controllerState
		} = this.props;

		controllerState.tracker_id = controllerState.tracker_id + 1;
		this.props.updateState(controllerState);
	}

	onIDReset = () => {
		let {
			controllerExportData, controllerData
		} = this.props;
		let update_tracker_data = [];
		controllerExportData.tracker_data = update_tracker_data;
		this.props.updateControllerData(controllerData);
	}

	handleClickChip = (value) => {
		this.setState({ selectedBatch: value })
	}

	onExcludeUntested = () => {
		let {
			controllerExportData
		} = this.props;
		let update_tracker_data = controllerExportData.tracker_data.filter(s => (s.run_number!='undefined'));
		controllerExportData.tracker_data = update_tracker_data;
		this.props.updateControllerData(controllerExportData)
	}

	onInspectBatch = (value) => {
		console.log(this.props)
		if (this.state.selectedBatch != "") this.setState({ DialogOpen: true })
	}

	onCloseInspectBatch = (value) => {
		this.setState({ DialogOpen: false })
	}

	onDisplayHybridList = () => {
		if (!this.state.DisplayHybridList)this.setState({ DisplayHybridList: true })
		else this.setState({ DisplayHybridList: false })
	}

	DisplayHybridListText = () => {
		if (!this.state.DisplayHybridList)return "Display hybrid list"
		else return "Hide hybrid list"
		
	}

	renderChip = () => {
		let {
			controllerExportData
		} = this.props;
		console.log("HERE")

		if(!this.state.DisplayHybridList){return;}

		return (controllerExportData.tracker_data.map(e => {
			var colormode = "default"
			var variantmode = "default"
			if (this.state.selectedBatch == e.serial_number && e.run_number=="undefined") { variantmode = "outlined" }
			if (this.state.selectedBatch == e.serial_number && e.run_number!="undefined") { variantmode = "outlined" /*colormode = "primary"*/ }
			if (e.run_number=="undefined") { colormode = "secondary" }
			return (
				<Chip
					color={colormode}
					variant={variantmode}
					key={e.serial_number}
					label={e.serial_number}
					onDelete={() => this.onIDDelete(e.serial_number)}
					className={this.props.classes.chip}
					onClick={() => this.handleClickChip(e.serial_number)}
				/>
			);
		})
		)
	}

	renderLoading = () => {
		if (this.state.loading) {
			return (
				<CircularProgress
					style={{ marginLeft: 20, marginTop: -40 }}
				/>
			)
		}
		else return;
	}

	handleTextMinChange = (event) => {
		const maxRange = this.state.serialNumbersRange[1];
		if (parseInt(event.target.value) <= maxRange && (parseInt(event.target.value)) >= this.state.serialNumbersLimits[0]) { this.setState({ serialNumbersRange: [parseInt(event.target.value), maxRange] }) };
	}

	handleTextMaxChange = (event) => {
		const minRange = this.state.serialNumbersRange[0];
		if (parseInt(event.target.value) >= minRange && (parseInt(event.target.value)) <= this.state.serialNumbersLimits[1]) this.setState({ serialNumbersRange: [minRange, parseInt(event.target.value)] });
	}

	handleSliderChange = (event, newValue) => {
		this.setState({ serialNumbersRange: newValue });
	};

	handleModuleChange = (event) => {
		let {
			controllerState, controllerExportData
		} = this.props;
		controllerState.tracker_moduleType = event.target.value;
		controllerExportData.tracker_moduleType = event.target.value;
		this.props.updateControllerData(controllerExportData)
		this.props.updateState(controllerState,
			() => { this.fetchBatchNumbers(); this.getHybridSerialNumber() }
		);
	};

	handleHybridChange = (event) => {
		let {
			controllerState, controllerExportData
		} = this.props;
		controllerState.tracker_hybridType = event.target.value;
		controllerExportData.tracker_hybridType = event.target.value;
		this.props.updateControllerData(controllerExportData)
		this.props.updateState(controllerState,
			() => { this.fetchBatchNumbers(); this.getHybridSerialNumber() }
		);
	};

	handleSpacingChange = (event) => {
		this.setState(
			{ spacingOfHybrid: event.target.value },
			() => { this.fetchBatchNumbers(); this.getHybridSerialNumber() }
		)


	};

	handleSideChange = (event) => {
		this.setState({ sideOfModule: event.target.value },
			() => { this.fetchBatchNumbers(); this.getHybridSerialNumber() }
		);
	};

	handleContractorChange = (event) => {
		this.setState({ contractorOfHybrid: event.target.value },
			() => { this.fetchBatchNumbers(); this.getHybridSerialNumber() }
		);
		console.log(this.props.controllerExportData)
	};

	handleBatchChange = (event) => {
		this.setState({ batchOfHybrid: event.target.value },
			() => { this.getHybridSerialNumber() }
		);
	};

	enableModuleHybrid = () => {
		let display = ((this.props.configuration.mode.length) > 0);
		return display;
	};


	renderSpacingList = () => {
		var spacings = ['4.0', '2.6', '1.8'];
		var spacings_2S = ['4.0', '1.8'];
		var spacings_PS = ['4.0', '2.6', '1.8'];

		if (this.props.controllerState.tracker_moduleType == "2S") {
			spacings = spacings_2S
		} else if (this.props.controllerState.tracker_moduleType == "PS") {
			spacings = spacings_PS;
		}
		return (
			<Select
				labelId="demo-simple-select-label"
				id="demo-simple-select"
				value={this.state.spacingOfHybrid}
				onChange={this.handleSpacingChange}
			>
				<MenuItem key="All" value={"All"}>All</MenuItem>
				{spacings.map((spacing, index) =>
					<MenuItem key={spacing} value={spacing}>  {spacing} mm  </MenuItem>
				)}
			</Select>
		);
	}


	renderHybridList = () => {

		var hybrids = ['FE', 'SH', 'POH', 'ROH'];
		var hybrids_2S = ['FE', 'SH'];
		var hybrids_PS = ['FE', 'POH', 'ROH'];

		if (this.props.controllerState.tracker_moduleType == "2S") {
			hybrids = hybrids_2S
		} else if (this.props.controllerState.tracker_moduleType == "PS") {
			hybrids = hybrids_PS;
		}

		return (
			<Select
				labelId="demo-simple-select-label"
				id="demo-simple-select"
				disabled={this.enableModuleHybrid()}
				value={this.props.controllerState.tracker_hybridType}
				onChange={this.handleHybridChange}
			>
				{hybrids.map((hybrid, index) =>
					<MenuItem key={hybrid} value={hybrid}>  {hybrid}  </MenuItem>
				)}
			</Select>
		)
	}

	renderBatchList = () => {

		return this.state.batch_List.map((batch, index) => {
			return <MenuItem key={batch} value={batch}>  {batch}  </MenuItem>
		})
	}




	render() {
		const { classes } = this.props;
		return (
			<div >
				<div>

					<FormControl style={{ margin: 10, minWidth: 120, marginTop: 2 }} >
						<InputLabel id="select type of batch">Kind of Module</InputLabel>
						<Select
							labelId="demo-simple-select-label"
							id="demo-simple-select"
							value={this.props.controllerState.tracker_moduleType}
							onChange={this.handleModuleChange}
							disabled={this.enableModuleHybrid()}
						>
							<MenuItem key={"2S"} value={"2S"}>2S</MenuItem>
							<MenuItem key={"PS"} value={"PS"}>PS</MenuItem>
						</Select>
					</FormControl>

					<FormControl style={{ margin: 10, minWidth: 120, marginTop: 2 }} >
						<InputLabel id="select type of batch">Kind of Hybrid</InputLabel>
						{this.renderHybridList()}
					</FormControl>

					<FormControl style={{ margin: 10, minWidth: 120, marginTop: 2 }} >
						<InputLabel id="select type of batch">Spacing</InputLabel>
						{this.renderSpacingList()}
					</FormControl>


					<FormControl style={{ margin: 10, minWidth: 120, marginTop: 2 }} >
						<InputLabel id="select type of batch">Side</InputLabel>
						<Select
							labelId="demo-simple-select-label"
							id="demo-simple-select"
							value={this.state.sideOfModule}
							onChange={this.handleSideChange}
						>
							<MenuItem key={"All"} value={"All"}>All</MenuItem>
							<MenuItem key={"L"} value={"L"}>Left</MenuItem>
							<MenuItem key={"R"} value={"R"}>Right</MenuItem>
						</Select>
					</FormControl>



					<div>

						<FormControl style={{ margin: 10, minWidth: 120, marginTop: 2 }} >
							<InputLabel id="select type of batch">Contractor</InputLabel>
							<Select
								labelId="demo-simple-select-label"
								id="demo-simple-select"
								value={this.state.contractorOfHybrid}
								onChange={this.handleContractorChange}
							>
								<MenuItem key={"All"} value={"All"}>All</MenuItem>
								<MenuItem key={"Valtronic"} value={"Valtronic"}>Valtronic</MenuItem>
								<MenuItem key={"AEMTEC"} value={"AEMTEC"}>AEMTEC</MenuItem>
							</Select>
						</FormControl>


						<FormControl style={{ margin: 10, minWidth: 120, marginTop: 2 }} >
							<InputLabel id="select type of batch">Batch</InputLabel>
							<Select
								labelId="demo-simple-select-label"
								id="demo-simple-select"
								value={this.state.batchOfHybrid}
								abled={(this.state.batchOfHybrid.length > 0).toString()}
								onChange={this.handleBatchChange}
							>
								{this.renderBatchList()}
							</Select>

						</FormControl>

					</div>

					<div>

						<Typography id="range-slider" gutterBottom style={{ marginTop: 20 }}>
							Available hybrid numbers:
						</Typography>


						<Input
							value={this.state.serialNumbersRange[0]}
							label="Adjust max."
							onChange={this.handleTextMinChange}
							inputProps={{
								step: 1,
								min: this.state.serialNumbersLimits[0],
								max: this.state.serialNumbersLimits[1],
								type: 'number',
								'aria-labelledby': 'input-slider',
							}}
						/>

						<Slider
							key='slider'
							value={this.state.serialNumbersRange}
							style={{ marginLeft: 20, marginTop: 30, marginBottom: -20, maxWidth: 600 }}
							onChange={this.handleSliderChange}
							valueLabelDisplay="auto"
							aria-labelledby="range-slider"
							valueLabelDisplay="on"
							marks={this.state.serialNumbersOfHybrids}
							min={this.state.serialNumbersLimits[0]}
							max={this.state.serialNumbersLimits[1]}
						/>


						<Input
							value={this.state.serialNumbersRange[1]}
							margin="dense"
							label="Adjust max."
							onChange={this.handleTextMaxChange}
							style={{ marginLeft: 20, marginTop: -40, maxWidth: 60 }}
							inputProps={{
								step: 1,
								min: this.state.serialNumbersLimits[0],
								max: this.state.serialNumbersLimits[1],
								type: 'number',
								'aria-labelledby': 'input-slider',
							}}
						/>



						<Button
							//disabled={this.props.controllerState.tracker_runName === '' 
							//&& this.props.controllerState.tracker_runTypeNumber === ''}
							style={{ marginLeft: 20, marginTop: -10 }}
							variant="contained"
							className={classes.button}
							onClick={this.onBatchAdd}>
							Add hybrids
						</Button>
						{this.renderLoading()}
					</div>



					<br />
					<div>
						<Button
							//disabled={this.props.controllerState.tracker_runName === '' 
							//&& this.props.controllerState.tracker_runTypeNumber === ''}
							style={{ marginLeft: 10, marginTop: 10, marginBottom: 10 }}
							variant="contained"
							className={classes.button}
							onClick={this.onDisplayHybridList}>
							{this.DisplayHybridListText()}
						</Button>
						
						<div style={styles.wrapper}>
							{this.renderChip()}
						</div>
						<Button
							//disabled={this.props.controllerState.tracker_runName === '' 
							//&& this.props.controllerState.tracker_runTypeNumber === ''}
							style={{ marginLeft: 10, marginTop: 10, marginBottom: 10 }}
							variant="contained"
							className={classes.button}
							onClick={this.onInspectBatch}>
							Inspect hybrid
						</Button>
						<Button
							//disabled={this.props.controllerState.tracker_runName === '' 
							//&& this.props.controllerState.tracker_runTypeNumber === ''}
							style={{ marginLeft: 10, marginTop: 10, marginBottom: 10 }}
							variant="contained"
							className={classes.button}
							onClick={this.onExcludeUntested}>
							Exclude untested hybrids
						</Button>
						<Dialog onClose={this.onCloseInspectBatch} open={this.state.DialogOpen} style={{ minWidth: 700 }}>
							<DialogTitle>{this.state.selectedBatch} info:</DialogTitle>
							<List sx={{ pt: 0 }}>
								{this.props.controllerExportData.tracker_data.filter((batch) => batch.tracker_id == this.state.selectedBatch).map((batch) => batch.barcodeRunList.map(item, index =>
									<ListItem key={index}>
										<ListItemText primary={"Barcode: " + item.barcode + ", Run: " + item.runNumber + ", Config: " + item.Config + ", Set: " + item.Set} />
									</ListItem>
								))}
							</List>
						</Dialog>
					</div>
				</div>
			</div >
		);
	}
}
export default withStyles(styles)(TrackerHybridController);

//<Typography variant="subtitle2" gutterBottom style={{ marginTop: 0 }}>
						//	Selected hybrids (untested hybrids in red):
						//</Typography>