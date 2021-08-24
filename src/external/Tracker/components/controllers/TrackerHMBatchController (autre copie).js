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
//import WebIcon from '@material-ui/icons/Web';
//import InsertChartIcon from '@material-ui/icons/InsertChart';
//import FormatQuotetIcon from '@material-ui/icons/FormatQuote';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Slider from '@material-ui/core/Slider';
import FolderIcon from '@material-ui/icons/Folder';
import ListSubheader from '@material-ui/core/ListSubheader';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Collapse from '@material-ui/core/Collapse';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import DraftsIcon from '@material-ui/icons/Drafts';
import SendIcon from '@material-ui/icons/Send';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import StarBorder from '@material-ui/icons/StarBorder';
import CircularProgress from '@material-ui/core/CircularProgress';


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
		marginTop: 10
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
			batchLimits: [34230, 34451],//[12340, 12348],//
			batchRange: [34350, 34351]//[12340, 12348]//
		}
	}

	static controllerInit(urlQuery, controller) {

		let urlMetadata = "trker_int2r.c13560";
		let urlDatasets = "trker_int2r.datasets";
		let urlRuns = "trker_int2r.runs";
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
		//let runTypeNumbers = [];
		let filterBy = 'runType';
		let selectedIds = [];
		let initData = () => {
			//this.initBatchRange();

			return {
				data: {
					runs: runs
				},
				state: {
					tracker_fluteType: fluteType,
					tracker_hmStructType: structureType,
					tracker_hmConfigType: configType,
					tracker_hmSetType: setType,
					tracker_data: selectedIds,
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
				fluteType = "PQC";//lastFluteType ? lastFluteType : null;
				//console.log("HERE flute type " + fluteType+ " "+this.setState.fluteTypes[0]);
				return Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_STRUCT_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + fluteType + "'", null, null, null, RESTHUB_URL)
					.then(resp => {
						const respData = resp.data.data;
						const structureTypes = respData.length ? respData.map(s => s.kindOfHmStructId) : null;
						lastStructureType = structureTypes ? structureTypes[0] : null;
						structureType = "";//lastStructureType ? lastStructureType : null
						console.log("structure type " + structureType);
						return Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_CONFIG_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + fluteType + "'AND t.KIND_OF_HM_STRUCT_ID = '" + structureType + "'", null, null, null, RESTHUB_URL)
							.then(resp => {
								const respData = resp.data.data;
								const configTypes = respData.length ? respData.map(s => s.kindOfHmConfigId) : null;
								lastConfigType = configTypes ? configTypes[0] : null;
								configType = "";//lastConfigType ? lastConfigType : null
								console.log("config type " + configType);
								return Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_SET_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + fluteType + "'AND t.KIND_OF_HM_STRUCT_ID = '" + structureType + "'AND t.KIND_OF_HM_CONFIG_ID = '" + configType + "'", null, null, null, RESTHUB_URL)
									.then(resp => {
										const respData = resp.data.data;
										const setTypes = respData.length ? respData.map(s => s.kindOfHmSetId) : null;
										lastSetType = setTypes ? setTypes[0] : null;
										setType = "";//lastSetType ? lastSetType : null
										console.log("set type " + setType);
										return initData();
									})
							})
					})
			}).catch(err => initData());
	}

	static controllerQueryTitle(state) {
		//return `HM Barcode:   ${state.tracker_partBarcode}`;
		return `${state.tracker_fluteType}/${state.tracker_hmStructType}`;
	}

	fetchRunNames = (barcodeType, fluteType, structureType, configType, setType) => {

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

		let urlMetadata = "trker_int2r.c13560";
		let urlDatasets = "trker_int2r.datasets";
		let urlRuns = "trker_int2r.runs";
		return Resthub.json2("SELECT DISTINCT r.run_number, r.name FROM " + urlRuns + " r, " + urlDatasets + " d, " + urlMetadata + " m where m.part_barcode='" + barcodeType + "' and m.kind_of_hm_flute_id = '" + fluteType + "' and m.KIND_OF_HM_STRUCT_ID= '" + structureType + "' AND m.KIND_OF_HM_CONFIG_ID = '" + configType + "' AND m.KIND_OF_HM_SET_ID = '" + setType + "'  and m.condition_data_set_id = d.id and d.run_id=r.id ", null, null, null, RESTHUB_URL)
			.then(response => {
				const runs = response.data.data;
				this.updateRuns(runs);
			}).catch(err => emptyRuns());
	}

	validateFluteType = (fluteType) => {
		return this.state.fluteTypes.find(s => s === fluteType);
	}

	onFluteTypeChange = (searchText, index) => {
		const fluteType = this.validateFluteType(searchText);
		if (!fluteType) return;
		this.updateFlute(fluteType);

		let urlMetadata = "trker_int2r.c13560";
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
		this.props.updateState(controllerState);
	}

	validateStructureType = (structureType) => {
		return this.state.structureTypes.find(s => s === structureType);
	}

	onStructureTypeChange = (searchText, index) => {
		const structureType = this.validateStructureType(searchText);
		if (!structureType) return;
		this.updateStructure(structureType);

		let urlMetadata = "trker_int2r.c13560";
		Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_CONFIG_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + structureType + "'", null, null, null, RESTHUB_URL)
			.then(response => {
				const configTypes = response.data.data;
				this.setState({
					configTypes: configTypes.map(s => s.kindOfHmConfigId),
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
		this.props.updateState(controllerState);
	}

	//config

	validateConfigType = (configType) => {
		return this.state.configTypes.find(s => s === configType);
	}

	onConfigTypeChange = (searchText, index) => {
		const configType = this.validateConfigType(searchText);
		if (!configType) return;
		this.updateConfig(configType);

		console.log("yooooo je suis la " + configType);

		let urlMetadata = "trker_int2r.c13560";
		Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_SET_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + this.props.controllerState.tracker_hmStructType + "'" + " AND t.KIND_OF_HM_CONFIG_ID = '" + this.props.controllerState.tracker_hmConfigType + "'", null, null, null, RESTHUB_URL)
			.then(response => {
				const setTypes = response.data.data;
				this.setState({
					setTypes: setTypes.map(s => s.kindOfHmSetId),
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
		this.props.updateState(controllerState);
	}

	validateSetType = (setType) => {
		return this.state.setTypes.find(s => s === setType);
	}

	onSetTypeChange = (searchText, index) => {
		const setType = this.validateSetType(searchText);
		if (!setType) return;
		this.updateSet(setType);

		let urlMetadata = "trker_int2r.c13560";
		Resthub.json2("SELECT DISTINCT t.PART_BARCODE FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + this.props.controllerState.tracker_hmStructType + "'" + " AND t.KIND_OF_HM_CONFIG_ID = '" + this.props.controllerState.tracker_hmConfigType + "' AND t.KIND_OF_HM_SET_ID = '" + setType + "'", null, null, null, RESTHUB_URL)
			.then(response => {
				const barcodeList = response.data.data;
				console.log("what I want");
				console.log(barcodeList);
				console.log("what I want");
				var minRange = barcodeList[0].partBarcode.split('_')[0];
				console.log(barcodeList.length);
				var maxRange = barcodeList[barcodeList.length - 1].partBarcode.split('_')[0];
				console.log(minRange);
				console.log(maxRange);
				this.setState({
					batchLimits: [parseInt(minRange), parseInt(maxRange)],// [barcodeRange.,barcodeRange.],
					batchRange: [parseInt(minRange), parseInt(maxRange)],// [barcodeRange.,barcodeRange.],
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
		let urlMetadata = "trker_int2r.c13560";
		Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_FLUTE_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID LIKE  '%" + searchText + "%' ", null, null, null, RESTHUB_URL)
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
		let urlMetadata = "trker_int2r.c13560";
		Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_STRUCT_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType + "' AND t.KIND_OF_HM_STRUCT_ID LIKE '%" + searchText + "%' ", null, null, null, RESTHUB_URL)
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
		let urlMetadata = "trker_int2r.c13560";
		Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_CONFIG_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + this.props.controllerState.tracker_hmStructType + "' AND  t.KIND_OF_HM_CONFIG_ID LIKE '%" + searchText + "%' ", null, null, null, RESTHUB_URL)
			.then(response => {
				const configTypes = response.data.data;
				this.setState({
					configTypes: configTypes.map(s => s.kindOfHmConfigId),
					errMessage: ''
				});
			});
	}

	onSetTypeUpdate = (searchText) => {
		this.updateSet(searchText);
		let urlMetadata = "trker_int2r.c13560";
		Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_SET_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + this.props.controllerState.tracker_hmStructType + "' AND t.KIND_OF_HM_CONFIG_ID = '" + this.props.controllerState.tracker_hmConfigType + "' AND  t.KIND_OF_HM_SET_ID LIKE '%" + searchText + "%' ", null, null, null, RESTHUB_URL)
			.then(response => {
				const setTypes = response.data.data;
				this.setState({
					setTypes: setTypes.map(s => s.kindOfHmSetId),
					errMessage: ''
				});
			});
	}


	//Filter at the level of SQL ... need improvment.. So far only restrict search to the next power of 10
	getBatchNumbers = (minRange, maxRange) => {
		let urlMetadata = "trker_int2r.c13560";

		let rangeSearch = maxRange.toString().slice(0, maxRange.toString().length - (1 + (maxRange - minRange).toString().length));
		console.log(rangeSearch);

		return Resthub.json2("SELECT DISTINCT t.SENSOR FROM  trker_cmsr.tracker_sensor_cv_v  t  where t.SENSOR like " + " '" + rangeSearch + "%' ", null, null, null, RESTHUB_URL)
			//return Resthub.json2("SELECT DISTINCT t.PART_BARCODE FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + this.props.controllerState.tracker_hmStructType + "' AND t.KIND_OF_HM_CONFIG_ID = '" + this.props.controllerState.tracker_hmConfigType + "' AND t.KIND_OF_HM_SET_ID = '" + this.props.controllerState.tracker_hmSetType   where t.PART_BARCODE like "+" '"+rangeSearch+"%' "+ "' ORDER BY t.PART_BARCODE ", null, null, null, RESTHUB_URL)
			.then(response => {
				//This line creates a list of unique batches number
				console.log("response");
				console.log(response.data.data);
				let batchNumbersList = [...new Set(response.data.data.map(s => s.sensor.split('_')[0]))].filter(s => (s >= minRange && s <= maxRange));
				console.log("batchNumbersList");
				console.log(batchNumbersList);
				return batchNumbersList;
			}).catch(error => this.props.onFailure(error));
	}

	getBarcodeAndRun = (batchNumber) => {
		let urlMetadata = "trker_int2r.c13560";
		let urlDatasets = "trker_int2r.datasets";
		let urlRuns = "trker_int2r.runs";
		//Resthub.json2("SELECT DISTINCT t.PART_BARCODE FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + this.props.controllerState.tracker_hmStructType + "' AND t.KIND_OF_HM_CONFIG_ID = '" + this.props.controllerState.tracker_hmConfigType + "' AND t.KIND_OF_HM_SET_ID = '" + this.props.controllerState.tracker_hmSetType + "' AND  t.PART_BARCODE LIKE '" + batchNumber + "%' ORDER BY t.PART_BARCODE ", null, null, null, RESTHUB_URL)
		//return Resthub.json2("SELECT DISTINCT t.SENSOR FROM  trker_cmsr.tracker_sensor_cv_v  t  WHERE  t.SENSOR LIKE '" + batchNumber + "%' ORDER BY t.SENSOR ", null, null, null, RESTHUB_URL)
		let sqlBarcode = "t.PART_BARCODE FROM " + urlMetadata + " t "
			+ "WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType
			+ "' AND t.KIND_OF_HM_STRUCT_ID = '" + this.props.controllerState.tracker_hmStructType
			+ "' AND t.KIND_OF_HM_CONFIG_ID = '" + this.props.controllerState.tracker_hmConfigType
			+ "' AND t.KIND_OF_HM_SET_ID = '" + this.props.controllerState.tracker_hmSetType;

		let batchNumber1 = 12346;
		let sqlRun1 = "SELECT m.part_barcode, r.run_number FROM " + urlRuns + " r, " + urlDatasets + " d, " + urlMetadata + " m "
			+ "where m.part_barcode  LIKE '" + batchNumber1 + "%"
			+ "' AND m.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType
			+ "' AND m.KIND_OF_HM_STRUCT_ID = '" + this.props.controllerState.tracker_hmStructType
			+ "' AND m.KIND_OF_HM_CONFIG_ID = '" + this.props.controllerState.tracker_hmConfigType
			+ "' AND m.KIND_OF_HM_SET_ID = '" + this.props.controllerState.tracker_hmSetType
			+ "'  and m.condition_data_set_id = d.id and d.run_id=r.id ORDER BY m.part_barcode";

		return Resthub.json2("SELECT DISTINCT t.SENSOR, t.RUN_TYPE_NUMBER FROM  trker_cmsr.tracker_sensor_cv_v  t  WHERE  t.SENSOR LIKE '" + batchNumber + "%' ORDER BY t.SENSOR ", null, null, null, RESTHUB_URL)
			//return Resthub.json2(sqlRun1, null, null, null, RESTHUB_URL)
			.then(response => {
				//let barcodeList = response.data.data.map(s=>s.partBarcode+"_"+s.runNumber);
				let barcodeList = response.data.data.map(s => s.sensor + "_" + s.runTypeNumber.replace(/(^.*\(|\).*$)/g, ''));
				//console.log(barcodeList);
				return barcodeList;
			});

	}

	filterRuns = (barcodeList) => { //Filter the last run available for a given barcode. Might need better writting
		let filteredList = [];
		let splitName = barcodeList[0].split('_');
		let currentRun = splitName.pop();
		let currentBarcode = splitName.join('_');
		let element = {
			barcode: currentBarcode,
			run: currentRun
		};//barcodeList[0];
		for (const barcode of barcodeList) {
			let Name = barcode.split('_');
			let Run = Name.pop();
			let Barcode = Name.join('_');
			let newElement = {
				barcode: Barcode,
				run: Run
			};
			//console.log("current " + currentBarcode + " " + currentRun);
			//console.log(Barcode + " " + Run);
			if (barcode == barcodeList[barcodeList.length - 1] && Barcode == currentBarcode && Run > currentRun) { filteredList.push(newElement); }
			else if (barcode == barcodeList[barcodeList.length - 1] && Barcode == currentBarcode && Run < currentRun) { filteredList.push(element); }
			else if (barcode == barcodeList[barcodeList.length - 1] && Barcode != currentBarcode) { filteredList.push(element); filteredList.push(newElement); }
			else if (Barcode == currentBarcode && Run > currentRun) { currentBarcode = Barcode; currentRun = Run; element = newElement; }
			else if (Barcode == currentBarcode && Run < currentRun) { continue; }
			else if (Barcode != currentBarcode) { filteredList.push(element); currentBarcode = Barcode; currentRun = Run; element = newElement; }
		}
		//console.log(filteredList);
		return filteredList;
	}

	onBatchAdd = () => {
		let {
			controllerState
		} = this.props;
		this.setState({ loading: true });
		this.getBatchNumbers(this.state.batchRange[0], this.state.batchRange[1])
			.then((batchNumbersList) => {


				const promises = [];
				batchNumbersList.map((c) => {
					promises.push(this.getBarcodeAndRun(c))
				})

				Promise.all(promises)
					.then(results => {
						let barcodeList = [];
						barcodeList = results.map((val, index) => { return val; });
						return barcodeList.map(s => {
							if (!controllerState.tracker_data.find(item => item.tracker_id === ("Batch " + s[0].split('_')[0]))) {
								controllerState.tracker_data.push({
									tracker_id: "Batch " + s[0].split('_')[0],
									barcodeRunList: this.filterRuns(s)
								})
							}
						}
						)
					}).then(() => {
						this.props.updateState(controllerState);
						this.setState({ loading: false });
						console.log(this.props.controllerState);
					});


			})
	}

	onIDDelete = (value) => {
		let {
			controllerState
		} = this.props;
		controllerState.tracker_data = controllerState.tracker_data.filter(item => item.tracker_id !== value);
		this.props.updateState(controllerState);
	}

	renderChip = () => {
		return (this.props.controllerState.tracker_data.map(e => {
			return (
				<Chip
					key={e.tracker_id}
					icon={<FolderIcon />}
					label={e.tracker_id}
					onDelete={() => this.onIDDelete(e.tracker_id)}
					className={this.props.classes.chip}
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
		console.log(this.state.batchRange);
	}

	handleTextMaxChange = (event) => {
		const minRange = this.state.batchRange[0];
		if (parseInt(event.target.value) >= minRange && (parseInt(event.target.value)) <= this.state.batchLimits[1]) this.setState({ batchRange: [minRange, parseInt(event.target.value)] });
		console.log(this.state.batchRange);
	}

	handleSliderChange = (event, newValue) => {
		this.setState({ batchRange: newValue });
	};


	render() {
		const { classes } = this.props;
		return (
			<div >
				<div>
					<AutoComplete
						label='Flute'
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
						label='Structure'
						value={this.props.controllerState.tracker_hmStructType}
						suggestions={this.state.structureTypes}
						onInputChange={this.onStructureTypeUpdate}
						onValueChange={this.onStructureTypeChange}
						style={styles.autoComplete}
						maxSearchResults={300}
						openOnFocus={true}
						listStyle={{ maxHeight: 300, overflow: 'auto' }}
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

						<TextField
							id="filled-name"
							label="Batch min."
							value={this.state.batchRange[0]}
							style={{ maxWidth: 50 }}
							onChange={this.handleTextMinChange}
						/>

						<Slider
							value={this.state.batchRange}
							style={{ marginLeft: 20, marginTop: 40, maxWidth: 600 }}
							onChange={this.handleSliderChange}
							valueLabelDisplay="auto"
							aria-labelledby="range-slider"
							getAriaValueText={this.valuetext}
							valueLabelDisplay="on"
							min={this.state.batchLimits[0]}
							max={this.state.batchLimits[1]}
						/>

						<TextField
							id="filled-name"
							label="Batch max."
							value={this.state.batchRange[1]}
							style={{ marginLeft: 20, maxWidth: 50 }}
							onChange={this.handleTextMaxChange}
						/>

						<Button
							//disabled={this.props.controllerState.tracker_runName === '' 
							//&& this.props.controllerState.tracker_runTypeNumber === ''}
							style={{ marginLeft: 20, marginTop: -40 }}
							variant="contained"
							className={classes.button}
							onClick={this.onBatchAdd}>
							Add batches
						</Button>
						{this.renderLoading()}
					</div>


					<br />
					<div>
						<Typography variant="subtitle2" gutterBottom style={{ marginTop: 10 }}>
							Selected batches:
						</Typography>
						<div style={styles.wrapper}>
							{this.renderChip()}
						</div>
					</div>
				</div>
			</div >
		);
	}
}
export default withStyles(styles)(TrackerHMBatchController);
