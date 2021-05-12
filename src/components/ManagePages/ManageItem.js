import React, { Component } from 'react';
import { Loader } from '../generic/Spinner';
import ManageFolder from './ManageFolder';
import ManagePage from './ManagePage';

class ManageItem extends Component {

    componentDidMount() {
        // Fetch controllers if:
        // 1) workspaces are already loaded
        // 2) controllers are not yet fetched
        // 3) not fetching controllers at the moment

        if (!this.props.fetchingControllers && !this.props.controllers) {
            this.props.fetchControllers();
        }
    }

    render() {
        if (!this.props.item || !this.props.controllers) {
            return <Loader />;
        }

        const itemType = 'folder_id' in this.props.item ? 'page' : 'folder';
        if (itemType === 'folder') {
            return (
                <ManageFolder
                    item={this.props.item}
                    updateFolder={this.props.updateFolder}
                    addNewFolder={this.props.addNewFolder}
                    deleteFolder={this.props.deleteFolder}
                    deleteLocalFolder={this.props.deleteLocalFolder}
                    selectedWorkspace={this.props.selectedWorkspace}
                    openSnackbar={this.props.openSnackbar}
                />
            );
        }
        return (
            <ManagePage
                item={this.props.item}
                workspaces={this.props.workspaces}
                controllers={this.props.controllers}
                updatePage={this.props.updatePage}
                addNewPage={this.props.addNewPage}
                deletePage={this.props.deletePage}
                deleteLocalPage={this.props.deleteLocalPage}
                findItem={this.props.findItem}
                changeURL={this.props.changeURL}
                selectedWorkspace={this.props.selectedWorkspace}
                openSnackbar={this.props.openSnackbar}
            />
        );

    }
}

export default ManageItem;