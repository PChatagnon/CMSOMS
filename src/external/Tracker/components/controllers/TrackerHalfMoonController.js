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

class TrackerHalfMoonController extends Component {

	static controllerHeight = 350;


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
			tab: "simple"
		}
	}

	static controllerInit(urlQuery, controller) {

		//let urlMetadata = "trker_int2r.c13560";
		//let urlDatasets = "trker_int2r.datasets";
		//let urlRuns = "trker_int2r.runs";
		let urlMetadata = "trker_cmsr.c8920";
		let urlDatasets = "trker_cmsr.datasets";
		let urlRuns = "trker_cmsr.runs";
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
			return {
				data: {
					runs: runs
				},
				state: {
					tracker_partBarcode: barcodeType,
					tracker_fluteType: fluteType,
					tracker_hmStructType: structureType,
					tracker_hmConfigType: configType,
					tracker_hmSetType: setType,
					tracker_hmRunNumber: runTypeNumber,
					tracker_data: selectedIds,
					tracker_id: id,
					filterBy: filterBy
				}
			}
		}

		let initPQC = () => {
			let urlMetadata = "trker_cmsr.c8920";
			Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_FLUTE_ID FROM " + urlMetadata + " t ", null, null, null, RESTHUB_URL)
				.then(response => {
					const fluteTypes = response.data.data;
					this.setState({
						fluteTypes: fluteTypes.map(s => s.kindOfHmFluteId),
						errMessage: ''
					});
				});
		}

		let {
			url
		} = controller.configuration;

		return Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_FLUTE_ID FROM " + urlMetadata + " t ", null, null, null, RESTHUB_URL)
			.then(resp => {
				const respData = resp.data.data;
				const fluteTypes = respData.length ? respData.map(s => s.kindOfHmFluteId) : null;
				lastFluteType = fluteTypes ? fluteTypes[0] : null;
				fluteType = lastFluteType ? lastFluteType : null;
				//console.log("HERE flute type " + fluteType+ " "+this.setState.fluteTypes[0]);
				return Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_STRUCT_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + fluteType + "'", null, null, null, RESTHUB_URL)
					.then(resp => {
						const respData = resp.data.data;
						const structureTypes = respData.length ? respData.map(s => s.kindOfHmStructId) : null;
						lastStructureType = structureTypes ? structureTypes[0] : null;
						structureType = lastStructureType ? lastStructureType : null
						//console.log("structure type " + structureType);
						return Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_CONFIG_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + fluteType + "'AND t.KIND_OF_HM_STRUCT_ID = '" + structureType + "'", null, null, null, RESTHUB_URL)
							.then(resp => {
								const respData = resp.data.data;
								const configTypes = respData.length ? respData.map(s => s.kindOfHmConfigId) : null;
								lastConfigType = configTypes ? configTypes[0] : null;
								configType = lastConfigType ? lastConfigType : null
								//console.log("config type " + configType);
								return Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_SET_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + fluteType + "'AND t.KIND_OF_HM_STRUCT_ID = '" + structureType + "'AND t.KIND_OF_HM_CONFIG_ID = '" + configType + "'", null, null, null, RESTHUB_URL)
									.then(resp => {
										const respData = resp.data.data;
										const setTypes = respData.length ? respData.map(s => s.kindOfHmSetId) : null;
										lastSetType = setTypes ? setTypes[0] : null;
										setType = lastSetType ? lastSetType : null
										//console.log("set type " + setType);
										return Resthub.json2("SELECT DISTINCT t.PART_BARCODE FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + structureType + "' AND t.KIND_OF_HM_CONFIG_ID = '" + configType + "' AND t.KIND_OF_HM_SET_ID = '" + setType + "' ORDER BY t.PART_BARCODE ", null, 1, 1, RESTHUB_URL)
											.then(resp => {
												const respData = resp.data.data;
												const barcodeTypes = respData.length ? respData.map(s => s.partBarcode) : null;
												lastBarcodeType = barcodeTypes ? barcodeTypes[0] : null;
												barcodeType = lastBarcodeType ? lastBarcodeType : null;
												console.log("barcode  " + barcodeType);
												return Resthub.json2("SELECT DISTINCT r.run_number, r.name FROM " + urlRuns + " r, " + urlDatasets + " d, " + urlMetadata + " m where m.part_barcode='" + barcodeType + "' and m.kind_of_hm_flute_id = '" + fluteType + "' and m.KIND_OF_HM_STRUCT_ID= '" + structureType + "' AND m.KIND_OF_HM_CONFIG_ID = '" + configType + "' AND m.KIND_OF_HM_SET_ID = '" + setType + "'  and m.condition_data_set_id = d.id and d.run_id=r.id ", null, null, null, RESTHUB_URL)
													.then(resp => {
														runs = resp.data.data.reverse();

														//if (runs[0].runNumber) {
															const last_runTypeNumber = runs ? runs[0].runNumber : null;
															runTypeNumber = last_runTypeNumber ? last_runTypeNumber : 'None';
															console.log("run type " + runTypeNumber);
														//}
														return initData();
													})
											})
									})
							})
					})
			}).catch(err => initData());
	}

	static controllerQueryTitle(state) {
		//return `HM Barcode:   ${state.tracker_partBarcode}`;
		return `${state.tracker_fluteType}/${state.tracker_hmStructType}/${state.tracker_partBarcode}`;
	}

	updateRuns = (runs) => {
		let {
			controllerData
		} = this.props;
		controllerData.runs = runs;
		this.props.updateControllerData(controllerData);
		let {
			controllerState
		} = this.props;
		if (runs[0].runNumber) {
			controllerState.tracker_hmRunNumber = runs ? runs[0].runNumber : null;
		}
		this.props.updateState(controllerState);
	}


	emptyRuns = () => {
		let {
			controllerData
		} = this.props;
		controllerData.runs = null;
		this.props.updateControllerData(controllerData);
		let {
			controllerState
		} = this.props;
		controllerState.tracker_hmRunNumber = null;
		this.props.updateState(controllerState);
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
			controllerState.tracker_hmRunNumber = [];
			this.props.updateState(controllerState);
		}

		let urlMetadata = "trker_cmsr.c8920";
		let urlDatasets = "trker_cmsr.datasets";
		let urlRuns = "trker_cmsr.runs";
		return Resthub.json2("SELECT DISTINCT r.run_number, r.name FROM " + urlRuns + " r, " + urlDatasets + " d, " + urlMetadata + " m where m.part_barcode='" + barcodeType + "' and m.kind_of_hm_flute_id = '" + fluteType + "' and m.KIND_OF_HM_STRUCT_ID= '" + structureType + "' AND m.KIND_OF_HM_CONFIG_ID = '" + configType + "' AND m.KIND_OF_HM_SET_ID = '" + setType + "'  and m.condition_data_set_id = d.id and d.run_id=r.id ", null, null, null, RESTHUB_URL)
			.then(response => {
				const runs = response.data.data;
				this.updateRuns(runs);
			}).catch(err => emptyRuns());
	}


	validateBarcodeType = (barcodeType) => {
		return this.state.barcodeTypes.find(s => s === barcodeType);
		//return true;
	}

	onBarcodeTypeChange = (searchText, index) => {
		//console.log("what is list of barcode in props " + this.state.barcodeTypes);
		const barcodeType = this.validateBarcodeType(searchText);
		const fluteType = this.props.controllerState.tracker_fluteType;
		const structureType = this.props.controllerState.tracker_hmStructType;
		const configType = this.props.controllerState.tracker_hmConfigType;
		const setType = this.props.controllerState.tracker_hmSetType;
		//console.log("what is barcode " + barcodeType);
		if (!barcodeType) return;
		this.updateBarcode(barcodeType);


		this.fetchRunNames(barcodeType, fluteType, structureType, configType, setType);
	}

	/*onBarcodeTypeChange = (searchText, index) => {
	  const barcodeType = this.validateBarcodeType(searchText);
	  console.log("what is barcode "+barcodeType);
	  if (!barcodeType) return;
	  this.updateBarcode(barcodeType);


	  return this.fetchRunNames(barcodeType);
	  }*/

	updateBarcode = barcodeType => {
		let {
			controllerState
		} = this.props;
		controllerState.tracker_partBarcode = barcodeType;
		this.props.updateState(controllerState);
	}


	validateFluteType = (fluteType) => {
		return this.state.fluteTypes.find(s => s === fluteType);
	}

	onFluteTypeChange = (searchText, index) => {
		const fluteType = this.validateFluteType(searchText);
		if (!fluteType) return;
		this.updateFlute(fluteType);

		let urlMetadata = "trker_cmsr.c8920";
		Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_STRUCT_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + fluteType + "' ", null, null, null, RESTHUB_URL)
			.then(response => {
				const structureTypes = response.data.data;
				this.setState({
					structureTypes: structureTypes.map(s => s.kindOfHmStructId),
					errMessage: ''
				});
			});

		const barcodeType = this.validateBarcodeType(this.props.controllerState.tracker_partBarcode);
		const structureType = this.validateStructureType(this.props.controllerState.tracker_hmStructType);
		const configType = this.validateConfigType(this.props.controllerState.tracker_hmConfigType);
		const setType = this.validateSetType(this.props.controllerState.tracker_hmSetType);
		//console.log("what is list of barcode type flute change " + barcodeType);

		this.fetchRunNames(barcodeType, fluteType, structureType, configType, setType);


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
		controllerState.tracker_partBarcode = "";
		this.props.updateState(controllerState);
	}

	validateStructureType = (structureType) => {
		return this.state.structureTypes.find(s => s === structureType);
	}

	onStructureTypeChange = (searchText, index) => {
		const structureType = this.validateStructureType(searchText);
		if (!structureType) return;
		this.updateStructure(structureType);

		let urlMetadata = "trker_cmsr.c8920";
		Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_CONFIG_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + structureType + "'", null, null, null, RESTHUB_URL)
			.then(response => {
				const configTypes = response.data.data;
				this.setState({
					configTypes: configTypes.map(s => s.kindOfHmConfigId),
					errMessage: ''
				});
			});

		const barcodeType = this.validateBarcodeType(this.props.controllerState.tracker_partBarcode);
		const fluteType = this.validateFluteType(this.props.controllerState.tracker_fluteType);
		const configType = this.validateConfigType(this.props.controllerState.tracker_hmConfigType);
		const setType = this.validateSetType(this.props.controllerState.tracker_hmSetType);

		this.fetchRunNames(barcodeType, fluteType, structureType, configType, setType);


		return;
	}

	updateStructure = structureType => {
		let {
			controllerState
		} = this.props;
		controllerState.tracker_hmStructType = structureType;
		controllerState.tracker_hmConfigType = "";
		controllerState.tracker_hmSetType = "";
		controllerState.tracker_partBarcode = "";
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

		let urlMetadata = "trker_cmsr.c8920";
		Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_SET_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + this.props.controllerState.tracker_hmStructType + "'" + " AND t.KIND_OF_HM_CONFIG_ID = '" + this.props.controllerState.tracker_hmConfigType + "'", null, null, null, RESTHUB_URL)
			.then(response => {
				const setTypes = response.data.data;
				this.setState({
					setTypes: setTypes.map(s => s.kindOfHmSetId),
					errMessage: ''
				});
			});

		const barcodeType = this.validateBarcodeType(this.props.controllerState.tracker_partBarcode);
		const fluteType = this.validateFluteType(this.props.controllerState.tracker_fluteType);
		const structureType = this.validateStructureType(this.props.controllerState.tracker_hmStructType);
		const setType = this.validateSetType(this.props.controllerState.tracker_hmSetType);

		this.fetchRunNames(barcodeType, fluteType, structureType, configType, setType);


		return;
	}

	updateConfig = configType => {
		let {
			controllerState
		} = this.props;
		controllerState.tracker_hmConfigType = configType;
		controllerState.tracker_hmSetType = "";
		controllerState.tracker_partBarcode = "";
		this.props.updateState(controllerState);
	}

	validateSetType = (setType) => {
		return this.state.setTypes.find(s => s === setType);
	}

	onSetTypeChange = (searchText, index) => {
		const setType = this.validateSetType(searchText);
		if (!setType) return;
		this.updateSet(setType);
		let urlMetadata = "trker_cmsr.c8920";
		Resthub.json2("SELECT DISTINCT t.PART_BARCODE FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + this.props.controllerState.tracker_hmStructType + "'" + " AND t.KIND_OF_HM_CONFIG_ID = '" + this.props.controllerState.tracker_hmConfigType + "' AND t.KIND_OF_HM_SET_ID = '" + setType + "'", null, null, null, RESTHUB_URL)
			.then(response => {
				const barcodeTypes = response.data.data;
				this.setState({
					barcodeTypes: barcodeTypes.map(s => s.partBarcode),
					errMessage: ''
				});
			});

		const barcodeType = this.validateBarcodeType(this.props.controllerState.tracker_partBarcode);
		const fluteType = this.validateFluteType(this.props.controllerState.tracker_fluteType);
		const structureType = this.validateStructureType(this.props.controllerState.tracker_hmStructType);
		const configType = this.validateConfigType(this.props.controllerState.tracker_hmConfigType);

		this.fetchRunNames(barcodeType, fluteType, structureType, configType, setType);


		return;
	}

	updateSet = setType => {
		let {
			controllerState
		} = this.props;
		controllerState.tracker_hmSetType = setType;
		controllerState.tracker_partBarcode = "";
		this.props.updateState(controllerState);
	}

	///

	onBarcodeTypeUpdate = (searchText) => {
		this.updateBarcode(searchText);
		let urlMetadata = "trker_cmsr.c8920";
		let Upper_searchText = searchText.toUpperCase() 
		Resthub.json2("SELECT DISTINCT t.PART_BARCODE FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + this.props.controllerState.tracker_hmStructType + "' AND t.KIND_OF_HM_CONFIG_ID = '" + this.props.controllerState.tracker_hmConfigType + " AND t.KIND_OF_HM_SET_ID = '" + this.props.controllerState.tracker_hmSetType + "' AND t.PART_BARCODE LIKE  '%" + Upper_searchText + "%' ", null, null, null, RESTHUB_URL)
			.then(response => {
				const barcodeTypes = response.data.data;
				this.setState({
					barcodeTypes: barcodeTypes.map(s => s.partBarcode),
					errMessage: ''
				});
			});
	}

	onFluteTypeUpdate = (searchText) => {
		this.updateFlute(searchText);
		let urlMetadata = "trker_cmsr.c8920";
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
		let urlMetadata = "trker_cmsr.c8920";
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
		let Upper_searchText = (searchText[0] == "r" || searchText[0] == "s") ? searchText[0].toUpperCase() + searchText.substring(1).toLowerCase() : searchText.toLowerCase()
		let urlMetadata = "trker_cmsr.c8920";
		Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_CONFIG_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + this.props.controllerState.tracker_hmStructType + "' AND  t.KIND_OF_HM_CONFIG_ID LIKE '%" + Upper_searchText + "%' ", null, null, null, RESTHUB_URL)
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
		let Upper_searchText = (searchText[0] == "l" || searchText[0] == "r") ? searchText[0].toUpperCase() + searchText.substring(1).toLowerCase() : searchText.toLowerCase()
		let urlMetadata = "trker_cmsr.c8920";
		Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_SET_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + this.props.controllerState.tracker_hmStructType + "' AND t.KIND_OF_HM_CONFIG_ID = '" + this.props.controllerState.tracker_hmConfigType + "' AND  t.KIND_OF_HM_SET_ID LIKE '%" + Upper_searchText + "%' ", null, null, null, RESTHUB_URL)
			.then(response => {
				const setTypes = response.data.data;
				this.setState({
					setTypes: setTypes.map(s => s.kindOfHmSetId),
					errMessage: ''
				});
			});
	}


	onRunTypeNumberChange = event => {
		let {
			controllerState
		} = this.props;
		if (event.target.value != null) {
			controllerState.tracker_hmRunNumber = event.target.value;
		} else {
			controllerState.tracker_hmRunNumber = '';
		}
		
		this.props.updateState(controllerState);


	}



	renderRunNumbers = () => {
		const {
			runs
		} = this.props.controllerData;

		if (runs.length > 0) {
			console.log(runs)
			runs.reverse();
			console.log(runs)
			if (runs[0].runNumber) {
				if (!(runs[0].runNumber).toString().length) {
					//console.log("what is run number  aa " + (runs[0].runNumber).toString() + " length " + runs[0].runNumber.length)
					return <MenuItem value={null} > None </MenuItem>
				}
			} else {
				return <MenuItem value={null} > None </MenuItem>
			}
			return runs.map((data, index) => {
				return <MenuItem value={data.runNumber} key={index} > {`${data.runNumber}`} </MenuItem>
			});
		} else {
			return <MenuItem value={null} > None </MenuItem>
		}
	}




	onIDAdd = () => {
		let {
			controllerState
		} = this.props;
		if (controllerState.tracker_hmRunNumber) {
			if (controllerState.tracker_data.find(item => item.tracker_hmRunNumber === controllerState.tracker_hmRunNumber) && controllerState.tracker_data.find(item => item.tracker_partBarcode === controllerState.tracker_partBarcode) && controllerState.tracker_data.find(item => item.tracker_fluteType === controllerState.tracker_fluteType) && controllerState.tracker_data.find(item => item.tracker_hmStructType === controllerState.tracker_hmStructType) && controllerState.tracker_data.find(item => item.tracker_hmConfigType === controllerState.tracker_hmConfigType) && controllerState.tracker_data.find(item => item.tracker_hmSetType === controllerState.tracker_hmSetType)) {
				window.alert("This configuration is already included");
				return;
			} else {
				let title = controllerState.tracker_partBarcode + "-" + controllerState.tracker_fluteType + "-" + controllerState.tracker_hmStructType
				if (controllerState.tracker_hmConfigType != "Not Used") { title += "-" + controllerState.tracker_hmConfigType; }
				if (controllerState.tracker_hmSetType != "Not Used") { title += "-" + controllerState.tracker_hmSetType; }
				title += "-" + controllerState.tracker_hmRunNumber;
				controllerState.tracker_data.push({
					tracker_hmRunNumber: controllerState.tracker_hmRunNumber,
					tracker_partBarcode: controllerState.tracker_partBarcode,
					tracker_fluteType: controllerState.tracker_fluteType,
					tracker_hmStructType: controllerState.tracker_hmStructType,
					tracker_hmConfigType: controllerState.tracker_hmConfigType,
					tracker_hmSetType: controllerState.tracker_hmSetType,
					tracker_id: title
				});
				this.props.updateState(controllerState);
				return;
			}
		}
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
				< Chip
					key={e.tracker_id}
					icon={< FaceIcon />}
					label={e.tracker_id}
					onDelete={() => this.onIDDelete(e.tracker_id)}
					className={this.props.classes.chip}
				/>
			);
		})
		)
	}

	render() {
		const { classes } = this.props;
		const { filterBy } = this.props.controllerState;
		const { tab } = this.state;
		return (
			<div >
				<AppBar position="static">
					<Tabs
						value={tab}
						variant="scrollable"
						scrollButtons="auto"
						aria-label="simple tabs example"
						onChange={(e, value) => this.setState({ tab: value })}
					>
						<Tab label="One element chart" value="simple" />
						<Tab label="SuperImposed chart" value="super" />
					</Tabs>
				</AppBar>
				{tab === "simple" &&
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
						<AutoComplete
							label='HalfMoon BarCode'
							value={this.props.controllerState.tracker_partBarcode}
							suggestions={this.state.barcodeTypes}
							onInputChange={this.onBarcodeTypeUpdate}
							onValueChange={this.onBarcodeTypeChange}
							style={styles.autoComplete}
							maxSearchResults={300}
							openOnFocus={true}
							listStyle={{ maxHeight: 300, overflow: 'auto' }}
						/>
						<div className={classes.inputContainer}>
							<TextField
								select
								label="Run Number"
								className={classes.selectField}
								InputProps={{ className: classes.textField }}
								value={this.props.controllerState.tracker_hmRunNumber}
								onChange={this.onRunTypeNumberChange}
								suggestions={this.state.runs}
								SelectProps={{
									MenuProps: {
										className: classes.itemMenu,
									}
								}}
							>
								{this.renderRunNumbers()}
							</TextField>
						</div>
					</div>
				}
				{tab === "super" &&
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
						<AutoComplete
							label='HalfMoon BarCode'
							value={this.props.controllerState.tracker_partBarcode}
							suggestions={this.state.barcodeTypes}
							onInputChange={this.onBarcodeTypeUpdate}
							onValueChange={this.onBarcodeTypeChange}
							style={styles.autoComplete}
							maxSearchResults={300}
							openOnFocus={true}
							listStyle={{ maxHeight: 300, overflow: 'auto' }}
						/>
						<div className={classes.inputContainer}>
							<TextField
								select
								label="Run Number"
								className={classes.selectField}
								InputProps={{ className: classes.textField }}
								value={this.props.controllerState.tracker_hmRunNumber}
								onChange={this.onRunTypeNumberChange}
								suggestions={this.state.runs}
								SelectProps={{
									MenuProps: {
										className: classes.itemMenu,
									}
								}}
							>
								{this.renderRunNumbers()}
							</TextField>
						</div>
						<Button
							//disabled={this.props.controllerState.tracker_runName === '' 
							//&& this.props.controllerState.tracker_hmRunNumber === ''}
							variant="contained"
							className={classes.button}
							onClick={this.onIDAdd}>
							Add ID
						</Button>
						<br />
						<div>
							<Typography variant="subtitle2" gutterBottom style={{ marginTop: 10 }}>
								Selected Ids:
							</Typography>
							<div style={styles.wrapper}>
								{this.renderChip()}
							</div>
						</div>
					</div>
				}

			</div >
		);
	}
}
export default withStyles(styles)(TrackerHalfMoonController);
