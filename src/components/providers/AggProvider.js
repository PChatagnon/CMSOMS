import axios from 'axios';

const aggPath = '/agg'; 

const fetch = (endpoint, params = {}) => {

    const aggUrl = params.aggpath ? params.aggpath : aggPath;
    let url = aggUrl + '/api/v1/' + endpoint;

    let queryString = [];

    // Projection
    if (params.fields && params.fields.length > 0) {
        /*
            params.fields = ['attribute_name1', '-attribute_name2', ...]

            Order is important!
        */
        queryString.push('fields=' + params.fields.join(','));
    }

    // Pagination
    if (params.pagesize && params.page) {
        /*
            params.pagesize = rows per page
            params.page = page number
            ----
            offset = row offset
            limit = rows per page
        */
        queryString.push('page[offset]=' + ((params.page - 1) * params.pagesize) + '&page[limit]=' + params.pagesize);
    }

    // Filtering
    if (params.filters) {
        /* params.filters = [
                {
                  'attribute' : 'run_number',
                  'operator' : 'gt',
                  'value' : 286520
                },
                ...]
        */
        params.filters.forEach(filter => {
            queryString.push('filter[' + filter.attribute + '][' + filter.operator + ']=' + filter.value);
        });

    }

    // Sorting
    if (params.sorting && params.sorting.length > 0) {
        /*
            params.sorting = ['attribute_name1', '-attribute_name2', ...]

            Order is important!
        */
        queryString.push('sort=' + params.sorting.join(','));
    }

    // Meta
    if (params.include && params.include.length > 0) {
        /*
            params.include = ['meta', 'turbo']
        */
        queryString.push('include=' + params.include.join(','));
    }

    // Custom parameter Group 
    if (params.group) {
        /*  Usage for lumisummaryperrange:
                count - number of groups
                size - group size

            for deadtimesperrange:
                granularity - possible values ['run', 'fill', 'range']

            Note: only one key can be used at a time
        */
        queryString.push('group[' + params.group.key + ']=' + params.group.value);
    }

    if (queryString.length) {
        url += '?' + queryString.join('&');
    }

    // CancelToken
    const requestConfig = params.cancelToken ? { cancelToken: params.cancelToken } : {};
    return axios.get(url, requestConfig);
}

export default { fetch };
