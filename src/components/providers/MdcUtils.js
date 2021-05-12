
const LUMI_UNITS = {
    "18": "Mb^{-1}",
    "21": "kb^{-1}",
    "24": "b^{-1}",
    "27": "mb^{-1}",
    "30": "mub^{-1}",
    "33": "nb^{-1}",
    "36": "pb^{-1}",
    "39": "fb^{-1}",
    "42": "ab^{-1}",
    "45": "zb^{-1}",
    "48": "yb^{-1}"
};

/*

    Sets units for Lumi attributes according to its scale

*/

export const setLumiUnits = (response) => {
    const { attributes } = response.data.meta;

    // Proceed only if lumi attributes are found in response meta
    if ('recorded_lumi' in attributes ||
        'delivered_lumi' in attributes ||
        'lost_lumi' in attributes) {

        // Iterate through all the data and set units for each attribute
        response.data.data.forEach(row => {
            if (!row.meta) return;

            const { attributes } = row.meta;

            if ('recorded_lumi' in attributes) {
                attributes.recorded_lumi.unit = LUMI_UNITS[attributes.recorded_lumi.scale];
                attributes.recorded_lumi.scale = null;
            }

            if ('delivered_lumi' in attributes) {
                attributes.delivered_lumi.unit = LUMI_UNITS[attributes.delivered_lumi.scale];
                attributes.delivered_lumi.scale = null;
            }

            if ('lost_lumi' in attributes) {
                attributes.lost_lumi.unit = LUMI_UNITS[attributes.lost_lumi.scale];
                attributes.lost_lumi.scale = null;
            }
        });
    }

    return response;
}

export const modifyL1Data = (response) => {
    // Convert each column into row
    let attributes = {};
    let meta = {};
    let coeff = null;

    if (response.data.data.length > 0) {
        attributes = response.data.data[0].attributes;
        coeff = attributes.counter_coefficient;
        delete attributes.counter_coefficient;
        delete attributes.run_number;
        meta = response.data.meta.attributes;
    }

    let rows = [];

    Object.keys(attributes).sort().forEach(key => {
        rows.push({
            name: key in meta ? meta[key].title : key,
            count: (attributes[key] * coeff).toFixed(0),
            percent: attributes[key]
        });
    });

    // Move 'Total' row to the bottom
    const total = rows.find(row => row.name === "Total");
    const reducedRows = rows.filter(row => row.name !== "Total");
    rows = reducedRows.concat(total);

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
        meta = response.data.meta.attributes;
    }

    let rows = [];

    Object.keys(attributes).sort().forEach(key => {
        if (key.includes('_rate')) return;
        rows.push({
            name: key in meta ? meta[key].title.replace(' count', '') : key,
            count: attributes[key],
            rate: attributes[key.replace('count', 'rate')],
        });
    });

    return Promise.resolve({
        data: {
            meta: meta,
            data: rows.map(row => { return { attributes: row }; })
        }
    });
}