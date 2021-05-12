import React, { Component } from 'react';
import Table from '../generic/datatable/DataTableMD';
import Popover from '@material-ui/core/Popover';
import { withStyles } from '@material-ui/core/styles';

const styles = {
    popover: {
        overflowX: 'auto'
    },
    container: {
        width: 600,
        height: 350
    },
    path: {
        maxWidth: '100%',
    },
    error: {
        maxWidth: 450,
        marginLeft: 'auto',
        marginRight: 'auto',
        display: 'block'
    }
};

class HLTPathRatesTable extends Component {

    state = {
        anchorEl: null,
        path: null,
        fill: null,
        error: false
    }

    onPopover = (event, row) => {
        this.setState({
            anchorEl: event.currentTarget,
            path: row.attributes.path_name,
            fill: row.attributes.fill_number,
            error: false,
        });
    }

    handleClose = () => {
        this.setState({
            anchorEl: null,
            path: null,
            fill: null
        });
    }

    renderImage = () => {
        const { error, path, fill } = this.state;
        const { classes } = this.props;
        if (!path || !fill) return;

        return (
            <div className={classes.container}>
                <img
                    src={
                        error ?
                            '/images/image_unavailable.png' :
                            `/api/resources/rateplots/${fill}/${path}`
                    }
                    alt=''
                    onError={() => this.setState({ error: true })}
                    className={error ? classes.error : classes.path}
                />
            </div>
        );
    }

    render() {
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
                    {...this.props}
                    onPopover={this.onPopover}
                />
            </div>
        );
    }
}

export default withStyles(styles)(HLTPathRatesTable);