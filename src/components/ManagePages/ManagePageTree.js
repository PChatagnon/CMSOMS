import React, { Component } from 'react';
import ManagePageTreeItem from './ManagePageTreeItem';

export default class ManagePageTree extends Component {

    renderItems() {
        let renderedItems;
        if (this.props.items) {
            const { items, parent, move, dropItem, find, click, selectedId } = this.props;
            renderedItems = items.map(item =>
                <ManagePageTreeItem
                    key={item.id}
                    id={item.id}
                    parent={parent}
                    item={item}
                    itemType={item.hasOwnProperty('folder_id') ? 'page' : 'folder'}
                    move={move}
                    dropItem={dropItem}
                    find={find}
                    click={click}
                    selectedId={selectedId}
                    newPage={item.newPage}
                    newFolder={item.newFolder}
                />
            );
        }
        return renderedItems;
    }

    render() {
        const treeStyle = { paddingBottom: (this.props.items.length > 0) ? '1em' : '' };
        return (
            <div style={treeStyle}>
                {this.renderItems()}
            </div>
        )
    }
}
