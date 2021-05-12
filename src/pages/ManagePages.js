import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import ManageItem from '../components/ManagePages/ManageItem';
import ManagePageTree from '../components/ManagePages/ManagePageTree';
import { loadingCompleted, openSnackbar } from '../actions/appActions';
import { changeURL } from '../actions/mainActions';
import { fetchControllers } from '../actions/controllerActions';
import {
    changePageOrder, changeFolderOrder, addNewFolder,
    deleteFolder, updateFolder, addNewPage, deletePage,
    updatePage, selectManageTreeItem, fetchPages
} from '../actions/pageActions';

function mapStateToProps(state) {
    return {
        workspaces: state.workspaces,
        controllers: state.controllers,
        pages: state.pages,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        ...bindActionCreators({
            changePageOrder, changeFolderOrder, selectManageTreeItem, addNewFolder, openSnackbar,
            deleteFolder, updateFolder, addNewPage, deletePage, updatePage, changeURL, fetchControllers
        }, dispatch),
        dispatch
    };
}

const styles = {
    card: {
        margin: 10,
        marginBottom: 5,
        overflowX: 'hidden'
    },
    title: {
        fontSize: 16
    },
    header: {
        padding: 14,
        paddingRight: 28
    },
    content: {
        overflowY: 'auto',
        height: '75vh',
        padding: 0
    },
    actions: {
        paddingBottom: 6,
        paddingLeft: 14,
    },
}

class ManagePages extends Component {

    constructor(props) {
        super(props);
        this.state = {
            pages: props.pages.pages,
            flatPages: props.pages.flatPages
        };
    }

    componentDidMount() {
        this.props.dispatch(loadingCompleted());
    }

    componentDidUpdate(prevProps) {
        if (this.props.pages.pages === prevProps.pages.pages) return;

        this.setState({
            pages: this.props.pages.pages,
            flatPages: this.props.pages.flatPages
        });
    }

    findItem = item => {
        if (!item) return;
        return this.state.flatPages.find(page => page.id === item);
    }

    removeItem = (id, items) => {
        for (const item of items) {
            if (item.id === id) {
                items.splice(items.indexOf(item), 1);
                return;
            }

            if (item.pages && item.pages.length) {
                this.removeItem(id, item.pages);
            }
        }
    }

    getType = obj => 'folder_id' in obj ? 'page' : 'folder';

    moveItem = (id, overId, overItem, overParent) => {
        // Fetch dragged item data
        const item = this.findItem(id);
        if (!item.id) return;

        // Check if it's a page or a folder
        const itemType = this.getType(item);
        const overType = this.getType(overItem);

        let { pages } = this.state;
        let subPages; // All pages or only parent pages if parent exist

        // If a page was dragged on a different page (can be in a separate folder)
        if (itemType === 'page' && overType === 'page') {
            item.folder_id = overParent;
            item.order_no = overItem.order_no;
            subPages = this.findItem(overParent).pages;
        }

        // If a page was dragged on a folder (happpens only when a folder is empty)
        else if (itemType === 'page' && overType === 'folder') {
            item.folder_id = overId;
            item.order_no = 1;
            subPages = this.findItem(overId).pages;
        }

        // If a folder was dragged (can be dragged only on a different folder)
        else if (itemType === 'folder') {
            [item.order_no, overItem.order_no] = [overItem.order_no, item.order_no]; // Swap order_no
            subPages = pages;
        }

        // Insert item in a right place
        const overItemIndex = subPages.indexOf(overItem);
        this.removeItem(id, pages);
        subPages.splice(overItemIndex, 0, item);

        this.setState({ pages: pages });
    }

    dropItem = itemId => {
        const item = this.findItem(itemId);
        return 'folder_id' in item ?
            this.props.dispatch(changePageOrder(item)) :
            this.props.dispatch(changeFolderOrder(item));
    }

    shouldFolderBeDisabled = () => {
        const { selectedManageTreeItem } = this.props.pages;
        if (!selectedManageTreeItem) return false;
        return selectedManageTreeItem.hasOwnProperty('folder_id') || selectedManageTreeItem.hasOwnProperty('newFolder');
    }

    addNewPage = () => {
        let { pages, flatPages } = this.state;
        const selectedItem = this.props.pages.selectedManageTreeItem;
        const selectedItemType = this.getType(selectedItem);
        let folderId, dest;
        if (selectedItemType === 'page') {
            folderId = selectedItem.folder_id;
            dest = this.findItem(selectedItem.folder_id).pages;
            //overId = dest.indexOf(dest.filter(v => v.id === selectedItem.id).shift()) + 1;
        } else {
            folderId = selectedItem.id;
            dest = selectedItem.pages;
        }
        const item = {
            id: Math.random(),
            folder_id: folderId,
            title: 'New Page',
            description: 'New Page Description',
            owner: 'owner',
            controller_id: 0,
            newPage: true
        };
        dest.push(item);
        flatPages.push(item);
        this.setState({ pages: pages, flatPages: flatPages });
        this.props.dispatch(selectManageTreeItem(item.id));
    }

    addNewFolder = () => {
        let { pages, flatPages } = this.state;
        const item = {
            id: Math.random(),
            title: 'New Folder',
            description: 'New Folder Description',
            owner: 'owner',
            pages: [],
            workspace_id: this.props.workspaces.selectedWorkspace.id,
            newFolder: true
        };
        pages.push(item);
        flatPages.push(item);
        this.setState({ pages: pages, flatPages: flatPages });
        this.props.dispatch(selectManageTreeItem(item.id));
    }

    deleteLocalPage = id => {
        this.removeItem(id, this.state.pages);
        this.props.dispatch(selectManageTreeItem(this.state.flatPages[0].id));
        this.props.openSnackbar('Page was successfully deleted.');
    }

    deleteLocalFolder = id => {
        this.removeItem(id, this.state.pages);
        this.props.dispatch(selectManageTreeItem(this.state.flatPages[0].id));
        this.props.openSnackbar('Folder was successfully deleted.');
    }

    onRefresh = () => {
        this.props.dispatch(fetchPages(this.props.workspaces.selectedWorkspace));
        this.props.openSnackbar('Page was successfully refreshed.');
    }

    renderWorkspaceDescription = () => {
        if (!this.props.workspaces.selectedWorkspace) return '';
        return this.props.workspaces.selectedWorkspace.description;
    }

    render() {
        const { selectedManageTreeItem } = this.props.pages;
        const selectedItem = selectedManageTreeItem ? selectedManageTreeItem : this.props.pages.flatPages[0];
        const selectedItemId = selectedManageTreeItem ? selectedManageTreeItem.id : null;
        const { classes } = this.props;
        return (
            <DndProvider backend={HTML5Backend}>
                <Grid container spacing={0}>
                    <Grid item xs={4}>
                        <Card className={classes.card}>
                            <CardHeader
                                title='Manage Workspace Pages'
                                subtitle={this.renderWorkspaceDescription()}
                                classes={{
                                    title: classes.title,
                                    root: classes.header
                                }}
                            />
                            <Divider light />
                            <CardContent className={classes.content}>
                                <ManagePageTree
                                    parent={null}
                                    items={this.state.pages}
                                    move={this.moveItem}
                                    dropItem={this.dropItem}
                                    find={this.findItem}
                                    click={this.props.selectManageTreeItem}
                                    selectedId={selectedItemId}
                                />
                            </CardContent>
                            <Divider light />
                            <CardActions className={classes.actions}>
                                <Button onClick={this.addNewPage} disabled={this.state.pages.length ?  this.shouldFolderBeDisabled() : true}>
                                    New Page
                                </Button>
                                <Button onClick={this.addNewFolder} disabled={this.shouldFolderBeDisabled()}>
                                    New Folder
                                </Button>
                                <Button onClick={this.onRefresh}>
                                    Refresh
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                    <Grid item xs={8}>
                        {selectedItem &&
                            <ManageItem cols={2} rows={4}
                                openSnackbar={this.props.openSnackbar}
                                workspaces={this.props.workspaces.workspaces}
                                item={selectedItem}
                                fetchingControllers={this.props.controllers.fetchingControllers}
                                fetchControllers={this.props.fetchControllers}
                                controllers={this.props.controllers.controllers}
                                addNewFolder={this.props.addNewFolder}
                                deleteFolder={this.props.deleteFolder}
                                deleteLocalFolder={this.deleteLocalFolder}
                                updateFolder={this.props.updateFolder}
                                updatePage={this.props.updatePage}
                                addNewPage={this.props.addNewPage}
                                deletePage={this.props.deletePage}
                                deleteLocalPage={this.deleteLocalPage}
                                findItem={this.findItem}
                                changeURL={this.props.changeURL}
                                selectedWorkspace={this.props.workspaces.selectedWorkspace}
                            />
                        }
                    </Grid>
                </Grid>
            </DndProvider>
        );
    }
}

export default connect(
        mapStateToProps,
        mapDispatchToProps
    )(withStyles(styles)(ManagePages));

