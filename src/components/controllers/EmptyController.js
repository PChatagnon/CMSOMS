import React, { Component } from 'react';

class EmptyController extends Component {

    static controllerHeight = 140;

    static controllerInit() {
        return {};
    }

    render() {
        return (
            <div></div>
        );
    }
}

export default EmptyController;
