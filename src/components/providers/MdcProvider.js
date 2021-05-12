import axios from 'axios';

const mdcUrl = '/mdc/resources/';

const fetch = (endPoint, params = {}) => {

    let url = mdcUrl + endPoint + '/data';
    let queryString = [];

    // Projection
    if (params.fields) {
        /* 
            params.fields = ['attribute_name1', '-attribute_name2', ...]

            Order is important!
        */
        queryString.push('fields=' + params.fields.join(','));
    }

    // Pagination (page)
    if (params.page) {
        /*
            params.page = page number
        */
        queryString.push('page[number]=' + params.page);
    }

    // Pagination (pagesize)
    if (params.pagesize) {
        /*
           params.pagesize = rows per page
        */
        queryString.push('page[size]=' + params.pagesize);
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
    if (params.sorting) {
        /* 
            params.sorting = ['attribute_name1', '-attribute_name2', ...]

            Order is important!
        */
        queryString.push('sort=' + params.sorting.join(','));
    }

    // Exclude
    if (params.exclude) {
        /*
            params.exclude = ['param1', 'param2', ...]

            Currently only 'total_matches' param is supported
        */
        queryString.push('exclude=' + params.exclude.join(','));
    }

    if (queryString.length) {
        url += '?' + queryString.join('&');
    }

    return axios.get(url);
}

export default { fetch };
