const DEADTIME_KEYS = [
    { key: "total_deadtime", label: "Total" },
    { key: "tts", label: "TTS" },
    { key: "trigger_rules", label: "Trigger Rules" },
    { key: "bunch_mask", label: "Bunch Mask" },
    { key: "re_tri", label: "ReTri" },
    { key: "apve", label: "APVE" },
    { key: "daq_backpressure", label: "DAQ Backpressure" },
    { key: "calibration", label: "Calibration" },
    { key: "software_pause", label: "Software Pause" },
    { key: "firmware_pause", label: "Firmware Pause" }
];

export const modifyL1Data = (response, type) => {
    // Convert each column into row
    if (!response.data.data.length) {
        return Promise.resolve({ data: { meta: [], data: [] } });
    }

    let { attributes } = response.data.data[0];
    let meta = response.data.meta.fields;

    delete attributes.run_number;
    delete attributes.first_lumisection_number;
    delete attributes.last_lumisection_number;

    let rows = [];
    DEADTIME_KEYS.forEach(d => {
        const key = type + '_' + d.key;
        rows.push({
            key: key,
            name: d.label,
            count: attributes[key].counter,
            percent: attributes[key].percent
        });
    });

    return Promise.resolve({
        data: {
            meta: meta,
            data: rows.map(row => { return { attributes: row }; })
        }
    });
}

export const modifyL1TriggerRates = (response) => {
    // Convert each column into row
    let attributes = {};
    let meta = {};

    if (response.data.data.length > 0) {
        attributes = response.data.data[0].attributes;
        delete attributes.run_number;
        delete attributes.first_lumisection_number;
        delete attributes.last_lumisection_number;
        delete attributes.start_time;
        meta = response.data.meta.fields;
    }

    let rows = [];

    Object.keys(attributes).sort().forEach(key => {
        rows.push({
            key: key,
            name: key in meta ? meta[key].title : key,
            count: attributes[key].counter,
            rate: attributes[key].rate
        });
    });

    return Promise.resolve({
        data: {
            meta: meta,
            data: rows.map(row => { return { attributes: row }; })
        }
    });
}

export const modifyL1ConfigKeys = (response) => {
    // Convert each column into row
    let attributes = {};
    let meta = {};

    if (response.data.data.length > 0) {
        attributes = response.data.data[0].attributes;
        meta = response.data.meta.fields;
    }

    let rows = [];

    Object.keys(attributes).sort().forEach(key => {
        const val = attributes[key];
        rows.push({
            key: key,
            name: key in meta ? meta[key].title : key,
            value: typeof val !== 'object' ? val : null,
        });
    });

    return Promise.resolve({
        data: {
            meta: meta,
            data: rows.map(row => { return { attributes: row }; })
        }
    });
}