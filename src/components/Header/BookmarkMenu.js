import React, { useState, useEffect, useCallback, useRef } from "react";

import { Link } from 'react-router-dom'
import MaterialTable from "material-table";

import { getGroups, getBookmarks, createBookmark, updateBookmark, removeBookmark } from "../../actions/bookmarkActions";

import Tooltip from '@material-ui/core/Tooltip';
import { makeStyles } from "@material-ui/core/styles";
import { MenuItem, Dialog, Toolbar, AppBar } from "@material-ui/core";
import { ListItemText } from "@material-ui/core";
import List from "@material-ui/core/List";
import Typography from "@material-ui/core/Typography";
import Slide from '@material-ui/core/Slide';
import { Select } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import Popover from '@material-ui/core/Popover';

import IconButton from "@material-ui/core/IconButton";
import CreateIcon from "@material-ui/icons/Create";
import BookmarkBorderOutlinedIcon from "@material-ui/icons/BookmarkBorderOutlined";
import CloseIcon from "@material-ui/icons/Close";
import ClassIcon from '@material-ui/icons/Class';
import AssignmentOutlinedIcon from '@material-ui/icons/AssignmentOutlined';

import InputAdornment from '@material-ui/core/InputAdornment';

import { cloneDeep } from "lodash";

//fix material-table missing icons
//https://github.com/mbrn/material-table/issues/51
import { forwardRef } from 'react';

import AddBox from '@material-ui/icons/AddBox';
import ArrowUpward from '@material-ui/icons/ArrowUpward';
import Check from '@material-ui/icons/Check';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ChevronRight from '@material-ui/icons/ChevronRight';
import Clear from '@material-ui/icons/Clear';
import DeleteOutline from '@material-ui/icons/DeleteOutline';
import Edit from '@material-ui/icons/Edit';
import FilterList from '@material-ui/icons/FilterList';
import FirstPage from '@material-ui/icons/FirstPage';
import LastPage from '@material-ui/icons/LastPage';
import Remove from '@material-ui/icons/Remove';
import SaveAlt from '@material-ui/icons/SaveAlt';
import Search from '@material-ui/icons/Search';
import ViewColumn from '@material-ui/icons/ViewColumn';

const tableIcons = {
Add: forwardRef((props, ref) => <AddBox {...props} ref={ref} />),
Check: forwardRef((props, ref) => <Check {...props} ref={ref} />),
Clear: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
Delete: forwardRef((props, ref) => <DeleteOutline {...props} ref={ref} />),
DetailPanel: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
Edit: forwardRef((props, ref) => <Edit {...props} ref={ref} />),
Export: forwardRef((props, ref) => <SaveAlt {...props} ref={ref} />),
Filter: forwardRef((props, ref) => <FilterList {...props} ref={ref} />),
FirstPage: forwardRef((props, ref) => <FirstPage {...props} ref={ref} />),
LastPage: forwardRef((props, ref) => <LastPage {...props} ref={ref} />),
NextPage: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
PreviousPage: forwardRef((props, ref) => <ChevronLeft {...props} ref={ref} />),
ResetSearch: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
Search: forwardRef((props, ref) => <Search {...props} ref={ref} />),
SortArrow: forwardRef((props, ref) => <ArrowUpward {...props} ref={ref} />),
ThirdStateCheck: forwardRef((props, ref) => <Remove {...props} ref={ref} />),
ViewColumn: forwardRef((props, ref) => <ViewColumn {...props} ref={ref} />)
};

const Transition = React.forwardRef((props, ref) => <Slide direction="up" {...props} ref={ref} />);

const useStyles = makeStyles(theme => ({

  buttondiv:{
    '& > *': {
      margin: theme.spacing(1)
    }
  },
  paper:{
    padding: theme.spacing(1)
  },
  menuButton: {
    color: 'white',
    marginLeft: 4,
    marginRight: 4,
  },
  title: {
    margin: 0,
    padding: theme.spacing(1),
    left: theme.spacing(1)
  },
  appBar: {
    position: "relative"
  },
  menuItem: {
    fontSize: 14,
    minHeight: 24,
  },
  menuItemMain: {
    fontSize:16,
    minHeight:32,
    height: 36,
    boxSizing: 'content-box'
  },
  selectFieldIcon: {
      fill: 'white',
      'padding-left':'0px',
      cursor: "default"
  },
  selectionItem: {
      color: 'white',
      'padding-top':'7px',
      'padding-left':'0px'
  },
  defaultCursor: {
      cursor: "default"
  }
}));

const pageUrlEditor = "Editor";
const pageTitle = "Page Bookmarks"

const localStorageNameConfig = "OMSPageSelectionBookmarks";
const localStorageLastBackend = "OMSPageSelectionBookmarksLastBackend";
const localStorageLastGroup = "OMSPageSelectionBookmarksLastGroup";
const localStorageLastGroupIdx = "OMSPageSelectionBookmarksLastGroupIdx";
const defaultInherit = "cms_run,cms_fill";

//const defaultBackend="local";
const defaultBackend="central";

function getDefaultBackend() {
  const ret = localStorage.getItem(localStorageLastBackend)
  if (ret === null) {
    localStorage.setItem(localStorageLastBackend, defaultBackend)
    return defaultBackend;
  }
  return ret;
}


function getDefaultGroup() {
  const ret = localStorage.getItem(localStorageLastGroup)
  if (ret === null ) {
    localStorage.setItem(localStorageLastGroup, '')
    localStorage.setItem(localStorageLastGroupIdx, null)
    return '';
  }
  return ret;
}

//material-table compatible column schema
function makeTableSchema(data, pagepath, pageSearch, inherit) {
  let currentOrder = 0;
  if (data.hasOwnProperty(pagepath))
    data[pagepath].forEach(item => {
      if (parseInt(item.order_no) > currentOrder)
        currentOrder = parseInt(item.order_no);
    });
  return [
    {
      title: "Name",
      field: "name",
      initialEditValue:
        "New Bookmark " +
        (data.hasOwnProperty(pagepath) ? data[pagepath].length + 1 : 1)
    },
    {
      title: "Sort Order",
      field: "order_no",
      type: "numeric",
      initialEditValue: currentOrder + 1,
      defaultSort: "asc",
      sorting: true,
      width: 5
    },
    {
      title: "Inherited Parameters",
      field: "inherited",
      initialEditValue: inherit
    },
    {
      title: "Page Path",
      field: "pagepath",
      initialEditValue: pagepath,
      readonly: true,
    },
    {
      title: "Parameters",
      field: "search",
      //initialEditValue: filterSearch(pageSearch, inherit) //removes inherited, but better to clear later
      initialEditValue: filterSearch(pageSearch,'')
    }
  ];
}

//sorting of table entries
function compareEntries(e1, e2) {
  if (e1.order_no > e2.order_no) return 1;
  else if (e1.order_no < e2.order_no) return -1;
  else if (e1.name > e2.name) return 1;
  else if (e1.name < e2.name) return -1;
  return 0;
}

//backend data entry to table data entry
function createDataItem(input,path) {
  return { ...input,
           pagepath: path,
           id: input.id,
           group: input.group
         };
}

//convert backend data store (per path or all paths) to table entries
function convertToTableData(input, path, columnSchema, editing, backend) {
  let out = {
    columns: columnSchema,
    data: [],
    initialState: !editing,
    usingBackend: backend,
    added: [],
    removed: [],
    updated: [],
    allPages: false
  };

  if (path==='*') {
    Object.keys(input).forEach( ipath => {
      input[ipath].forEach(item => {
        const ditem = createDataItem(item,ipath);
        out.data.push(ditem);
      });
    });
    out.allPages=true;
    return out;
  }

  if (input.hasOwnProperty(path)) {
    input[path].forEach(item => {
        out.data.push(createDataItem(item,path));
    });
  }
  return out;
}

//convert table items for current page to local backend data
function convertToStorageDataEntry(inval, page) {
  let input = cloneDeep(inval);
  input.data.forEach((item, index) => {
    if (input.data[index].pagepath !== page) console.log("mismatch");
    //these have been renamed
    delete input.data[index].pagePath;
    delete input.data[index].order;
  });
  return input.data;
}

//convert table items for all pages to local backend data
function convertAllToStorage(inval) {
  let Storage = {};
  let input = cloneDeep(inval);
  inval.data.forEach((item, index) => {
    const page = input.data[index].pagepath;
    let entry = cloneDeep(input.data[index])
    //delete entry.pagepath;
    if (!Storage.hasOwnProperty(page)) {
      Storage[page] = [ entry ];
    }
    else Storage[page].push(entry);
  });
  return Storage;
}

//massage search string to remove 'inherited' parameters
function filterSearch(search, inherited) {
  const searchtmp = search ? search.startsWith("?") ? search.substring(1) : search : "";
  const params = searchtmp.split("&");
  const inheritedList = inherited.split(",");
  let newParams = [];
  params.forEach(param => {
    let found = false;
    inheritedList.forEach(inherited => {
      //only store parameters which are not inherited
      if (
        param !== "" &&
        (param === inherited || param.startsWith(inherited + "="))
      )
        found = true;
    });
    if (!found) newParams.push(param);
  });
  return newParams.join("&");
}


function centralToStoreData(bookMarks) {

  let Storage = {}
  bookMarks.forEach( item => {

    if (!Storage.hasOwnProperty(item.pagepath))
      Storage[item.pagepath]=[];
    if (item.search===null) item.search='';
    if (item.inherited===null) item.inherited='';
    if (item.description===null) item.description='';
    Storage[item.pagepath].push(item);
  });
  return Storage;
}

function fetchLocalBookmarks(storageKey) {
  try {
    return JSON.parse(localStorage.getItem(localStorageNameConfig) || '{}')
  }
  catch {
    console.log("error parsing local storage key " + localStorageNameConfig + " : " + localStorage.getItem(localStorageNameConfig))
  }
  return {};
}

function editCreated(book, bref) {
  const data = [...book.data];
  data.push(book.added[0]);
  bref.data = { ...book, data, added: [], updated:[], removed:[], initialState: true};
  return bref.data;
}

function editUpdated(book, bref) {
  const data = [...book.data];
  data[book.updated[1]]=book.updated[0];
  bref.data = { ...book, data, added: [], updated:[], removed:[], initialState: true};
  return bref.data;
}

function editRemoved(book, bref) {
  const data = [...book.data];
  data.splice(book.removed[1], 1);
  bref.data = { ...book, data, added: [], updated:[], removed:[], initialState: true};
  return bref.data;
}


//React Component
const BookmarkDialog = ({selectedWorkspace, selectedFolder, selectedPage }) => {
  const classes = useStyles();

  const [anchorEl, setAnchorEl] = useState(null);
  const [show, setShow] = useState(false);
  const [editMode, setEditMode] = useState(false);

  //state used to display and edit all site bookmarks
  const [ bookmarks, setBookmarks] = useState({data:[]});

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');

  //ref copy of selectedGroup
  const selectedGroupRef = useRef('')

  const [allPagesMode, setAllPagesMode] = useState(true);
  const [pageModeTooltip, setPageModeTooltip] = useState(false);

  const [ backend, setBackend ] = useState('');
  const [ backendTooltip, setBackendTooltip ] = useState(false);

  const [ popoverEl, setPopoverEl ] = useState(false);
  const [ popoverOpen, setPopoverOpen ] = useState(false);
  const [ popoverError, setPopoverError ] = useState('');

  //get workspace/folder/page from state
  const getPageUrl = useCallback(() => {
    if (!selectedWorkspace || !selectedWorkspace.path.length ||
      !selectedFolder || !selectedFolder.path.length ||
      !selectedPage || !selectedPage.path.length)
      return '/';
    return `/${selectedWorkspace.path}/${selectedFolder.path}/${selectedPage.path}`;
  },[selectedWorkspace,selectedFolder,selectedPage]);

  const usingCentral = useCallback(() => { return backend === "central" }, [backend]);

  //initial call (mount)
  useEffect(() => {

    const bk = getDefaultBackend();

    setBookmarks({
      columns: [],
      data: [],
      added: [],
      updated: [],
      removed: [],
      initialState: true,
      usingBackend: bk,
      allPages: true
    });

    setBackend(bk);
    setSelectedGroup(getDefaultGroup());

  },[]);


  //update on bookmarks
  useEffect(() => {
    if (bookmarks.initialState) {
      return;
    }

    if (!bookmarks.allPages && bookmarks.usingBackend !== "central") {

      //store data to localstorage (this page)
      const pathname = getPageUrl();
      const thisPagePath = pathname.endsWith("/")
        ? pathname.substring(0, pathname.length - 1)
        : pathname;

      let bref = {data:null}
      if (bookmarks.added && bookmarks.added.length)
        setBookmarks(editCreated(bookmarks, bref));
      else if (bookmarks.updated && bookmarks.updated.length)
        setBookmarks(editUpdated(bookmarks, bref));
      else if (bookmarks.removed && bookmarks.removed.length)
        setBookmarks(editRemoved(bookmarks, bref));
      else
        bref.data = bookmarks;

      let localData = fetchLocalBookmarks(localStorageNameConfig);
      localData[thisPagePath] = convertToStorageDataEntry(bref.data, thisPagePath);
      localStorage.setItem(localStorageNameConfig, JSON.stringify(localData));
      return;
    }


    let bref = {data:null}
    if (bookmarks.usingBackend==="local") {

      if (bookmarks.added && bookmarks.added.length)
        setBookmarks(editCreated(bookmarks, bref));
      else if (bookmarks.updated && bookmarks.updated.length)
        setBookmarks(editUpdated(bookmarks, bref));
      else if (bookmarks.removed && bookmarks.removed.length)
        setBookmarks(editRemoved(bookmarks, bref));
      else
        bref.data = bookmarks;

      const localData = convertAllToStorage(bref.data);

      localStorage.setItem(localStorageNameConfig, JSON.stringify(localData));
    }

    else if (bookmarks.usingBackend==="central") {

      if (bookmarks.added && bookmarks.added.length) {
        //we don't want to rerun this when group changes anyway
        const groupname  = selectedGroupRef.current;
        //let groupname = selectedGroup;
        async function waitCreate() {
          let bookmark_id = null;
          let errmsg = null;
          const newBookmark = {...(bookmarks.added[0]), groupname: groupname}
          await new Promise(resolve => createBookmark(newBookmark, resolve)).then(val => {bookmark_id = val[0]; errmsg = val[1]});
          if (bookmark_id===null) {
            setPopoverOpen(true)
            setPopoverEl(true)
            setPopoverError(errmsg)
            console.log('error creating bookmark')
            return;
          }
          const bookTemp = editCreated(bookmarks, bref); 
          bookTemp.data[bookTemp.data.length-1].id = bookmark_id;
          bookTemp.data[bookTemp.data.length-1].groupname = groupname;
          setBookmarks(bookTemp);
        }
        waitCreate();
      }
      else if (bookmarks.updated && bookmarks.updated.length) {
        async function waitUpdate() {
          let ret_status;
          let errmsg = null;
          await new Promise(resolve => updateBookmark(bookmarks.updated[0].id, bookmarks.updated[0], resolve))
                           .then(val => {ret_status = val[0]; errmsg = val[1]});
          if (!ret_status) {
            setPopoverOpen(true)
            setPopoverEl(true)
            setPopoverError(errmsg)
            console.log('error updating bookmark')
            return;
          }
          setBookmarks(editUpdated(bookmarks, bref));
        }
        waitUpdate();
      }
      else if (bookmarks.removed && bookmarks.removed.length) {
        async function waitRemove() {
          let ret_status;
          let errmsg = null;
          await new Promise(resolve => removeBookmark(bookmarks.removed[0].id,resolve))
                           .then(val => {ret_status = val[0]; errmsg = val[1]});
          if (!ret_status) {
            setPopoverOpen(true)
            setPopoverEl(true)
            setPopoverError(errmsg)
            console.log('error deleting bookmark')
            return;
          }
          setBookmarks(editRemoved(bookmarks, bref));
        }
        waitRemove();
      }
    }

  //}, [ bookmarks, selectedGroup, getPageUrl ]);
  }, [ bookmarks, getPageUrl ]);


 
  //get page data from the localstorage when show is clicked or editMode toggle
  useEffect(() => {
    //update ref
    selectedGroupRef.current = selectedGroup;
    if (show) {
      const pathname = getPageUrl();
      const search = window.location.search;
      const thisPagePath = pathname.endsWith("/")
        ? pathname.substring(0, pathname.length - 1)
        : pathname;
      const thisPageSearch = search.startsWith("/")
        ? search.substring(1)
        : search;
      const thisPageInherit = defaultInherit;

      async function updater() {

        //retrieve group list if central display mode
        let storeData;
        if (usingCentral()) {
          let retObj = []
          await new Promise( resolve => getGroups(resolve)).then(val => {retObj = val});
          setGroups(retObj || []);

          if (!selectedGroup) storeData = {};
          else {
            let retObj = {}
            await new Promise( resolve => getBookmarks(selectedGroup, resolve)).then(val => {retObj = val});
            storeData = centralToStoreData(retObj);
          }
        }
        else {
          storeData = fetchLocalBookmarks(localStorageNameConfig);
        }

        const thisTableSchema = makeTableSchema(
          storeData ? storeData : {},
          thisPagePath,
          thisPageSearch,
          thisPageInherit
        );

        //eslint complained about access to bookmarks here
        //if (!isEqual(bookmarks,newBookmarks))
        const newBookmarks = convertToTableData(storeData, (!allPagesMode && !usingCentral()) ? thisPagePath : '*', thisTableSchema, editMode, backend);
        setBookmarks(newBookmarks);
      }

      updater();
    }
  }, [ show, editMode, getPageUrl, allPagesMode, backend, selectedGroup, usingCentral ]);



  //handle update of group choice

  useEffect(() => {

    //update ref
    selectedGroupRef.current = selectedGroup;
    if (!selectedGroup || selectedGroup === '') {
      if (groups.length > 0) {
        const g = getDefaultGroup();
        if (g) {
          setSelectedGroup(g);
          return;
        }
        localStorage.setItem(localStorageLastGroup, groups[0].name)
        localStorage.setItem(localStorageLastGroupIdx, 1)
        setSelectedGroup(groups[0].name)
      }
      return;
    }

    let found=true;
    groups.forEach( item => {
      if (item.name === selectedGroup) found=true;
    })
    if (!found) {
      if (groups.length) {
        localStorage.setItem(localStorageLastGroup, groups[0].name)
        localStorage.setItem(localStorageLastGroupIdx, 1)
        setSelectedGroup(groups[0].name);
      }
      else {
        //localStorage.setItem(localStorageLastGroup, '')
        //setSelectedGroup('');
      }
    }

  }, [groups, selectedGroup]);


  //// DISABLEDeslint-disable-line react-hooks/exhaustive-deps
  //

  //Editor table
  function renderEditTable() {
    return (
      <MaterialTable
        title={pageUrlEditor}
        icons={tableIcons}
        options={{
          pageSize: 5,
        }}
        columns={bookmarks.columns}
        data={bookmarks.data}
        editable={{
          onRowAdd: newData =>
            new Promise(resolve => {
              setTimeout(() => {
                resolve();
                setBookmarks(prevState => {
                  let newDataTmp = newData;
                  newDataTmp.search = filterSearch(
                    newData.search,
                    newData.inherited
                  );
                  newDataTmp.order_no = parseInt(newDataTmp.order_no)
                  return { ...prevState, added: [newDataTmp], updated:[], removed:[], initialState: false, usingBackend: backend };
                });
              }, 0);
            }),
          onRowUpdate: (newData, oldData) =>
            new Promise(resolve => {
              setTimeout(() => {
                resolve();
                if (oldData) {
                  setBookmarks(prevState => {
                    let newDataTmp = newData;
                    newDataTmp.search = filterSearch(
                      newData.search,
                      newData.inherited
                    );
                    const index = prevState.data.indexOf(oldData);
                    newDataTmp.order_no = parseInt(newDataTmp.order_no)
                    return { ...prevState, added:[], updated: [newDataTmp, index], removed:[], initialState: false, usingBackend: backend };
                  });
                }
              }, 0);
            }),
          onRowDelete: oldData =>
            new Promise(resolve => {
              setTimeout(() => {
                resolve();
                setBookmarks(prevState => {
                  const index = prevState.data.indexOf(oldData);
                  const removed = prevState.data[index];
                  return { ...prevState, added:[], updated:[], removed: [removed, index], initialState: false, usingBackend: backend };
                });
              }, 0);
            })
        }}
      />
    );
  }

  // Menu rows

  function renderEntries() {
    let cnt = 0;
    return bookmarks.data.sort(compareEntries).map(entry => {
      const name = entry.name;

      //extract reserved params
      const search = window.location.search;
      const currentSearch = search.startsWith("?")
        ? search.substring(1)
        : search;
      let searchList = currentSearch.split("&");
      let searchListFiltered = [];
      searchList.forEach(param => {
        let found = false;
        entry.inherited.split(",").forEach(inheritIn => {
          const inherit = inheritIn.trim();
          if (
            param !== "" &&
            (param === inherit || param.startsWith(inherit + "="))
          )
            found = true;
        });
        if (found) searchListFiltered.push(param);
      });
      const searchFiltered = searchListFiltered.join("&");

      const searchRaw =
        "?" +
        (searchFiltered.length ? searchFiltered + (entry.search.length? "&" : "" ) : "") +
        entry.search;

      const linkParams = getPageUrl() === entry.pagepath ?
        { search:searchRaw, state:'urlSelect' } : { pathname: entry.pagepath, search:searchRaw }

      cnt++;
      return (
        <MenuItem
          onClick={handleClose}
          target="_self"
          key={cnt}
          component={Link}
          to={linkParams}
          className={classes.menuItemMain}
        >
          <ListItemText primary={name} secondary={entry.pagepath} />

        </MenuItem>
      );
    });
  }

  //Main Menu

  //open dialog
  const handleOpen = event => {
    setAnchorEl(event.currentTarget);
    setEditMode(false);
    setShow(true);
  };

  //close dialog
  const handleClose = () => {
    if (editMode) setEditMode(false);
    else {
      setEditMode(false);
      setShow(false);
      setAnchorEl(null);
    }
  };

  const renderGroupsMenu = () => {

      const sortedGroups = groups
        .sort((a, b) => (a.name > b.name) ? 1 : -1);

      return(
            <Tooltip title='Select bookmark group' open={pageModeTooltip}>
              <Select
                className={classes.menuItem}
                style={{ paddingLeft: 5 }}
                classes={{ icon: classes.selectFieldIcon, root: classes.selectionItem }}
                disableUnderline
                onMouseEnter={() => setPageModeTooltip(true)}
                onMouseLeave={() => setPageModeTooltip(false)}
                onMouseDown={() => setPageModeTooltip(false)}
                defaultValue={ () => {
                    let i = localStorage.getItem(localStorageLastGroupIdx);
                    if (i==='null' || !i) i=1;
                    if (i>sortedGroups.length) setSelectedGroup('');
                    else if (sortedGroups[i-1].name!==selectedGroup) {
                      setSelectedGroup(sortedGroups[i-1].name);
                    }
                    return i;
                }}
                onChange={ event => {
                    const newGroup = sortedGroups[event.target.value-1].name;
                    localStorage.setItem(localStorageLastGroup, newGroup)
                    localStorage.setItem(localStorageLastGroupIdx, event.target.value)
                    setSelectedGroup(newGroup);
                  }
                }
                startAdornment={
                  <InputAdornment position="start">
                    <AssignmentOutlinedIcon className={classes.selectFieldIcon} />
                  </InputAdornment>
                }
              >
                { renderGroups(sortedGroups) }
              </Select>
            </Tooltip>
      );
  }

  const renderGroups = (sortedGroups) => {

    if (!sortedGroups.length) return;

    return sortedGroups.map( (g,index) =>
      <MenuItem
        key={g.name}
        className={classes.menuItem}
        value={index + 1}
      >
        {g.title}
      </MenuItem>
    );
  }

  const renderPageModeMenu = () => {
      return(
            <Tooltip title='Show all or per-page entries' open={pageModeTooltip}>
              <Select
                className={classes.menuItem}
                style={{ paddingLeft: 5 }}
                classes={{ icon: classes.selectFieldIcon, root: classes.selectionItem }}
                disableUnderline
                onMouseEnter={() => setPageModeTooltip(true)}
                onMouseLeave={() => setPageModeTooltip(false)}
                onMouseDown={() => setPageModeTooltip(false)}
                defaultValue={allPagesMode || usingCentral() ? 1 : 2}
                onChange={ event => setAllPagesMode(event.target.value===1 ? true : false)}
                startAdornment={
                  <InputAdornment position="start">
                    <AssignmentOutlinedIcon className={classes.selectFieldIcon} />
                  </InputAdornment>
                }
              >
                <MenuItem
                  key="pagemodeselect-all"
                  className={classes.menuItem}
                  value={1}
                >
                    Show all
                </MenuItem>
                <MenuItem
                  key="pagemodeselect-current"
                  className={classes.menuItem}
                  value={2}
                >
                    Page
                </MenuItem>
              </Select>
            </Tooltip>
      );
  }

  const renderBackendMenu = () => {
      return(
            <Tooltip title='Show personal or server-provided links' open={backendTooltip}>
              <Select
                className={classes.menuItem}
                style={{ paddingLeft: 5 }}
                classes={{ icon: classes.selectFieldIcon, root: classes.selectionItem }}
                disableUnderline
                onMouseEnter={() => setBackendTooltip(true)}
                onMouseLeave={() => setBackendTooltip(false)}
                onMouseDown={() => setBackendTooltip(false)}
                defaultValue={backend}
                onChange={ event => {
                    localStorage.setItem(localStorageLastBackend, event.target.value);
                    return setBackend(event.target.value);
                  }
                }
                startAdornment={
                  <InputAdornment position="start">
                    <ClassIcon className={classes.selectFieldIcon} />
                  </InputAdornment>
                }
              >
                <MenuItem
                  key="backend-local"
                  className={classes.menuItem}
                  value={"local"}
                >
                    Browser
                </MenuItem>
                <MenuItem
                  key="backend-central"
                  className={classes.menuItem}
                  value={"central"}
                >
                  Central
                </MenuItem>
              </Select>
            </Tooltip>
      );
  }

  return (
      <React.Fragment>
        <Tooltip title={pageTitle} >
          <IconButton  className={classes.menuButton}
            aria-controls="simple-menu"
            aria-haspopup="true"
            onClick={handleOpen}
          >
            <BookmarkBorderOutlinedIcon />
          </IconButton>
        </Tooltip>
        <Dialog
          onClose={handleClose}
          aria-labelledby="bookmark-dialog"
          fullWidth
          fullScreen={editMode}
          open={show}
          TransitionComponent={editMode ? Transition : undefined}
        >
          <AppBar className={classes.appBar}>
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={handleClose}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
              <Typography variant="h6" className={classes.title}>
                {pageTitle}
              </Typography>
              { renderBackendMenu() }
              { !usingCentral() && renderPageModeMenu() }
              { usingCentral() && renderGroupsMenu() }
              <IconButton
                autoFocus
                color="inherit"
                edge="end"
                aria-label="edit"
                onClick={() => setEditMode(!editMode)}
              >
                <CreateIcon />
              </IconButton>

              <Popover
                id="mouse-over-popover"
                classes={{
                  paper: classes.paper
                }}
                open={popoverOpen}
                anchorEl={popoverEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'center',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'center',
                }}
              >
                <Box className={classes.buttondiv}>
                  <div>
                    <Box color={"error.main"}>
                      Error:
                    </Box>
                    <div>
                      {popoverError}
                    </div>
                  </div>
                  <Button
                    variant={"outlined"}
                    onClick={ () => { setPopoverOpen(false); setPopoverEl(false); } }
                    id='loadAllBtn'
                    size="medium"
                    color="primary"
                  >
                    Close
                  </Button>
                </Box>
              </Popover>

            </Toolbar>
          </AppBar>

          {}
          <List
            id="simple-menu"
            open={Boolean(anchorEl)}
            onClose={handleClose}
            autoFocus={false}
          >
            {!editMode && renderEntries()}
            {editMode && renderEditTable()}
          </List>
        </Dialog>
      </React.Fragment>
  );
}


export default BookmarkDialog;
