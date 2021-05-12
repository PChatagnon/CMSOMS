import React, { Component } from 'react';
import Datatable from '../../../../../components/portlets/generic/datatable/table/Table';
import { getCurrentUTCTime } from '../../../../../utils/dateUtils';

const COLUMNS = [
    {
        label: "Current Time",
        name: "current_time"
    },
    {
        label: "Heartbeat",
        name: "heartbeat"
    },
];

class CSCLastValueHeartbeat extends Component {

    constructor(props) {
        super(props);
        this.timer = null;
        this.heartbeat = '';
        this.state = {
            data: null
        };
        const { endpoint = 'subsystems/csc/highvoltage/heartbeat' } = props.configuration;
        this.endpoint = endpoint;
    }

    componentDidMount() {
        this.loadData();
    }

    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, this.loadData);
        this.props.shouldRefresh(this.props, this.loadData);
    }

    componentWillUnmount() {
        clearInterval(this.timer);
    }

    loadData = () => {
        this.props.showLoader();
        const params = { page: 1, include: ['presentation_timestamp'] };

        this.props.fetchData(this.endpoint, params)
            .then(resp => {
                const { data } = resp.data;

                // Handle empty data response
                if (!data) {
                    this.setState({ data: null });
                    return this.props.onEmpty();
                }

                this.heartbeat = data.attributes.heartbeat + ' UTC';
                this.timer = setInterval(() => this.updateData(), 1000);
                this.updateData();
                this.props.hideLoader();
            })
            .catch(error => this.props.onFailure(error));
    }

    updateData = () => {
        this.setState({
            data: [{
                attributes: {
                    heartbeat: this.heartbeat,
                    current_time: getCurrentUTCTime() + ' UTC',
                }
            }]
        });
    }

    render() {
        const { data } = this.state;
        if (!data) return <div />;

        return (
            <Datatable
                vertical={true}
                data={data}
                columns={COLUMNS}
                showFooter={false}
                height={this.props.portletHeight}
            />
        );
    }
}

export default CSCLastValueHeartbeat;
