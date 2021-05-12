import React, { Component } from 'react';
import Datatable from '../generic/datatable/table/Table';
import moment from 'moment';

class YearlySummaryTable extends Component {

    constructor(props) {
        super(props);
        this.state = {
            data: null
        };
        this.columns = [{
            name: 'name',
            label: 'Name'
        }, {
            name: 'val1',
            label: 'Value',
            show_units: true
        }, {
            name: 'val2',
            label: 'Value2',
            props: {
                type: 'cell_click',
                clickHandler: (row) => {
                    const url = row.linkType === 'fill' ?
                    `/cms/fills/report?cms_fill=${row.linkValue}` :
                    `/cms/fills/summary?cms_fill_from=${row.linkValue[0]}&cms_fill_to=${row.linkValue[1]}`;
                    return this.props.changeURL(url);
                }
            }
        }, {
            name: 'val3',
            label: 'Value3'
        }];
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

        this.props.fetchData('yearlystatistics', { page: 1, include: ['turbo', 'presentation_timestamp'] })
            .then(resp => {
                if (!resp.data.data.length) {
                    this.setState({ data: null });
                    return this.props.onEmpty();
                }
                const { attributes } = resp.data.data[0];
                const { row: meta } = resp.data.data[0].meta;

                const tableData = [
                    {
                        attributes: {
                            name: 'Year',
                            val1: attributes.year,
                            val2: attributes.runtime_type,
                            val3: '',
                        }
                    }, {
                        attributes: {
                            name: 'Peak Instantaneous Stable Luminosity',
                            val1: attributes.peak_luminosity.value.toFixed(2),
                            val2: 'Fill - ' + attributes.peak_luminosity.fill,
                            val3: attributes.peak_luminosity.timestamp,
                            linkType: 'fill',
                            linkValue: attributes.peak_luminosity.fill
                        },
                        units: { val1: { units: meta['peak_luminosity.value'].units } },
                        props: { val2: { show_link: true } }
                    }, {
                        attributes: {
                            name: 'Maximum Interactions per Crossing (pileup)',
                            val1: attributes.maximum_pileup.value.toFixed(2),
                            val2: 'Fill - ' + attributes.maximum_pileup.fill,
                            val3: attributes.maximum_pileup.timestamp,
                            linkType: 'fill',
                            linkValue: attributes.maximum_pileup.fill
                        },
                        props: { val2: { show_link: true } }
                    }, {
                        attributes: {
                            name: 'Maximum Luminosity Delivered in one Fill',
                            val1: attributes.maximum_delivered_luminosity_per_fill.value.toFixed(2),
                            val2: 'Fill - ' + attributes.maximum_delivered_luminosity_per_fill.fill,
                            val3: attributes.maximum_delivered_luminosity_per_fill.timestamp,
                            linkType: 'fill',
                            linkValue: attributes.maximum_delivered_luminosity_per_fill.fill
                        },
                        units: { val1: { units: meta['maximum_delivered_luminosity_per_fill.value'].units } },
                        props: { val2: { show_link: true } }
                    }, {
                        attributes: {
                            name: 'Maximum Luminosity Recorded in one Fill [efficiency]',
                            val1: attributes.maximum_recorded_luminosity_per_fill.value.toFixed(2),
                            val2: 'Fill - ' + attributes.maximum_recorded_luminosity_per_fill.fill,
                            val3: attributes.maximum_recorded_luminosity_per_fill.timestamp,
                            linkType: 'fill',
                            linkValue: attributes.maximum_recorded_luminosity_per_fill.fill
                        },
                        units: { val1: { units: meta['maximum_recorded_luminosity_per_fill.value'].units } },
                        props: { val2: { show_link: true } }
                    }, {
                        attributes: {
                            name: 'Maximum Luminosity Delivered in one Day',
                            val1: attributes.maximum_delivered_luminosity_per_day.value.toFixed(2),
                            val2: 'Day - ' + attributes.maximum_delivered_luminosity_per_day.day,
                            val3: attributes.maximum_delivered_luminosity_per_day.date,
                        },
                        units: { val1: { units: meta['maximum_delivered_luminosity_per_day.value'].units } }
                    }, {
                        attributes: {
                            name: 'Maximum Luminosity Recorded in one Day[efficiency]',
                            val1: attributes.maximum_recorded_luminosity_per_day.value.toFixed(2) + ` [${(attributes.maximum_recorded_luminosity_per_day.efficiency * 100).toFixed(2)} %]`,
                            val2: 'Day - ' + attributes.maximum_recorded_luminosity_per_day.day,
                            val3: attributes.maximum_recorded_luminosity_per_day.date,
                        },
                        units: { val1: { units: meta['maximum_recorded_luminosity_per_day.value'].units } }
                    }, {
                        attributes: {
                            name: 'Maximum Luminosity Delivered in one Week',
                            val1: attributes.maximum_delivered_luminosity_per_week.value.toFixed(2),
                            val2: 'Week - ' + attributes.maximum_delivered_luminosity_per_week.week,
                            val3: 'Start Date - ' + attributes.maximum_delivered_luminosity_per_week.start_date,
                        },
                        units: { val1: { units: meta['maximum_delivered_luminosity_per_week.value'].units } }
                    }, {
                        attributes: {
                            name: 'Maximum Luminosity Recorded in one Week [efficiency]',
                            val1: attributes.maximum_recorded_luminosity_per_week.value.toFixed(2) + ` [${(attributes.maximum_recorded_luminosity_per_week.efficiency * 100).toFixed(2)} %]`,
                            val2: 'Week - ' + attributes.maximum_recorded_luminosity_per_week.week,
                            val3: 'Start Date - ' + attributes.maximum_recorded_luminosity_per_week.start_date,
                        },
                        units: { val1: { units: meta['maximum_recorded_luminosity_per_week.value'].units } }
                    }, {
                        attributes: {
                            name: 'Maximum Luminosity Delivered in one Month',
                            val1: attributes.maximum_delivered_luminosity_per_month.value.toFixed(2),
                            val2: 'Month - ' + moment.monthsShort(attributes.maximum_delivered_luminosity_per_month.month - 1),
                            val3: '' //attributes.maximum_delivered_luminosity_per_month.timestamp,
                        },
                        units: { val1: { units: meta['maximum_delivered_luminosity_per_month.value'].units } }
                    }, {
                        attributes: {
                            name: 'Maximum Luminosity Recorded in one Month [efficiency]',
                            val1: attributes.maximum_recorded_luminosity_per_month.value.toFixed(2) + ` [${(attributes.maximum_recorded_luminosity_per_month.efficiency * 100).toFixed(2)} %]`,
                            val2: 'Month - ' + moment.monthsShort(attributes.maximum_recorded_luminosity_per_month.month - 1),
                            val3: '' //attributes.maximum_recorded_luminosity_per_month.timestamp,
                        },
                        units: { val1: { units: meta['maximum_recorded_luminosity_per_month.value'].units } }
                    }, {
                        attributes: {
                            name: 'Maximum Colliding Bunches',
                            val1: attributes.maximum_bunches.value,
                            val2: 'Fill - ' + attributes.maximum_bunches.fill,
                            val3: attributes.maximum_bunches.timestamp,
                            linkType: 'fill',
                            linkValue: attributes.maximum_bunches.fill
                        },
                        props: { val2: { show_link: true } }
                    }, {
                        attributes: {
                            name: 'Longest Time in Stable Beams for one Fill',
                            val1: attributes.longest_fill.value.toFixed(2),
                            val2: 'Fill - ' + attributes.longest_fill.fill,
                            val3: attributes.longest_fill.timestamp,
                            linkType: 'fill',
                            linkValue: attributes.longest_fill.fill
                        },
                        units: { val1: { units: 'hours' } },
                        props: { val2: { show_link: true } }
                    }, {
                        attributes: {
                            name: 'Longest Time in Stable Beams for one Day',
                            val1: attributes.longest_time_stable_beams_per_day.value.toFixed(2),
                            val2: 'Day - ' + attributes.longest_time_stable_beams_per_day.day,
                            val3: attributes.longest_time_stable_beams_per_day.date,
                        },
                        units: { val1: { units: 'hours' } }
                    }, {
                        attributes: {
                            name: 'Longest Time in Stable Beams for one Week',
                            val1: attributes.longest_time_stable_beams_per_week.value.toFixed(2),
                            val2: 'Week - ' + attributes.longest_time_stable_beams_per_week.week,
                            val3: 'Start Date - ' + attributes.longest_time_stable_beams_per_week.start_date,
                        },
                        units: { val1: { units: 'hours' } }
                    }, {
                        attributes: {
                            name: 'Longest Time in Stable Beams for one Month',
                            val1: attributes.longest_time_stable_beams_per_month.value.toFixed(2),
                            val2: 'Month - ' + moment.monthsShort(attributes.longest_time_stable_beams_per_month.month - 1),
                            val3: '' //attributes.longest_time_stable_beams_per_month.timestamp,
                        },
                        units: { val1: { units: 'hours' } }
                    }, {
                        attributes: {
                            name: 'Fastest Turnaround Time to Stable Beams',
                            val1: attributes.fastest_beam_turnaround.value.toFixed(2),
                            val2: 'Fills - ' + attributes.fastest_beam_turnaround.fill1 + ' to ' + attributes.fastest_beam_turnaround.fill2,
                            val3: attributes.fastest_beam_turnaround.end_fill1  + ' - ' + attributes.fastest_beam_turnaround.start_fill2,
                            linkType: 'fill_range',
                            linkValue: [attributes.fastest_beam_turnaround.fill1, attributes.fastest_beam_turnaround.fill2]
                        },
                        units: { val1: { units: 'hours' } },
                        props: { val2: { show_link: true } }
                    }, {
                        attributes: {
                            name: 'Best Recording Efficiency By Lumi for one Fill',
                            val1: attributes.best_efficiency_per_fill.value.toFixed(2),
                            val2: 'Fill - ' + attributes.best_efficiency_per_fill.fill,
                            val3: attributes.best_efficiency_per_fill.timestamp,
                            linkType: 'fill',
                            linkValue: attributes.best_efficiency_per_fill.fill
                        },
                        units: { val1: { units: '\\%' } },
                        props: { val2: { show_link: true } }
                    }];

                this.setState({ data: tableData });
                this.props.hideLoader();
            })
            .catch(error => this.props.onFailure(error));
    }

    render() {
        const { data } = this.state;
        if (!data) return <div />;

        return (
            <Datatable
                vertical={false}
                data={data}
                columns={this.columns}
                showFooter={false}
                hideHeader={true}
                height={this.props.portletHeight}
            />
        );
    }
}

export default YearlySummaryTable;