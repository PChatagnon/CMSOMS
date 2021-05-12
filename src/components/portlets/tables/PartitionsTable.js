import React, { Component } from 'react';
import { sortNumbersAsc } from '../../../utils/comparators';
import Datatable from '../generic/datatable/table/Table';

const COLUMNS = [{
    name: 'partition',
    label: 'Partition'
}, {
    name: 'feds',
    label: 'FEDs'
}, {
    name: 'percentage',
    label: 'Percent',
    props: { type: 'linear_progress' },
    style: { minWidth: 120 }
}, {
    name: 'feds_included',
    label: 'FEDs Included'
}, {
    name: 'feds_excluded',
    label: 'FEDs Excluded'
}];

class PartitionsTable extends Component {

    state = {
        data: null
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

        this.props.fetchData('daqreadouts', { sorting: ['partition'] })
            .then(resp => {
                const { data } = resp.data;

                // Handle empty data response
                if (!data.length) {
                    this.setState({ data: null });
                    return this.props.onEmpty();
                }

                // Modify dataset
                let partitions = [];
                data.forEach(row => {
                    const { partition, feds_included, feds_excluded } = row.attributes;

                    const total = feds_included.length + feds_excluded.length;
                    const percentage = feds_included.length * 100 / total;

                    partitions.push({
                        attributes: {
                            partition: partition.toUpperCase(),
                            feds: `${feds_included.length} / ${total}`,
                            percentage: percentage,
                            feds_included: this.fedsToString(feds_included),
                            feds_excluded: this.fedsToString(feds_excluded),
                        }
                    });
                });

                this.setState({ data: partitions });
                this.props.hideLoader();
            })
            .catch(error => this.props.onFailure(error));
    }

    fedsToString = (feds) => {

        const groupToStr = (group) => {
            if (group.length === 1) {
                return group[0] + ' ';
            }
            else {
                return group[0] + '-' + group[group.length - 1] + ' ';
            }
        }

        let groups = [];

        let fedsStr = "";
        const last = (feds.length > 0) ? feds.length - 1 : 0;
        let previous = null;

        let group = [];
        feds.sort(sortNumbersAsc).forEach((current, index) => {
            if (index === 0) {
                // First fed
                group.push(current);
            }
            else {
                if (current > previous + 1) {
                    // New group
                    groups.push(group);
                    fedsStr += groupToStr(group);
                    group = [];
                }
                group.push(current);
            }

            if (index === last) {
                // Last fed
                groups.push(group);
                fedsStr += groupToStr(group);
            }

            previous = current;
        });

        return fedsStr;
    }

    render() {
        const { data } = this.state;
        if (!data) return <div />;

        return (
            <Datatable
                data={data}
                columns={COLUMNS}
                showFooter={false}
                height={this.props.portletHeight}
            />
        );
    }
}

export default PartitionsTable;
