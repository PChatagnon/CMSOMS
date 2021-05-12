import React from 'react';

class PortletNotFound extends React.Component {

    render() {
        return (
            <div style={{ overflowY: 'auto', height: this.props.portletHeight, lineHeight: 1.8 }}>
                <p style={{ marginTop: 10, marginLeft: 2 }}>
                    Portlet Not Found.
                </p>
            </div >
        );
    }
}

export default PortletNotFound;
