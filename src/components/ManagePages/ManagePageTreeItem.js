import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import { DragSource, DropTarget } from 'react-dnd';
import ManagePageTree from './ManagePageTree';
import { flow } from 'lodash';
import FileFolderOpen from '@material-ui/icons/FolderOpen';
import AvWeb from '@material-ui/icons/Web';

const dragSource = {
    beginDrag(props) {
        return {
            id: props.id,
            parent: props.parent,
            items: props.item.pages
        }
    },

    isDragging(props, monitor) {
        return props.id === monitor.getItem().id
    }
}

function collectSource(connect, monitor) {
    return {
        connectDragSource: connect.dragSource(),
        isDragging: monitor.isDragging()
    }
}

const dropTarget = {

    drop(props, monitor) {
        const dragId = monitor.getItem().id;
        props.dropItem(dragId);
    },

    hover(props, monitor, component) {
        const dragId = monitor.getItem().id;
        const dragParent = monitor.getItem().parent;
        const dragPages = monitor.getItem().items;
        const overId = props.id;
        const overParent = props.parent;

        // Don't replace items with themselves
        if (dragId === overId) {
            return;
        }

        // Don't allow to drop a page on its folder
        if (dragParent === overId) {
            return;
        }

        // Don't allow to drop a folder on its pages
        if (dragId === overParent) {
            return;
        }

        // Don't allow to drop a folder on a page in general
        if (dragPages && overParent) {
            return;
        }

        // Determine rectangle on screen
        const hoverBoundingRect = findDOMNode(component).getBoundingClientRect();

        // Get vertical middle
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

        // Determine mouse position
        const clientOffset = monitor.getClientOffset();

        // Get pixels to the top
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;

        // Only perform the move when the mouse has crossed half of the items height
        // When dragging downwards, only move when the cursor is below 50%
        // When dragging upwards, only move when the cursor is above 50%

        // Dragging downwards
        if (dragId < overId && hoverClientY < hoverMiddleY) {
            return;
        }

        // Dragging upwards
        if (dragId > overId && hoverClientY > hoverMiddleY) {
            return;
        }

        if (!monitor.isOver({ shallow: true })) return;

        const overItem = props.item;

        props.move(dragId, overId, overItem, overParent);

        // Note: we're mutating the monitor item here!
        // Generally it's better to avoid mutations,
        // but it's good here for the sake of performance
        // to avoid expensive index searches.
        monitor.getItem().index = overId;
    }
}

function collectTarget(connect, monitor) {
    return {
        connectDropTarget: connect.dropTarget()
    }
}

const dragSourceStyle = {
    background: 'white',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    marginBottom: -1,
    cursor: 'pointer',
};

const iconStyle = {
    marginRight: 8,
    color: 'gray',
    verticalAlign: 'middle'
};

class ManagePageTreeItem extends Component {

    renderPages(id, pages, move, dropItem, find, click, selectedId) {
        if (this.props.itemType === 'page') return;

        return (<ManagePageTree
            parent={id}
            items={pages}
            move={move}
            dropItem={dropItem}
            find={find}
            click={click}
            selectedId={selectedId}
        />);
    }

    renderIcon(itemType) {
        if (itemType === 'folder') {
            return (<FileFolderOpen style={iconStyle} />);
        }
        return (<AvWeb style={iconStyle} />);
    }

    render() {
        const {
            connectDropTarget, connectDragSource, isDragging,
            item: { id, title }, itemType, move, dropItem, find, click, selectedId
        } = this.props;

        const opacity = isDragging ? 0 : 1;
        const pages = (!this.props.item.pages) ? [] : this.props.item.pages;

        let itemStyle = {
            padding: 8,
            backgroundColor: (selectedId === id) ? 'rgba(0, 0, 0, 0.0980392)' : '',
        };
        if (this.props.newPage || this.props.newFolder)
            itemStyle.color = 'blue'

        let containerStyle = (itemType === 'page') ? {
            paddingLeft: 24,
            paddingRight: 8
        } : {};

        return (
            <div style={{ opacity, ...containerStyle }}>
                <div style={dragSourceStyle}>
                    {connectDragSource(
                        connectDropTarget(
                            <div onClick={click.bind(this, id)} style={itemStyle} >
                                {this.renderIcon(itemType)}
                                {title}
                            </div>
                        )
                    )}
                    {this.renderPages(id, pages, move, dropItem, find, click, selectedId)}
                </div>
            </div>
        );
    }
}

export default flow([
    DragSource('ITEM', dragSource, collectSource),
    DropTarget('ITEM', dropTarget, collectTarget)
])(ManagePageTreeItem);
