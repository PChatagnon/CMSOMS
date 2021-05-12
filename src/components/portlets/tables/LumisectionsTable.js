import React, { Component } from 'react';
import DataTable from '../generic/datatable/DataTable';

const CONFIG = {
    "columns": [
        {
            "label": "LS #",
            "name": "lumisection_number"
        },
        {
            "label": "Start Time",
            "name": "start_time"
        },
        {
            "label": "End Time",
            "name": "end_time"
        },
        {
            "label": "Del. Lumi",
            "name": "delivered_lumi",
            "show_units": true
        },
        {
            "label": "Rec. Lumi",
            "name": "recorded_lumi",
            "show_units": true
        },
        {
            "label": "Init Lumi",
            "name": "init_lumi",
            "show_units": true
        },
        {
            "label": "End Lumi",
            "name": "end_lumi",
            "show_units": true
        },
        {
            "label": "Physics",
            "name": "physics_flag",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "CMS active",
            "name": "cms_active",
            "color_flag": true,
            "show_units": false
        }, {
            "label": "RP Time",
            "name": "rp_time_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "RP SECT 45",
            "name": "rp_sect_45_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "RP SECT 56",
            "name": "rp_sect_56_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "Eb+",
            "name": "ebp_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "Eb-",
            "name": "ebm_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "Ee+",
            "name": "eep_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "Ee-",
            "name": "eem_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "Hbhea",
            "name": "hbhea_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "Hbheb",
            "name": "hbheb_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "Hbhec",
            "name": "hbhec_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "Hf",
            "name": "hf_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "Ho",
            "name": "ho_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "RPC",
            "name": "rpc_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "DT0",
            "name": "dt0_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "DT+",
            "name": "dtp_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "DT-",
            "name": "dtm_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "CSC+",
            "name": "cscp_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "CSC-",
            "name": "cscm_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "Tob",
            "name": "tob_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "Tibtid",
            "name": "tibtid_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "Tec+",
            "name": "tecp_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "Tec-",
            "name": "tecm_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "Bpix",
            "name": "bpix_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "Fpix",
            "name": "fpix_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "ES+",
            "name": "esp_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "ES-",
            "name": "esm_ready",
            "color_flag": true,
            "show_units": false
        },
        {
            "label": "Castor",
            "name": "castor_ready",
            "color_flag": true,
            "show_units": false,
            "hidden": true
        },
        {
            "label": "Zdc",
            "name": "zdc_ready",
            "color_flag": true,
            "show_units": false,
            "hidden": true
        },
        {
            "label": "Beam1 Present",
            "name": "beam1_present",
            "color_flag": true,
            "show_units": false,
            "hidden": true
        },
        {
            "label": "Beam2 Present",
            "name": "beam2_present",
            "color_flag": true,
            "show_units": false,
            "hidden": true
        },
        {
            "label": "Beam1 Stable",
            "name": "beam1_stable",
            "color_flag": true,
            "show_units": false,
            "hidden": true
        },
        {
            "label": "Beam2 Stable",
            "name": "beam2_stable",
            "color_flag": true,
            "show_units": false,
            "hidden": true
        }
    ],
    "endpoint": "lumisections",
    "pagesize": 50,
    "showFooter": true,
    "order": [
        "lumisection_number",
        "asc"
    ],
    "rowsList": [
        50,
        500,
        5000
      ]
};

class LumisectionsTable extends Component {

    render() {
        return (
            <DataTable
                {...this.props}
                configuration={CONFIG}
            />
        );
    }
}

export default LumisectionsTable;