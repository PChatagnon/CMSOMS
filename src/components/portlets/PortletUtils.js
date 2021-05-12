import { cloneDeep } from 'lodash';


export const queryToFilters = (query, params, selectors) => {
    // Translate query keys (if it's defined as a portlet selector) into API filters

    const portletFilters = params.filters || [];
    if (!query || !selectors || !selectors.length) return portletFilters;

    let filters = [...portletFilters];

    Object.keys(query).forEach(key => {
        const selector = selectors.find(s => s.attributes.name === key);
        if (!selector) return; // Filter out selectors which portlet does not suppot

        const { attribute, operator } = selector.attributes;
        const found = portletFilters.find(f =>
            f.attribute === attribute &&
            f.operator === operator
        );
        // Do not add the same filter two times
        if (found) return;

        filters.push({
            attribute: attribute,
            operator: operator,
            value: getFilterValue(key, query[key], selector, params)
        });
    });

    return filters;
}

const getFilterValue = (key, value, selector, params) => {

    const { data_type, value: selectorValue } = selector.attributes;

    if (data_type === "DATE") {

        // Add seconds for DATE type selectors if it's not present in the value
        // Example: cms_date_to=2019-06-26 becomes filter[start_time][GE]=2019-05-26 00:00:00
        // Depending on presentation_timestamp param seconds can be JSON:API specific - "T00:00:00Z"

        if (value.length === 10) { // does not include seconds
            const seconds = params.include && params.include.includes('presentation_timestamp') ? " 00:00:00" : "T00:00:00Z";
            return value + seconds;
        }
    }

    if (data_type === "BOOLEAN") {

        // For BOOLEAN selectors check whether value is defined in the selector object
        // Example: cms_fill_protonsOnly=true becomes filter[fill_type_runtime][EQ]=PROTONS

        if (value && selectorValue) return selectorValue;
    }

    return value;
}

export const createAdaptedSelectors = (portletSelectors, configSelectors) => {
    let newSelectors = []
    Object.keys(configSelectors).forEach(key => {
        const selector = portletSelectors.find(s => s.attributes.name === key);
        if (!selector)
            return;
        let modifiedSelector = (JSON.parse(JSON.stringify(selector)));  // deep copy for the time being
        modifiedSelector.attributes.attribute = configSelectors[key];
        newSelectors.push(modifiedSelector);
    });
    return newSelectors;
}

export const createAdaptedSelectorsKeepAll = (portletSelectors, configSelectors) => {
    let newSelectors = cloneDeep(portletSelectors);
    newSelectors.forEach(selector => {
        Object.keys(configSelectors).forEach(key => {
            if (selector.attributes.name === key)
                selector.attributes.attribute = configSelectors[key];
        });
    });
    return newSelectors;
}