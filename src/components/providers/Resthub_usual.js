import axios from 'axios';

const RESTHUB_URL = '/resthub';

class Resthub {

    static query = (query, rhUrl = RESTHUB_URL) => {
        return axios.post(rhUrl + '/query', query, {
            headers: { 'Content-Type': 'text/plain' },
            responseType: 'text',
            transformResponse: data => data.toString()
        });
    }

    static meta = (qid, rhUrl = RESTHUB_URL) => {
        return axios.get(rhUrl + '/query/' + qid);
    }

    static data = (qid, params = null, mime = 'text/csv', pagesize = null, page = null, rhUrl = RESTHUB_URL) => {

        const config = {
            headers: { 'Accept': mime }
        }

        let url = rhUrl + '/query/' + qid;

        if (pagesize && page) {
            url += '/page/' + pagesize + '/' + page;
        }

        url += '/data';

        if (params) {
            url += '?' + Object.keys(params).reduce(function (a, k) { a.push(k + '=' + encodeURIComponent(params[k])); return a }, []).join('&');
        }

        return axios.get(url, config);
    }

    // Clear cache of the query
    static clear = (qid, rhUrl = RESTHUB_URL) => {
        return axios.delete(rhUrl + '/query/' + qid + '/cache');
    }

    // Get count of the query
    static count = (qid, params, rhUrl = RESTHUB_URL) => {
        let url = rhUrl + '/query/' + qid + '/count';

        if (params) {
            url += '?' + Object.keys(params).reduce(function (a, k) { a.push(k + '=' + encodeURIComponent(params[k])); return a }, []).join('&');
        }

        return axios.get(url);
    }

    // Delete query
    static delete = (qid, rhUrl = RESTHUB_URL) => {
        return axios.delete(rhUrl + '/query/' + qid);
    }

    static json_fast = (qid, params = null, pagesize = null, page = null, rhUrl = RESTHUB_URL) => {
        return Resthub.data(qid, params, 'application/json2', pagesize, page, rhUrl);
    }

    static json = (query, params = null, pagesize = null, page = null, rhUrl = RESTHUB_URL) => {
        return Resthub.query(query, rhUrl)
            .then(qidResp => {
                const qid = qidResp.data;
                return Resthub.data(qid, params, 'application/json', pagesize, page, rhUrl);
            });
    }

    static json2 = (query, params = null, pagesize = null, page = null, rhUrl = RESTHUB_URL) => {
        return Resthub.query(query, rhUrl)
            .then(qidResp => {
                const qid = qidResp.data;
                return Resthub.data(qid, params, 'application/json2', pagesize, page, rhUrl);
            });
    }

    static csv = (query, params = null, pagesize = null, page = null, rhUrl = RESTHUB_URL) => {
        return Resthub.query(query, rhUrl)
            .then(qidResp => {
                const qid = qidResp.data;
                return Resthub.data(qid, params, 'text/csv', pagesize, page, rhUrl);
            });
    }

    static xml = (query, params = null, pagesize = null, page = null, rhUrl = RESTHUB_URL) => {
        return Resthub.query(query, rhUrl)
            .then(qidResp => {
                const qid = qidResp.data;
                return Resthub.data(qid, params, 'text/xml', pagesize, page, rhUrl);
            });
    }

    static lob = (query, params, rhUrl = RESTHUB_URL) => {
        return Resthub.query(query, rhUrl)
            .then(qidResp => {
                const qid = qidResp.data;

                let url = rhUrl + '/query/' + qid + '/0/1/lob';

                if (params) {
                    url += '?' + Object.keys(params).reduce(function (a, k) { a.push(k + '=' + encodeURIComponent(params[k])); return a }, []).join('&');
                }

                return axios.get(url);
            });
    }
}

export default Resthub;
