import React, { Component } from 'react';
import Table from '../generic/datatable/DataTableMD';
import Popover from '@material-ui/core/Popover';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
    popover: {
        overflowX: 'auto'
    },
    container: {
        width: 600,
        height: 350
    },
    trigger: {
        maxWidth: '100%',
    },
    error: {
        maxWidth: 450,
        marginLeft: 'auto',
        marginRight: 'auto',
        display: 'block'
    }
});

class L1AlgoTriggerRatesTable extends Component {

    state = {
        anchorEl: null,
        trigger: null,
        fill: null,
        error: false
    }

    onPopover = (event, row) => {
        this.setState({
            anchorEl: event.currentTarget,
            trigger: row.attributes.name,
            fill: row.attributes.fill_number,
            error: false,
        });
    }

    handleClose = () => {
        this.setState({
            anchorEl: null,
            trigger: null,
            fill: null
        });
    }

    renderImage = () => {
        const { error, trigger, fill } = this.state;
        const { classes } = this.props;
        if (!trigger || !fill) return;

        return (
            <div className={classes.container}>
                <img
                    src={
                        error ?
                            '/images/image_unavailable.png' :
                            `/api/resources/rateplots/${fill}/${trigger}`
                    }
                    alt=''
                    onError={() => this.setState({ error: true })}
                    className={error ? classes.error : classes.trigger}
                />
            </div>
        );
    }

    render() {
        let props = {...this.props};
        props.nested = { initial_prescale: { prescale: 'initial_prescale' }, final_prescale: { prescale: 'final_prescale' }, };
        const { anchorEl } = this.state;
        return (
            <div>
                <Popover
                    open={Boolean(anchorEl)}
                    anchorEl={anchorEl}
                    onClose={this.handleClose}
                    anchorOrigin={{
                        vertical: 'center',
                        horizontal: 'left',
                    }}
                    transformOrigin={{
                        vertical: 'center',
                        horizontal: 'right',
                    }}
                >
                    <div className={this.props.classes.popover}>
                        {this.renderImage()}
                    </div>
                </Popover>
                <Table
                    {...props}
                    onPopover={this.onPopover}
                />
            </div>
        );
    }
}

export default withStyles(styles)(L1AlgoTriggerRatesTable);