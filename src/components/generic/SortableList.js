import React from 'react';
import {
    SortableContainer,
    SortableElement
} from 'react-sortable-hoc';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

const SortableItem = SortableElement(({ value, dense, styles }) => {
    return (
        <ListItem dense={dense} style={styles && styles.listItem ? styles.listItem : {}} button >
            <ListItemText
                primary={value}
                secondary={null}
            />
        </ListItem>
    );
});

export default SortableContainer(({ items, dense, styles }) => {
    return (
        <List dense={dense} style={styles && styles.list ? styles.list : {}}>
            {items.map((value, index) => (
                <SortableItem key={`item-${index}`} index={index} value={value.label} styles={styles} dense={dense} />
            ))}
        </List>
    );
});