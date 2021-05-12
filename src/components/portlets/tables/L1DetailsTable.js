import React, { Component } from 'react';
import Datatable from '../generic/datatable/table/Table';

const COLUMNS = [
    {
        name: 'run_number', label: 'Run',
        props: {
            href: '/cms/runs/report?cms_run=%',
            params: ['run_number'],
            type: 'link'
        }
    },
    { name: 'l1_hlt_mode_stripped', label: 'L1/HLT Mode' },
    { name: 'l1_menu', label: 'L1 Menu' },
    { name: 'l1_menu_key', label: 'L1 Menu key' },
    { name: 'l1_key_stripped', label: 'L1 key' },
    { name: 'gt_key', label: 'uGT key' },
    { name: 'run_settings_key_stripped', label: 'Run settings key' },
    { name: 'calo_trigger_keys', label: 'Calo trigger keys', style: { fontWeight: 'bold' } },
    { name: 'calol1', label: 'CALO L1' },
    { name: 'calol2', label: 'CALO L2' },
    { name: 'ecal', label: 'ECAL' },
    { name: 'hcal', label: 'HCAL' },
    { name: 'muon_trigger_keys', label: 'Muon trigger keys', style: { fontWeight: 'bold' } },
    { name: 'ugmt', label: 'uGMT' },
    { name: 'bmtf', label: 'BMTF' },
    { name: 'dt', label: 'DT' },
    { name: 'cppf', label: 'CPPF' },
    { name: 'emtf', label: 'EMTF' },
    { name: 'omtf', label: 'OMTF' },
    { name: 'rpc', label: 'RPC' },
    { name: 'twinmux', label: 'TwinMux' },
];

class L1DetailsTable extends Component {

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

        this.props.fetchData('l1configurationkeys')
            .then(resp => {
                const { data } = resp.data;

                // Handle empty data response
                if (!data.length) {
                    this.setState({ data: null });
                    return this.props.onEmpty();
                }

                // Modify dataset
                const rowData = data[0].attributes;
                const l1details = {
                    run_number: rowData.run_number,
                    l1_hlt_mode_stripped: rowData.l1_hlt_mode_stripped,
                    l1_menu: rowData.l1_menu,
                    l1_menu_key: rowData.l1_menu_key,
                    l1_key_stripped: rowData.l1_key_stripped,
                    gt_key: rowData.gt_key,
                    run_settings_key_stripped: rowData.run_settings_key_stripped,
                    calo_trigger_keys: '',
                    calol1: rowData.calo_trigger_keys.calol1,
                    calol2: rowData.calo_trigger_keys.calol2,
                    ecal: rowData.calo_trigger_keys.ecal,
                    hcal: rowData.calo_trigger_keys.hcal,
                    muon_trigger_keys: '',
                    ugmt: rowData.muon_trigger_keys.ugmt,
                    bmtf: rowData.muon_trigger_keys.bmtf,
                    dt: rowData.muon_trigger_keys.dt,
                    cppf: rowData.muon_trigger_keys.cppf,
                    emtf: rowData.muon_trigger_keys.emtf,
                    omtf: rowData.muon_trigger_keys.omtf,
                    rpc: rowData.muon_trigger_keys.rpc,
                    twinmux: rowData.muon_trigger_keys.twinmux
                }

                this.setState({ data: [{ attributes: l1details }] });
                this.props.hideLoader();
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

export default L1DetailsTable;
