import React, { Component } from 'react';

class StaticValue extends Component {

    render() {
        return (
            <div
                style={{
                    overflowY: 'auto',
                    maxHeight: this.props.portletHeight
                }}
            >
                {this.props.configuration.value}
            </div>
        );
    }
}

export default StaticValue;
