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
		marginTop: 10,
		forcePopupIcon: 'auto'
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



class TrackerHMBatchController extends Component {

	static controllerHeight = 400;

	constructor() {
		super();
		this.state = {
			errMessage: '',
			barcodeTypes: [],
			fluteTypes: [],
			structureTypes: [],
			configTypes: [],
			setTypes: [],
			url: '',
			loading: false,
			tab: "simple",
			kindOfHM: "All",
			batchLimits: [0, 0],
			batchRange: [0, 0],
			selectedBatch: "",
			DialogOpen: false
		}
	}

	static controllerInit(urlQuery, controller) {

		let urlMetadata = controller.configuration.urlMetadata;//"trker_int2r.c13560";
		let barcodeType = '',
			lastBarcodeType = '',
			id = '';
		let fluteType = '',
			lastFluteType = '';
		let structureType = '',
			lastStructureType = '';
		let configType = '',
			lastConfigType = '';
		let setType = '',
			lastSetType = '';
		let run = '',
			runs = [];
		let runTypeNumber = '';
		let filterBy = 'runType';
		let selectedIds = [];
		let initialData = [];
		let initData = () => {

			return {
				data: {
					runs: runs
				},
				exportData: {
					tracker_data: initialData
				},
				state: {
					tracker_fluteType: fluteType,
					tracker_hmStructType: structureType,
					tracker_hmConfigType: configType,
					tracker_hmSetType: setType,
					tracker_id: id,
					filterBy: filterBy
				}
			}
		}

		let {
			url
		} = controller.configuration;

		return Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_FLUTE_ID FROM " + urlMetadata + " t ", null, null, null, RESTHUB_URL)
			.then(resp => {
				const respData = resp.data.data;
				const fluteTypes = respData.length ? respData.map(s => s.kindOfHmFluteId) : null;
				lastFluteType = fluteTypes ? fluteTypes[0] : null;
				fluteType = "";
				return Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_STRUCT_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + fluteType + "'", null, null, null, RESTHUB_URL)
					.then(resp => {
						const respData = resp.data.data;
						const structureTypes = respData.length ? respData.map(s => s.kindOfHmStructId) : null;
						lastStructureType = structureTypes ? structureTypes[0] : null;
						structureType = ""//this.fullscreen ? lastStructureType : null
						return Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_CONFIG_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + structureType + "'", null, null, null, RESTHUB_URL)
							.then(resp => {
								const respData = resp.data.data;
								const configTypes = respData.length ? respData.map(s => s.kindOfHmConfigId) : null;
								lastConfigType = configTypes ? configTypes[0] : null;
								configType = ""//this.fullscreen ? lastConfigType : null
								return Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_SET_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + structureType + "'AND t.KIND_OF_HM_CONFIG_ID = '" + configType + "'", null, null, null, RESTHUB_URL)
									.then(resp => {
										const respData = resp.data.data;
										const setTypes = respData.length ? respData.map(s => s.kindOfHmSetId) : null;
										lastSetType = setTypes ? setTypes[0] : null;
										setType = ""//this.fullscreen ? lastSetType : null
										return initData();
									})
							})
					})
			}).catch(err => initData());
	}

	static controllerQueryTitle(state) {
		return `${state.tracker_fluteType}/${state.tracker_hmStructType}`;
	}

	/*fetchRunNames = (barcodeType, fluteType, structureType, configType, setType) => {

		let emptyRuns = () => {
			let {
				controllerData
			} = this.props;
			controllerData.runs = [];
			this.props.updateControllerData(controllerData);
			let {
				controllerState
			} = this.props;
			controllerState.tracker_runTypeNumber = [];
			this.props.updateState(controllerState);
		}

		let urlMetadata = this.props.configuration.urlMetadata;// "trker_cmsr.c8920";//"trker_int2r.c13560";
		let urlDatasets = this.props.configuration.urlDatasets;
		let urlRuns = this.props.configuration.urlRuns//"trker_cmsr.runs";
		return Resthub.json2("SELECT DISTINCT r.run_number, r.name FROM " + urlRuns + " r, " + urlDatasets + " d, " + urlMetadata + " m where m.part_barcode='" + barcodeType + "' and m.kind_of_hm_flute_id = '" + fluteType + "' and m.KIND_OF_HM_STRUCT_ID= '" + structureType + "' AND m.KIND_OF_HM_CONFIG_ID = '" + configType + "' AND m.KIND_OF_HM_SET_ID = '" + setType + "'  and m.condition_data_set_id = d.id and d.run_id=r.id ", null, null, null, RESTHUB_URL)
			.then(response => {
				const runs = response.data.data;
				this.updateRuns(runs);
			}).catch(err => emptyRuns());
	}*/

	validateFluteType = (fluteType) => {
		return this.state.fluteTypes.find(s => s === fluteType);
	}

	onFluteTypeChange = (searchText, index) => {
		const fluteType = this.validateFluteType(searchText);
		if (!fluteType) return;
		this.updateFlute(fluteType);
		let urlMetadata = this.props.configuration.urlMetadata;// "trker_cmsr.c8920";//"trker_int2r.c13560";

		Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_STRUCT_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + fluteType + "' ", null, null, null, RESTHUB_URL)
			.then(response => {
				const structureTypes = response.data.data;
				this.setState({
					structureTypes: structureTypes.map(s => s.kindOfHmStructId),
					errMessage: ''
				});
			});
		return;
	}

	updateFlute = fluteType => {
		let {
			controllerState
		} = this.props;
		controllerState.tracker_fluteType = fluteType;
		controllerState.tracker_hmStructType = "";
		controllerState.tracker_hmConfigType = "";
		controllerState.tracker_hmSetType = "";
		this.props.updateState(controllerState);
		//Empty the list of Batch as it is related to a given structure
		this.onIDReset();
	}

	validateStructureType = (structureType) => {
		return this.state.structureTypes.find(s => s === structureType);
	}

	onStructureTypeChange = (searchText, index) => {
		const structureType = this.validateStructureType(searchText);
		if (!structureType) return;
		this.updateStructure(structureType);

		let urlMetadata = this.props.configuration.urlMetadata;
		Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_CONFIG_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + structureType + "'", null, null, null, RESTHUB_URL)
			.then(response => {
				const configTypes = response.data.data.map(s => s.kindOfHmConfigId);
				configTypes.push("All")
				this.setState({
					configTypes: configTypes,
					errMessage: ''
				});
			});
		return;
	}

	updateStructure = structureType => {
		let {
			controllerState
		} = this.props;
		controllerState.tracker_hmStructType = structureType;
		controllerState.tracker_hmConfigType = "";
		controllerState.tracker_hmSetType = "";
		this.props.updateState(controllerState);

		//Empty the list of Batch as it is related to a given structure
		this.onIDReset();
	}

	//config

	validateConfigType = (configType) => {
		return this.state.configTypes.find(s => s === configType);
	}

	onConfigTypeChange = (searchText, index) => {
		const configType = this.validateConfigType(searchText);
		if (!configType) return;
		this.updateConfig(configType);
		let urlMetadata = this.props.configuration.urlMetadata;

		let sql = "SELECT DISTINCT t.KIND_OF_HM_SET_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + this.props.controllerState.tracker_hmStructType + "' AND t.KIND_OF_HM_CONFIG_ID = '" + this.props.controllerState.tracker_hmConfigType + "'"
		if (this.props.controllerState.tracker_hmConfigType == "All") { sql = "SELECT DISTINCT t.KIND_OF_HM_SET_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + this.props.controllerState.tracker_hmStructType + "'" }
		Resthub.json2(sql, null, null, null, RESTHUB_URL)

			//Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_SET_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + this.props.controllerState.tracker_hmStructType + "'" + " AND t.KIND_OF_HM_CONFIG_ID = '" + this.props.controllerState.tracker_hmConfigType + "'", null, null, null, RESTHUB_URL)
			.then(response => {
				const setTypes = response.data.data.map(s => s.kindOfHmSetId);
				setTypes.push("All")
				this.setState({
					setTypes: setTypes,//.map(s => s.kindOfHmSetId),
					errMessage: ''
				});
			});
		return;
	}

	updateConfig = configType => {
		let {
			controllerState
		} = this.props;
		controllerState.tracker_hmConfigType = configType;
		controllerState.tracker_hmSetType = "";
		this.props.updateState(controllerState);
	}

	validateSetType = (setType) => {
		return this.state.setTypes.find(s => s === setType);
	}

	onSetTypeChange = (searchText, index) => {
		const setType = this.validateSetType(searchText);
		if (!setType) return;
		this.updateSet(setType);

		let urlMetadata = this.props.configuration.urlMetadata;//"trker_cmsr.c8920";//"trker_int2r.c13560";
		let sql = "SELECT DISTINCT t.PART_BARCODE FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + this.props.controllerState.tracker_hmStructType + "'"
		if (setType != "All") { sql = sql + " AND t.KIND_OF_HM_SET_ID = '" + setType + "'" }
		if (this.props.controllerState.tracker_hmConfigType != "All") { sql = sql + " AND t.KIND_OF_HM_CONFIG_ID = '" + this.props.controllerState.tracker_hmConfigType + "'" }

		

		Resthub.json2(sql, null, null, null, RESTHUB_URL)
			.then(response => {
				const barcodeList = response.data.data;
				var minRange = barcodeList[0].partBarcode.split('_')[0];
				var maxRange = barcodeList[barcodeList.length - 1].partBarcode.split('_')[0];
				this.setState({
					batchLimits: [parseInt(minRange), parseInt(maxRange)],
					batchRange: [parseInt(minRange), parseInt(maxRange)],
					errMessage: ''
				});
			});
		return;
	}

	updateSet = setType => {
		let {
			controllerState
		} = this.props;
		controllerState.tracker_hmSetType = setType;
		this.props.updateState(controllerState);
	}

	onFluteTypeUpdate = (searchText) => {
		this.updateFlute(searchText);
		let urlMetadata = this.props.configuration.urlMetadata;
		let Upper_searchText = searchText.toUpperCase()
		Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_FLUTE_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID LIKE  '%" + Upper_searchText + "%' ", null, null, null, RESTHUB_URL)
			.then(response => {
				const fluteTypes = response.data.data;
				this.setState({
					fluteTypes: fluteTypes.map(s => s.kindOfHmFluteId),
					errMessage: ''
				});
			});
	}

	onStructureTypeUpdate = (searchText) => {
		this.updateStructure(searchText);
		let urlMetadata = this.props.configuration.urlMetadata;
		let Upper_searchText = searchText.toUpperCase()
		Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_STRUCT_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType + "' AND t.KIND_OF_HM_STRUCT_ID LIKE '%" + Upper_searchText + "%' ", null, null, null, RESTHUB_URL)
			.then(response => {
				const structureTypes = response.data.data;
				this.setState({
					structureTypes: structureTypes.map(s => s.kindOfHmStructId),
					errMessage: ''
				});
			});
	}

	onConfigTypeUpdate = (searchText) => {
		this.updateConfig(searchText);
		let urlMetadata = this.props.configuration.urlMetadata;
		let Upper_searchText = (searchText[0] == "r" || searchText[0] == "s") ? searchText[0].toUpperCase() + searchText.substring(1).toLowerCase() : searchText.toLowerCase()

		//let Upper_searchText = searchText.toUpperCase()
		//console.log(Upper_searchText)
		Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_CONFIG_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + this.props.controllerState.tracker_hmStructType + "' AND  t.KIND_OF_HM_CONFIG_ID LIKE '%" + Upper_searchText + "%' ", null, null, null, RESTHUB_URL)
			.then(response => {
				console.log(response)
				const configTypes = response.data.data.map(s => s.kindOfHmConfigId);
				configTypes.push("All")
				this.setState({
					configTypes: configTypes,
					errMessage: ''
				});
			});
	}

	onSetTypeUpdate = (searchText) => {
		//Set is not a string in the DB, it need to be handle with care here
		this.updateSet(searchText);
		let urlMetadata = this.props.configuration.urlMetadata;
		let Upper_searchText = (searchText[0] == "l" || searchText[0] == "r") ? searchText[0].toUpperCase() + searchText.substring(1).toLowerCase() : searchText.toLowerCase()
		let sql = "SELECT DISTINCT t.KIND_OF_HM_SET_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + this.props.controllerState.tracker_hmStructType + "' AND t.KIND_OF_HM_CONFIG_ID = '" + this.props.controllerState.tracker_hmConfigType + "' AND  t.KIND_OF_HM_SET_ID LIKE '%" + Upper_searchText + "%' "
		if (this.props.controllerState.tracker_hmConfigType == "All") { sql = "SELECT DISTINCT t.KIND_OF_HM_SET_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + this.props.controllerState.tracker_hmStructType + "' AND  t.KIND_OF_HM_SET_ID LIKE '%" + Upper_searchText + "%' " }
		Resthub.json2(sql, null, null, null, RESTHUB_URL)
			.then(response => {
				const setTypes = response.data.data.map(s => s.kindOfHmSetId);
				setTypes.push("All")
				this.setState({
					setTypes: setTypes,
					errMessage: ''
				});
			});
	}


	//Filter at the level of SQL ... need improvment.. So far only restrict search to the next power of 10
	getBatchNumbers = (minRange, maxRange) => {
		let urlMetadata = this.props.configuration.urlMetadata;

		let rangeSearch = maxRange.toString().slice(0, maxRange.toString().length - (1 + (maxRange - minRange).toString().length));

		let sql = "SELECT DISTINCT t.PART_BARCODE FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType
		sql = sql + "' AND t.KIND_OF_HM_STRUCT_ID = '" + this.props.controllerState.tracker_hmStructType
		if (this.props.controllerState.tracker_hmConfigType != "All") sql = sql + "' AND t.KIND_OF_HM_CONFIG_ID = '" + this.props.controllerState.tracker_hmConfigType
		if (this.props.controllerState.tracker_hmSetType != "All") sql = sql + "' AND t.KIND_OF_HM_SET_ID = '" + this.props.controllerState.tracker_hmSetType
		sql = sql + "' and t.PART_BARCODE LIKE" + " '" + rangeSearch + "%' " + "ORDER BY t.PART_BARCODE "

		
		return Resthub.json2(sql, null, null, null, RESTHUB_URL)
			.then(response => {
				//This line creates a list of unique batches number
				let batchNumbersList = [...new Set(response.data.data.map(s => s.partBarcode.split('_')[0]))].filter(s => (s >= minRange && s <= maxRange));
				return batchNumbersList;
			}).catch(error => this.props.onFailure(error));
	}

	getBarcodeAndRun = (batchNumber) => {
		let urlMetadata = this.props.configuration.urlMetadata;
		let urlDatasets = this.props.configuration.urlDatasets;
		let urlRuns = this.props.configuration.urlRuns;
		let condition_tables = this.props.configuration.condition_tables.split(',');

		let sqlRun = "SELECT m.part_barcode,m.kind_of_hm_set_id, m.kind_of_hm_config_id, r.run_number, da.kind_of_condition_id FROM " + urlRuns + " r, " + urlDatasets + " d, " + urlDatasets + " da, " + urlMetadata + " m "
			+ "where m.part_barcode  LIKE '" + batchNumber + "%"
			+ "' AND m.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType
			+ "' AND m.KIND_OF_HM_STRUCT_ID = '" + this.props.controllerState.tracker_hmStructType + "'";

		if (this.props.controllerState.tracker_hmConfigType != "All") { sqlRun = sqlRun + " AND m.KIND_OF_HM_CONFIG_ID = '" + this.props.controllerState.tracker_hmConfigType + "'" }
		if (this.props.controllerState.tracker_hmSetType != "All") { sqlRun = sqlRun + " AND m.KIND_OF_HM_SET_ID = '" + this.props.controllerState.tracker_hmSetType + "'" }

		sqlRun = sqlRun + "  and m.condition_data_set_id = d.id and d.run_id=r.id ";
		sqlRun = sqlRun + "and d.run_id= da.run_id"
		sqlRun = sqlRun + " and ("
		condition_tables.map((cond,index) => index==0 ? sqlRun = sqlRun + "da.kind_of_condition_id='"+cond+"'" : sqlRun = sqlRun + " or da.kind_of_condition_id='"+cond+"'");
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

	/*
getBarcodeAndRun = (batchNumber) => {
		let urlMetadata = this.props.configuration.urlMetadata;
		let urlDatasets = this.props.configuration.urlDatasets;
		let urlRuns = this.props.configuration.urlRuns;

		let sqlRun = "SELECT m.part_barcode,m.kind_of_hm_set_id, m.kind_of_hm_config_id, r.run_number FROM " + urlRuns + " r, " + urlDatasets + " d, " + urlMetadata + " m "
			+ "where m.part_barcode  LIKE '" + batchNumber + "%"
			+ "' AND m.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType
			+ "' AND m.KIND_OF_HM_STRUCT_ID = '" + this.props.controllerState.tracker_hmStructType + "'";

		if (this.props.controllerState.tracker_hmConfigType != "All") { sqlRun = sqlRun + " AND m.KIND_OF_HM_CONFIG_ID = '" + this.props.controllerState.tracker_hmConfigType + "'" }
		if (this.props.controllerState.tracker_hmSetType != "All") { sqlRun = sqlRun + " AND m.KIND_OF_HM_SET_ID = '" + this.props.controllerState.tracker_hmSetType + "'" }

		sqlRun = sqlRun + "  and m.condition_data_set_id = d.id and d.run_id=r.id ";
		sqlRun = sqlRun + "ORDER BY m.part_barcode";
		console.log(sqlRun)

		return Resthub.json2(sqlRun, null, null, null, RESTHUB_URL)
			.then(response => {
				let barcodeList1 = [];
				for (var item in response.data.data) {
					barcodeList1.push({
						barcode: response.data.data[item].partBarcode,
						runNumber: response.data.data[item].runNumber,
						Config: response.data.data[item].kindOfHmConfigId,
						Set: response.data.data[item].kindOfHmSetId
					})
				}
				let filteredBarcodeList = this.filterKindOfHM(barcodeList1);
				return filteredBarcodeList;
			});

	}
	*/

	filterKindOfHM = (barcodeList) => {
		
		let filteredBarcodeList = (this.state.kindOfHM != "All") ? barcodeList.filter(item => item.barcode.split('_')[2] == this.state.kindOfHM) : barcodeList;
		
		return filteredBarcodeList;
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

	onBatchAdd = () => {
		let {
			controllerExportData
		} = this.props;
		this.setState({ loading: true });
		let tracker_data_list = [];
		this.getBatchNumbers(this.state.batchRange[0], this.state.batchRange[1])
			.then((batchNumbersList) => {
				
				const promises = [];
				batchNumbersList.map((c) => {
					promises.push(this.getBarcodeAndRun(c))
				})

				Promise.all(promises)
					.then(results => {
						let barcodeList = [];
						barcodeList = results.filter(item => item.length > 0);
						return barcodeList.map(s => {
							if (barcodeList.length > 0 && s.length && !controllerExportData.tracker_data.find(item => item.tracker_id.split(' ')[1] === (s[0].barcode.split('_')[0])) && s.length > 0) {
								const batchName = (this.state.kindOfHM == "All") ? "Batch " + s[0].barcode.split('_')[0] + " (" + s[0].barcode.split('_')[2] + ")" : "Batch " + s[0].barcode.split('_')[0] + " (" + this.state.kindOfHM + ")";
								controllerExportData.tracker_data.push({
									tracker_id: batchName,
									barcodeRunList: this.filterRuns(s)
								})

							}
						}
						)
					}).then(() => {
						this.props.updateControllerData(controllerExportData);
						this.setState({ loading: false });
					});


			})
	}

	onIDDelete = (value) => {
		let {
			controllerExportData, controllerData
		} = this.props;
		let update_tracker_data = [];
		update_tracker_data = controllerExportData.tracker_data.filter(item => item.tracker_id !== value);
		controllerExportData.tracker_data = update_tracker_data;
		this.props.updateControllerData(controllerData);
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

	onInspectBatch = (value) => {
		if (this.state.selectedBatch != "") this.setState({ DialogOpen: true })
	}

	onCloseInspectBatch = (value) => {
		this.setState({ DialogOpen: false })
	}

	renderChip = () => {
		let {
			controllerExportData
		} = this.props;
		return (controllerExportData.tracker_data.map(e => {
			var colormode = "default"
			if (this.state.selectedBatch == e.tracker_id) { colormode = "primary" }
			return (
				<Chip
					color={colormode}
					key={e.tracker_id + "folder"}
					icon={<FolderIcon />}
					label={e.tracker_id}
					onDelete={() => this.onIDDelete(e.tracker_id)}
					className={this.props.classes.chip}
					onClick={() => this.handleClickChip(e.tracker_id)}
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
		const maxRange = this.state.batchRange[1];
		if (parseInt(event.target.value) <= maxRange && (parseInt(event.target.value)) >= this.state.batchLimits[0]) { this.setState({ batchRange: [parseInt(event.target.value), maxRange] }) };
	}

	handleTextMaxChange = (event) => {
		const minRange = this.state.batchRange[0];
		if (parseInt(event.target.value) >= minRange && (parseInt(event.target.value)) <= this.state.batchLimits[1]) this.setState({ batchRange: [minRange, parseInt(event.target.value)] });
	}

	handleSliderChange = (event, newValue) => {
		this.setState({ batchRange: newValue });
	};

	handleTypeChange = (event) => {
		this.setState({ kindOfHM: event.target.value });
	};

	render() {
		const { classes } = this.props;
		return (
			<div >
				<div>
					<AutoComplete
						label='Flute (start typing: PQC)'
						value={this.props.controllerState.tracker_fluteType}
						suggestions={this.state.fluteTypes}
						onInputChange={this.onFluteTypeUpdate}
						onValueChange={this.onFluteTypeChange}
						style={styles.autoComplete}
						maxSearchResults={300}
						openOnFocus={true}
						listStyle={{ maxHeight: 300, overflow: 'auto' }}
					/>
					<AutoComplete
						isOpen={true}
						label='Structure'
						value={this.props.controllerState.tracker_hmStructType}
						suggestions={this.state.structureTypes}
						onInputChange={this.onStructureTypeUpdate}
						onValueChange={this.onStructureTypeChange}
						style={styles.autoComplete}
						maxSearchResults={300}
						openOnFocus={true}
						listStyle={{ maxHeight: 300, overflow: 'auto' }}
						maxItems={30}
					/>
					<AutoComplete
						label='Config'
						value={this.props.controllerState.tracker_hmConfigType}
						suggestions={this.state.configTypes}
						onInputChange={this.onConfigTypeUpdate}
						onValueChange={this.onConfigTypeChange}
						style={styles.autoComplete}
						maxSearchResults={300}
						openOnFocus={true}
						listStyle={{ maxHeight: 300, overflow: 'auto' }}
					/>
					<AutoComplete
						label='Set'
						value={this.props.controllerState.tracker_hmSetType}
						suggestions={this.state.setTypes}
						onInputChange={this.onSetTypeUpdate}
						onValueChange={this.onSetTypeChange}
						style={styles.autoComplete}
						maxSearchResults={300}
						openOnFocus={true}
						listStyle={{ maxHeight: 300, overflow: 'auto' }}
					/>
					<div>

						<Typography id="range-slider" gutterBottom style={{ marginTop: 20 }}>
							Batch range to be added:
						</Typography>


						<Input
							value={this.state.batchRange[0]}
							//margin="dense"
							label="Adjust max."
							onChange={this.handleTextMinChange}
							//style={{ marginLeft: 20, marginTop: -40, maxWidth: 60 }}
							inputProps={{
								step: 1,
								min: this.state.batchLimits[0],
								max: this.state.batchLimits[1],
								type: 'number',
								'aria-labelledby': 'input-slider',
							}}
						/>

						<Slider
							value={this.state.batchRange}
							style={{ marginLeft: 20, marginTop: 30, marginBottom: -20, maxWidth: 600 }}
							onChange={this.handleSliderChange}
							valueLabelDisplay="auto"
							aria-labelledby="range-slider"
							getAriaValueText={this.valuetext}
							valueLabelDisplay="on"
							min={this.state.batchLimits[0]}
							max={this.state.batchLimits[1]}
						/>


						<Input
							value={this.state.batchRange[1]}
							margin="dense"
							label="Adjust max."
							onChange={this.handleTextMaxChange}
							style={{ marginLeft: 20, marginTop: -40, maxWidth: 60 }}
							inputProps={{
								step: 1,
								min: this.state.batchLimits[0],
								max: this.state.batchLimits[1],
								type: 'number',
								'aria-labelledby': 'input-slider',
							}}
						/>

						<FormControl style={{ margin: 10, minWidth: 120, marginTop: 2 }} >

							<InputLabel id="select type of batch">Kind of HM</InputLabel>
							<Select
								labelId="demo-simple-select-label"
								id="demo-simple-select"
								value={this.state.kindOfHM}
								onChange={this.handleTypeChange}
							>
								<MenuItem value={"All"}>All</MenuItem>
								<MenuItem value={"PSS"}>PSS</MenuItem>
								<MenuItem value={"PSP"}>PSP</MenuItem>
								<MenuItem value={"2-S"}>2-S</MenuItem>
							</Select>
						</FormControl>

						<Button
							//disabled={this.props.controllerState.tracker_runName === '' 
							//&& this.props.controllerState.tracker_runTypeNumber === ''}
							style={{ marginLeft: 20, marginTop: -10 }}
							variant="contained"
							className={classes.button}
							onClick={this.onBatchAdd}>
							Add batches
						</Button>
						{this.renderLoading()}
					</div>



					<br />
					<div>
						<Typography variant="subtitle2" gutterBottom style={{ marginTop: 0 }}>
							Selected batches:
						</Typography>
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
							Inspect Batch
						</Button>
						<Dialog onClose={this.onCloseInspectBatch} open={this.state.DialogOpen} style={{ minWidth: 700 }}>
							<DialogTitle>Components of {this.state.selectedBatch} :</DialogTitle>
							<List sx={{ pt: 0 }}>
								{this.props.controllerExportData.tracker_data.filter((batch) => batch.tracker_id == this.state.selectedBatch).map((batch) => batch.barcodeRunList.map(item =>
									<ListItem key={item.runNumber}>
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
export default withStyles(styles)(TrackerHMBatchController);
