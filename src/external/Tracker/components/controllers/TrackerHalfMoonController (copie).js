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

	static controllerHeight = 400;


	constructor() {
		super();
		this.state = {
			errMessage: '',
			barcodeTypes: [],
			fluteTypes: [],
			structureTypes: [],
			url: '',
			tab: "simple"
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
					tracker_runName: run,
					tracker_runTypeNumber: runTypeNumber,
					tracker_data: selectedIds,
					tracker_id: id,
					filterBy: filterBy
				}
			}
		}

		let {
			url
		} = controller.configuration;
		console.log("url is " + url);
		/*
		   return Resthub.json2("SELECT t.PART_BARCODE FROM " + urlMetadata + " t ORDER BY t.PART_BARCODE ", null, 1, 1, RESTHUB_URL)
		   .then(resp => {
		   const respData = resp.data.data;
		   const barcodeTypes = respData.length ? respData.map(s => s.partBarcode) : null;
		   lastBarcodeType = barcodeTypes ? barcodeTypes[0] : null;
		   barcodeType = '';//lastBarcodeType ? lastBarcodeType : null;
		   console.log("barcode  "+barcodeType);
		   return Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_FLUTE_ID FROM " + urlMetadata + " t WHERE t.PART_BARCODE = '" + barcodeType + "' ", null, null, null, RESTHUB_URL)
		   .then(resp => {
		   const respData = resp.data.data;
		   const fluteTypes = respData.length ? respData.map(s => s.kindOfHmFluteId) : null;
		   lastFluteType = fluteTypes ? fluteTypes[0] : null;
		   fluteType= '';//lastFluteType ? lastFluteType : null;
		   console.log("flute type "+fluteType);
		   return Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_STRUCT_ID FROM " + urlMetadata + " t WHERE t.PART_BARCODE = '" + barcodeType + "' AND t.KIND_OF_HM_FLUTE_ID = '" + fluteType + "'", null, null, null, RESTHUB_URL)
		   .then(resp => {
		   const respData = resp.data.data;
		   const structureTypes = respData.length ? respData.map(s => s.kindOfHmStructId) : null;
		   lastStructureType = structureTypes ? structureTypes[0] : null;
		   structureType = '';//lastStructureType ? lastStructureType : null
		   console.log("structure type "+ structureType);

		   return Resthub.json2("SELECT DISTINCT r.run_number, r.name FROM "+ urlRuns +" r, "+ urlDatasets +" d, "+ urlMetadata +" m where m.part_barcode='" + barcodeType + "' and m.kind_of_hm_flute_id = '" + fluteType + "' and m.KIND_OF_HM_STRUCT_ID= '" + structureType + "'  and m.condition_data_set_id = d.id and d.run_id=r.id ", null, null, null, RESTHUB_URL)
		   .then(resp => {
		   runs = resp.data.data;

		   if (runs[0].runName) {
		   const lastRun = runs ? runs[0].runName : null;
		   run = '';//lastRun ? lastRun : 'None';
		   console.log("run "+ run);
		   }
		   if (runs[0].runNumber){
		   const last_runTypeNumber = runs ? runs[0].runNumber : null;    
		   runTypeNumber = '';//last_runTypeNumber ? last_runTypeNumber : 'None';
		   console.log("run type "+ runTypeNumber);
		   }
		   return initData();
		   })
		   })
		   })
		   }).catch(err => initData());*/
		return Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_FLUTE_ID FROM " + urlMetadata + " t ", null, null, null, RESTHUB_URL)
			.then(resp => {
				const respData = resp.data.data;
				const fluteTypes = respData.length ? respData.map(s => s.kindOfHmFluteId) : null;
				lastFluteType = fluteTypes ? fluteTypes[0] : null;
				fluteType = lastFluteType ? lastFluteType : null;
				console.log("flute type " + fluteType);
				return Resthub.json2("SELECT DISTINCT t.KIND_OF_HM_STRUCT_ID FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + fluteType + "'", null, null, null, RESTHUB_URL)
					.then(resp => {
						const respData = resp.data.data;
						const structureTypes = respData.length ? respData.map(s => s.kindOfHmStructId) : null;
						lastStructureType = structureTypes ? structureTypes[0] : null;
						structureType = lastStructureType ? lastStructureType : null
						console.log("structure type " + structureType);
						return Resthub.json2("SELECT DISTINCT t.PART_BARCODE FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + structureType + "' ORDER BY t.PART_BARCODE ", null, 1, 1, RESTHUB_URL)
							.then(resp => {
								const respData = resp.data.data;
								const barcodeTypes = respData.length ? respData.map(s => s.partBarcode) : null;
								lastBarcodeType = barcodeTypes ? barcodeTypes[0] : null;
								barcodeType = lastBarcodeType ? lastBarcodeType : null;
								console.log("barcode  " + barcodeType);
								return Resthub.json2("SELECT DISTINCT r.run_number, r.name FROM " + urlRuns + " r, " + urlDatasets + " d, " + urlMetadata + " m where m.part_barcode='" + barcodeType + "' and m.kind_of_hm_flute_id = '" + fluteType + "' and m.KIND_OF_HM_STRUCT_ID= '" + structureType + "'  and m.condition_data_set_id = d.id and d.run_id=r.id ", null, null, null, RESTHUB_URL)
									.then(resp => {
										runs = resp.data.data;

										if (runs[0].runName) {
											const lastRun = runs ? runs[0].runName : null;
											run = lastRun ? lastRun : 'None';
											console.log("run " + run);
										}
										if (runs[0].runNumber) {
											const last_runTypeNumber = runs ? runs[0].runNumber : null;
											runTypeNumber = last_runTypeNumber ? last_runTypeNumber : 'None';
											console.log("run type " + runTypeNumber);
										}
										return initData();
									})
							})
					})
			}).catch(err => initData());
	}

	static controllerQueryTitle(state) {
		return `HM Barcode:   ${state.tracker_partBarcode}`;
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
		if (runs[0].runName) {
			controllerState.tracker_runName = runs ? runs[0].runName : null;
		}
		if (runs[0].runNumber) {
			controllerState.tracker_runTypeNumber = runs ? runs[0].runNumber : null;
		}
		this.props.updateState(controllerState);
	}

	fetchRunNames = (barcodeType, fluteType, structureType) => {
		let urlMetadata = "trker_int2r.c13560";
		let urlDatasets = "trker_int2r.datasets";
		let urlRuns = "trker_int2r.runs";
		return Resthub.json2("SELECT DISTINCT r.run_number, r.name FROM " + urlRuns + " r, " + urlDatasets + " d, " + urlMetadata + " m where m.part_barcode='" + barcodeType + "' and m.kind_of_hm_flute_id = '" + fluteType + "' and m.KIND_OF_HM_STRUCT_ID= '" + structureType + "'  and m.condition_data_set_id = d.id and d.run_id=r.id ", null, null, null, RESTHUB_URL)
			.then(response => {
				const runs = response.data.data;
				this.updateRuns(runs);
			});
	}

	/*fetchRunNames = (barcodeType) => { //to change
	  return Resthub.json2("SELECT DISTINCT t.RUN_NAME, t.RUN_TYPE_NUMBER FROM " + this.props.configuration.url + " t WHERE t.SENSOR = '" + barcodeType + "' ", null, null, null, RESTHUB_URL)
	  .then(response => {
	  const runs = response.data.data;
	  this.updateRuns(runs);
	  });
	  }*/

	validateBarcodeType = (barcodeType) => {
		return this.state.barcodeTypes.find(s => s === barcodeType);
		//return true;
	}

	onBarcodeTypeChange = (searchText, index) => {
		const barcodeType = this.validateBarcodeType(searchText);
		const fluteType = this.props.controllerState.tracker_fluteType;
		const structureType = this.props.controllerState.tracker_hmStructType;
		console.log("what is barcode " + barcodeType);
		if (!barcodeType) return;
		this.updateBarcode(barcodeType);


		return this.fetchRunNames(barcodeType, fluteType, structureType);
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
		return;
	}

	updateStructure = structureType => {
		let {
			controllerState
		} = this.props;
		controllerState.tracker_hmStructType = structureType;
		this.props.updateState(controllerState);
	}

	onBarcodeTypeUpdate = (searchText) => {
		this.updateBarcode(searchText);
		let urlMetadata = "trker_int2r.c13560";
		Resthub.json2("SELECT DISTINCT t.PART_BARCODE FROM " + urlMetadata + " t WHERE t.KIND_OF_HM_FLUTE_ID = '" + this.props.controllerState.tracker_fluteType + "' AND t.KIND_OF_HM_STRUCT_ID = '" + this.props.controllerState.tracker_hmStructType + "' AND t.PART_BARCODE LIKE  '%" + searchText + "%' ", null, null, null, RESTHUB_URL)
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

	onRunNameChange = event => {
		let {
			controllerState
		} = this.props;
		if (event.target.value != null) {
			controllerState.tracker_runName = event.target.value;
		} else {
			controllerState.tracker_runName = '';
		}
		this.props.updateState(controllerState);
	}

	onRunTypeNumberChange = event => {
		let {
			controllerState
		} = this.props;
		if (event.target.value != null) {
			controllerState.tracker_runTypeNumber = event.target.value;
		} else {
			controllerState.tracker_runTypeNumber = '';
		}
		console.log("what is run number in props " + this.props.controllerState.tracker_runTypeNumber);
		this.props.updateState(controllerState);


	}

	renderRunNames = () => {
		const {
			runs
		} = this.props.controllerData;
		if (runs.length > 0) {
			if (runs[0].runName) {
				console.log("what is run " + runs[0].runName)
				if (!runs[0].runName.length) {
					return <MenuItem value = {null} > None < /MenuItem>
				}
			} else {
				console.log("what is run 1 " + runs[0].runName)
				return <MenuItem value = {null} > None < /MenuItem>
			}
			return runs.map((data, index) => {
				console.log("what is run 1 " + runs[0].runName)
				return <MenuItem value = {data.runName}key = {index} > {`${data.runName}`} < /MenuItem>
			});
		} else {
			return <MenuItem value = {
				null
			} > None < /MenuItem>
		}
	}

	renderRunNumbers = () => {
		const {
			runs
		} = this.props.controllerData;
		if (runs.length > 0) {
			if (runs[0].runNumber) {

				if (!(runs[0].runNumber).toString().length) {
					// console.log("what is run number "+runs[0].runNumber+" length "+runs[0].runNumber.length)
					return <MenuItem value = {null} > None < /MenuItem>
				}
			} else {
				// console.log("what is run number 1 "+runs[0].runNumber)
				return <MenuItem value = {null} > None < /MenuItem>
			}
			return runs.map((data, index) => {
				//	console.log("what is run number 2"+runs[0].runNumber)
				return <MenuItem value = {data.runNumber}key = {index} > {`${data.runNumber}`} < /MenuItem>
			});
		} else {
			return <MenuItem value = {null} > None < /MenuItem>
		}
	}


	onFilterChange = event => {
		const {
			value
		} = event.target;
		let {
			controllerState
		} = this.props;
		controllerState.filterBy = value;
		controllerState.tracker_runTypeNumber = '';
		controllerState.tracker_runName = '';
		this.props.updateState(controllerState);
	}

	onIDAdd = () => {
		let {
			controllerState
		} = this.props;
		if (controllerState.tracker_runTypeNumber) {
			if ( /*controllerState.tracker_data.find(item => item.tracker_runTypeNumber === controllerState.tracker_runTypeNumber) &&*/ controllerState.tracker_data.find(item => item.tracker_partBarcode === controllerState.tracker_partBarcode) && controllerState.tracker_data.find(item => item.tracker_fluteType === controllerState.tracker_fluteType) && controllerState.tracker_data.find(item => item.tracker_hmStructType === controllerState.tracker_hmStructType)) {
				//Snackbar goes here. Inform that this one already `add`ed.
				this.handleClick({
					vertical: 'bottom',
					horizontal: 'center'
				})
				return;
			} else {
				controllerState.tracker_data.push({
					tracker_runTypeNumber: controllerState.tracker_runTypeNumber,
					tracker_runName: controllerState.tracker_runName,
					tracker_partBarcode: controllerState.tracker_partBarcode,
					tracker_id: controllerState.tracker_partBarcode + "." + controllerState.tracker_runTypeNumber
				});
				this.props.updateState(controllerState);
				return;
			}
		} else {
			if ( /*controllerState.tracker_data.find(item => item.tracker_runName === controllerState.tracker_runName) &&*/ controllerState.tracker_data.find(item => item.tracker_partBarcode === controllerState.tracker_partBarcode) && controllerState.tracker_data.find(item => item.tracker_fluteType === controllerState.tracker_fluteType) && controllerState.tracker_data.find(item => item.tracker_hmStructType === controllerState.tracker_hmStructType)) {
				//Snackbar goes here. Inform that this one already `add`ed.
				this.handleClick({
					vertical: 'bottom',
					horizontal: 'center'
				})
				return;
			} else {
				controllerState.tracker_data.push({
					tracker_runTypeNumber: controllerState.tracker_runTypeNumber,
					tracker_runName: controllerState.tracker_runName,
					tracker_partBarcode: controllerState.tracker_partBarcode,
					tracker_fluteType: controllerState.tracker_fluteType,
					tracker_hmStructType: controllerState.tracker_hmStructType,
					tracker_id: controllerState.tracker_partBarcode + "-" + controllerState.tracker_fluteType + "-" + controllerState.tracker_hmStructType
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
			         key = {e.tracker_id}
				 icon = { < FaceIcon / >}
				 label = {e.tracker_id}
				 onDelete = {() => this.onIDDelete(e.tracker_id)}
				 className = {this.props.classes.chip}
				/>
			);
		})
	       )
	}

	render() {
		const {classes} = this.props;
		const {filterBy} = this.props.controllerState;
		const {tab} = this.state;
		return ( 
		< div >
			< AppBar position = "static" >
			< Tabs 
			value = {tab}
			variant = "scrollable"
			scrollButtons = "auto"
			aria-label = "simple tabs example"
			onChange = {(e, value) => this.setState({tab: value})} 
			>
			< Tab label = "One element chart" value = "simple" / >
			< Tab label = "SuperImposed chart" value = "super" / >
			< /Tabs> 
			< /AppBar>
			{tab === "simple" &&
			< div >
			< AutoComplete
				label = 'Flute'
				value = {this.props.controllerState.tracker_fluteType}
				suggestions = {this.state.fluteTypes}
				onInputChange = {this.onFluteTypeUpdate}
				onValueChange = {this.onFluteTypeChange}
				style = {styles.autoComplete}
				maxSearchResults = {300}
				openOnFocus = {true}
				listStyle = {{maxHeight: 300,overflow: 'auto'}}
				/> 
				< AutoComplete
				label = 'Structure'
				value = {this.props.controllerState.tracker_hmStructType}
				suggestions = {this.state.structureTypes}
				onInputChange = {this.onStructureTypeUpdate}
				onValueChange = {this.onStructureTypeChange}
				style = {styles.autoComplete}
				maxSearchResults = {300}
				openOnFocus = {true}
				listStyle = {{maxHeight: 300,overflow: 'auto'}}
				/>  
				< AutoComplete
				label = 'HalfMoon BarCode'
				value = {this.props.controllerState.tracker_partBarcode}
				suggestions = {this.state.barcodeTypes}
				onInputChange = {this.onBarcodeTypeUpdate}
				onValueChange = {this.onBarcodeTypeChange}
				style = {styles.autoComplete}
				maxSearchResults = {300}
				openOnFocus = {true}
				listStyle = {{maxHeight: 300,overflow: 'auto'}}
				/> 
				< FormControl component = "fieldset" >
					< RadioGroup
				name = "filterBy"
				className = {classes.radioGroup}
				value = {filterBy}
				onChange = {this.onFilterChange}
				 >
					< FormControlLabel value = "runType" control = { < Radio color = "primary" / >} label = "By Run Number" className = {classes.radioButton}/>
					< FormControlLabel value = "runName" control = { < Radio color = "primary" / >} label = "By Run Name" className = {classes.radioButton}/>
					 < /RadioGroup> 
					 < /FormControl>

				< div className = {classes.inputContainer} >
					< TextField
				disabled = {filterBy !== 'runType'}
				select
				label = "Run Number"
				className = {classes.selectField}
				InputProps = {{className: classes.textField}}
				value = {this.props.controllerState.tracker_runTypeNumber}
				onChange = {this.onRunTypeNumberChange}
				suggestions = {this.state.runs}
				SelectProps = {{
				MenuProps: {
				className: classes.itemMenu,
				}
				}} 
				> 
				{this.renderRunNumbers()} 
				< /TextField> 
				< br / >
				< TextField
				disabled = {filterBy !== 'runName'}
				select
				label = "Run Name"
				className = {classes.selectField}
				InputProps = {{className: classes.textField}}
				value = {this.props.controllerState.tracker_runName}
				onChange = {this.onRunNameChange}
				suggestions = {this.state.runs}
				SelectProps = {{
						MenuProps: {
							className: classes.itemMenu,
						}
				}} 
				> 
				{this.renderRunNames()}
				< /TextField>
				< /div> 
				< /div>
			} 
			{tab === "super" &&
			< div >
			< AutoComplete
				label = 'Flute'
				value = {this.props.controllerState.tracker_fluteType}
				suggestions = {this.state.fluteTypes}
				onInputChange = {this.onFluteTypeUpdate}
				onValueChange = {this.onFluteTypeChange}
				style = {styles.autoComplete}
				maxSearchResults = {300}
				openOnFocus = {true}
				listStyle = {{maxHeight: 300,overflow: 'auto'}}
				/> 
				< AutoComplete
				label = 'Structure'
				value = {this.props.controllerState.tracker_hmStructType}
				suggestions = {this.state.structureTypes}
				onInputChange = {this.onStructureTypeUpdate}
				onValueChange = {this.onStructureTypeChange}
				style = {styles.autoComplete}
				maxSearchResults = {300}
				openOnFocus = {true}
				listStyle = {{maxHeight: 300,overflow: 'auto'}}
				/> 
				 < AutoComplete
				label = 'HalfMoon BarCode'
				value = {this.props.controllerState.tracker_partBarcode}
				suggestions = {this.state.barcodeTypes}
				onInputChange = {this.onBarcodeTypeUpdate}
				onValueChange = {this.onBarcodeTypeChange}
				style = {styles.autoComplete}
				maxSearchResults = {300}
				openOnFocus = {true}
				listStyle = {{maxHeight: 300,overflow: 'auto'}}
				/> 
				< FormControl component = "fieldset" >
					< RadioGroup
				name = "filterBy"
				className = {
					classes.radioGroup
				}
				value = {
					filterBy
				}
				onChange = {
						this.onFilterChange
					} >
					< FormControlLabel value = "runType"
				control = { < Radio color = "primary" / >
				}
				label = "By Run Number"
				className = {
					classes.radioButton
				}
				/> < FormControlLabel value = "runName"
				control = { < Radio color = "primary" / >
				}
				label = "By Run Name"
				className = {
					classes.radioButton
				}
				/> < /RadioGroup> < /FormControl>

				< div className = {
						classes.inputContainer
					} >
					< TextField
				disabled = {
					filterBy !== 'runType'
				}
				select
				label = "Run Number"
				className = {
					classes.selectField
				}
				InputProps = {
					{
						className: classes.textField
					}
				}
				value = {
					this.props.controllerState.tracker_runTypeNumber
				}
				onChange = {
					this.onRunTypeNumberChange
				}
				suggestions = {
					this.state.runs
				}
				SelectProps = {
						{
							MenuProps: {
								className: classes.itemMenu,
							}
						}
					} > {
						this.renderRunNumbers()
					} < /TextField> < br / >
					< TextField
				disabled = {
					filterBy !== 'runName'
				}
				select
				label = "Run Name"
				className = {
					classes.selectField
				}
				InputProps = {
					{
						className: classes.textField
					}
				}
				value = {
					this.props.controllerState.tracker_runName
				}
				onChange = {
					this.onRunNameChange
				}
				suggestions = {
					this.state.runs
				}
				SelectProps = {
					{
						MenuProps: {
							className: classes.itemMenu,
						}
					}
				} > {
					this.renderRunNames()
				} < /TextField> < /div>

				< Button
				//disabled={this.props.controllerState.tracker_runName === '' 
				//&& this.props.controllerState.tracker_runTypeNumber === ''}
				variant = "contained"
				className = {
					classes.button
				}
				onClick = {
						this.onIDAdd
					} >
					Add ID < /Button> < br / >
					< div >
					< Typography variant = "subtitle2"
				gutterBottom style = {
						{
							marginTop: 10
						}
					} >
					Selected Ids:
					< /Typography> < div style = {
						styles.wrapper
					} > {
						this.renderChip()
					} < /div> < /div> < /div>
			}

			< /div >
		);
	}
}
export default withStyles(styles)(TrackerHalfMoonController);
