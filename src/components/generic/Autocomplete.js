import React from 'react';
import { deburr } from 'lodash';
import Downshift from 'downshift';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Popper from '@material-ui/core/Popper';
import Paper from '@material-ui/core/Paper';
import MenuItem from '@material-ui/core/MenuItem';

const styles = {
    container: {
        flexGrow: 1,
        position: 'relative',
        display: 'inline-block',
        marginLeft: 10,
        marginRight: 30,
        minWidth: 200
    },
    containerCompact: {
        flexGrow: 1,
        position: 'relative',
        display: 'inline-block',
        marginLeft: 10,
        marginRight: 30,
        minWidth: 100
    },
    inputRoot: {
        flexWrap: 'wrap',
    },
    inputInput: {
        width: 'auto',
        flexGrow: 1,
    }
};

class Autocomplete extends React.Component {

    constructor() {
        super();
        this.popperNode = null;
    }


    renderInput = inputProps => {
        const { InputProps, classes, ref, ...other } = inputProps;
        return (
            <TextField
                InputProps={{
                    inputRef: ref,
                    classes: {
                        root: classes.inputRoot,
                        input: classes.inputInput,
                    },
                    ...InputProps,
                }}
                {...other}
            />
        );
    }

    renderSuggestion = ({ suggestion, itemProps }) => {
        return (
            <MenuItem
                {...itemProps}
                key={suggestion}
                component="div"
            >
                {suggestion}
            </MenuItem>
        );
    }

    render() {
        const { classes } = this.props;
        return (
            <Downshift onChange={this.props.onValueChange} inputValue={this.props.value}>
                {({
                    getInputProps,
                    getItemProps,
                    getMenuProps,
                    inputValue,
                    isOpen,
                    closeMenu
                }) => (
                        <div className={this.props.compact ? classes.containerCompact : classes.container} style={this.props.style}>
                            {this.renderInput({
                                fullWidth: true,
                                classes,
                                label: this.props.label,
                                disabled: this.props.disabled,
                                placeholder: this.props.placeholder,
                                InputProps: getInputProps({
                                    onChange: event => this.props.onInputChange(event.target.value),
                                    style: this.props.inputStyle
                                }),
                                onKeyDown: event => {
                                    if (event.key === 'Enter') {
                                        this.props.onValueChange(event.target.value);
                                        closeMenu();
                                    }
                                },
                                ref: node => {
                                    this.popperNode = node;
                                }
                            })}
                            <Popper open={isOpen} anchorEl={this.popperNode} style={{ zIndex: 1 }}>
                                <div {...(isOpen ? getMenuProps({}, { suppressRefError: true }) : {})}>
                                    <Paper style={{ marginTop: 8, width: this.popperNode ? this.popperNode.clientWidth : null }} square>
                                        {this.props.suggestions
                                            .filter(
                                                item =>
                                                    !inputValue ||
                                                    item
                                                        .toLowerCase()
                                                        .includes(deburr(inputValue.trim().toLowerCase()))
                                            )
                                            .slice(0, this.props.maxItems ? this.props.maxItems : 5)
                                            .map((suggestion, index) =>
                                                this.renderSuggestion({
                                                    suggestion,
                                                    itemProps: getItemProps({ item: suggestion })
                                                }),
                                            )
                                        }
                                    </Paper>
                                </div>
                            </Popper>
                        </div>
                    )}
            </Downshift>
        );
    }
}

export default withStyles(styles)(Autocomplete);
