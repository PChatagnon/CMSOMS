import React, { Component } from 'react';
import Datatable from '../generic/datatable/table/Table';

const COLUMNS = [
    {
        label: "Config Name",
        name: "config_name",
        valueStyle: { textAlign: 'right' }
    },
    {
        label: "Config Id",
        name: "config_id",
        valueStyle: { textAlign: 'right' }
    }
];

class HLTTriggerDetails extends Component {

    constructor(props) {
        super(props);

        this.state = {
            data: null
        }
    }

    componentDidMount() {
        this.loadData();
    }

    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, this.loadData);
        this.props.shouldRefresh(this.props, this.loadData);
    }

    loadData = () => {
        this.props.showLoader();
        const params = { page: 1, pagesize: 1000, include: ['turbo'] };

        this.props.fetchData('hltprescalesets', params)
            .then(resp => {
                const { data } = resp.data;

                // Handle empty data response
                if (!data.length) {
                    this.setState({ data: null });
                    return this.props.onEmpty();
                }

                const { attributes } = resp.data.data[0];
                const tableData = [{
                        attributes: {
                            config_name: attributes.config_name,
                            config_id: attributes.config_id
                        }
                    }];

                this.setState({ data: tableData });
                return this.props.hideLoader();
            })
            .catch(error => this.props.onFailure(error));
    }

    render() {
        const { data } = this.state;
        if (!data) return <div />;

        return (
            <Datatable
                data={data}
                columns={COLUMNS}
                showFooter={false}
                vertical={true}
                height={this.props.portletHeight}
            />
        );
    }
}

export default HLTTriggerDetails;
