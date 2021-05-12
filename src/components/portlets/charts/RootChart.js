import React, { Component } from 'react';

class RootChart extends Component {

    constructor() {
        super();
        this.state = { histo: 11 };
    }

    componentDidMount() {
        const intervalId = setInterval(() => {
            if (this.state.histo > 300) {
                this.setState({ histo: 11 });
            } else {
                this.setState({ histo: this.state.histo + 10 });
            }
        }, 2000);
        this.setState({ intervalId: intervalId });
    }

    componentWillUnmount() {
        clearInterval(this.state.intervalId);
    }

    render() {
        const imgSrc = `/rps/demo/instlumi/histo?{%22n%22:${this.state.histo}}`;
        return (
            <div style={{
                textAlign: 'center',
                paddingTop: 20,
                paddingBottom: 20,
            }}>
                <img src={imgSrc} alt="" style={{ maxWidth: '90%', maxHeight: '90%' }} />
            </div >
        );
    }
}

export default RootChart;
