import React from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';

const styles = {
    button: {
        minWidth: 30,
        minHeight: 30,
        opacity: 0.54,
        marginTop: 14,
        verticalAlign: 'bottom',
        padding: 0
    },
}
export const ControllerPrevButton = props => (
    <Tooltip title={props.title ? props.title : 'Previous page'} style={{ verticalAlign: 'bottom' }} >
        <span>
            <Button
                id='prevButton'
                key={'prev'}
                disabled={props.disabled || false}
                style={{ ...styles.button, ...props.style }}
                onClick={props.handleClick}
                size="small"
            >
                <NavigateBeforeIcon />
            </Button>
        </span>
    </Tooltip>
);

export const ControllerNextButton = props => (
    <Tooltip title={props.title ? props.title : 'Next page'} style={{ verticalAlign: 'bottom' }} >
        <span>
            <Button
                id='nextButton'
                key={'next'}
                disabled={props.disabled || false}
                style={{ ...styles.button, marginLeft: -20, ...props.style }}
                onClick={props.handleClick}
                size="small"
            >
                <NavigateNextIcon />
            </Button>
        </span>
    </Tooltip>
);
