import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { MuiPickersUtilsProvider, DatePicker } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';

const styles = {
    picker: {
        flexGrow: 1,
        position: 'relative',
        width: 200,
        display: 'inline-block',
        marginLeft: 10,
        marginRight: 10,
        marginTop: 28
    }
};

const GenericDatePicker = props => {
    return (
        <MuiPickersUtilsProvider utils={MomentUtils}>
            <DatePicker
                style={props.styles}
                className={props.classes.picker}
                label={props.label}
                value={props.value}
                disabled={props.disabled}
                onChange={props.onChange}
                autoOk
                format={"YYYY-MM-DD"}
            />
        </MuiPickersUtilsProvider>
    );
};

export default withStyles(styles)(GenericDatePicker);