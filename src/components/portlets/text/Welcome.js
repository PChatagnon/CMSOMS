import React, { Component } from 'react';
import blue from '@material-ui/core/colors/blue';
import { Link } from 'react-router-dom';

class Welcome extends Component {

    render() {
        return (
            <div style={{ overflowY: 'auto', height: this.props.portletHeight, lineHeight: 1.8 }}>
                <p style={{ marginTop: 10, marginLeft: 2 }}>
                    During the Long Shutdown 2 this entry page is showing the info for the last week of data taking in 2018.
                </p>
                <p>
                    The OMS (Online Monitoring System) is the successor of the current WbM. The new system will gradually expand during 2018 to provide additional services.<br />
                    Please explore the new system and report any issues you may find to <a target="_blank" rel="noopener noreferrer" href="https://its.cern.ch/jira/projects/CMSOMS/issues" style={{ color: blue[600] }}>Jira</a>.
                </p>
                <p>
                    If you are the first time visitor we encourage you to complete this <Link to={'/cms/index/tutorial'} style={{ color: blue[600] }}>tutorial</Link>.<br />
                    It will introduce you to the main concepts of the system, will get you comfortable with GUI and productive quickly.
                </p>
                <p>
                    Note that "Summary" is an operational list of data objects that can be filtered by date range, flags, etc. while "Report" is detailed information on a single data item.
                </p>
                <p>All dates are displayed in UTC.</p>
                <p style={{ marginBottom: 0 }}>Enjoy!</p>
            </div >
        );
    }
}

export default Welcome;
