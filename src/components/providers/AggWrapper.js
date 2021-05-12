import AggProvider from './AggProvider';
import { modifyL1Data, modifyL1TriggerRates, modifyL1ConfigKeys } from './AggUtils';
import axios from 'axios';

class AggWrapper {

    constructor(url, params) {
        this.url = url;
        this.params = { ...params };
        this.params.query = params.query || {};
        this.params.filters = params.filters || [];
        this.params.sorting = params.sorting || [];
        this.params.include = params.include || [];

        this.includeMeta(); // Remove this once meta will be included by default in API
    }

    sort = (attribute, order = 'asc') => {
        if (this.params.sorting.includes('-' + attribute)) return;
        if (this.params.sorting.includes(attribute)) return;

        const sortAttr = (order === 'asc' ? '' : '-') + attribute;
        this.params.sorting.push(sortAttr);
    }

    filter = (attribute, operator, value) => {
        /* params.filters = [
                {
                  'attribute' : 'run_number',
                  'operator' : 'EQ',
                  'value' : 286520
                },
                ...]

            Operators:
            null = Equal
            ''  = Equal
            EQ  = Equal
            NEQ = Not Equal
            GT  = Greater than
            GE  = Greater than or Equal
            LT  = Less than
            LE  = Less than or Equal
            LIKE = LIKE (works only with strings. %value, value%)
        */

        if (!value) return;
        this.params.filters.push({
            attribute: attribute,
            operator: operator ? operator : 'EQ',
            value: value
        });
    }

    // Meta

    includeMeta = () => {
        if (!this.params.include.includes('meta')) {
            this.params.include.push('meta');
        }
    }

    // Dates

    addDatetimeRange = (start_time = 'start_time', end_time = 'end_time') => {
        const { datetime_from, datetime_to } = this.params.query;
        if (!datetime_from || !datetime_to) return;

        const from = this.params.include.includes('presentation_timestamp') ?
            datetime_from.replace('T', ' ').replace('Z', '') :
            datetime_from;

        const to = this.params.include.includes('presentation_timestamp') ?
            datetime_to.replace('T', ' ').replace('Z', '') :
            datetime_to;

        // Temporary remove dynamically added datetime filters
        this.params.filters = this.params.filters.filter(f => f.attribute !== 'start_time' && f.attribute !== 'end_time');

        this.filter(start_time, 'GE', from);
        this.filter(end_time, 'LE', to);
    }

    // Fetch

    fetch = () => {

        switch (this.url) {

            case 'runs':
                // Sorting
                this.sort('run_number', 'desc');

                return AggProvider.fetch('runs', this.params);

            case 'runkeys':
                // Sorting
                this.sort('run_number', 'desc');

                return AggProvider.fetch('runkeys', this.params);

            case 'deadtimesperrange':
                // Set default group granularity to run
                const { group } = this.params;
                this.params.group = group ? group : { key: 'granularity', value: 'run' };

                return AggProvider.fetch('deadtimesperrange', this.params);

            case 'fills':
                // Sorting
                this.sort('fill_number', 'desc');

                return AggProvider.fetch('fills', this.params);

            case 'downtimes':
                // Sorting
                this.sort('start_time', 'desc');

                return AggProvider.fetch('downtimes', this.params);

            case 'lumisections':
                // Sorting
                this.sort('run_number', 'asc');
                this.sort('lumisection_number', 'asc');

                return AggProvider.fetch('lumisections', this.params);


            // L1 Configuration keys (L1 Details)
            case 'l1configurationkeysvertical':
                return AggProvider.fetch('l1configurationkeys', this.params)
                    .then(resp => modifyL1ConfigKeys(resp));

            /***
             *  L1 Algorithm Triggers
             */

            // L1 Trigger Triggers per lumisection (last lumi)
            case 'l1algorithmtriggerslastlumi':

                // Add Last Lumi filter only if bit is not specified
                const { cms_l1_bit } = this.params.query;
                const { filters } = this.params;
                if (!cms_l1_bit && !filters.find(f => f.attribute === 'bit')) {
                    this.filter('lumisection_number', 'EQ', -1);
                }

                // Set default group granularity to lumisection
                this.params.group = { key: 'granularity', value: 'lumisection' };

                // Sorting
                this.sort('lumisection_number', 'asc');
                return AggProvider.fetch('l1algorithmtriggers', this.params);

            /***
             *  HLT Rates
             */

            case 'hltpathratesperlumisection':

                // Add Last Lumi filter only if there are no other filters
                const { filters: lumiFilters } = this.params;
                if (!lumiFilters.find(f => f.attribute === 'last_lumisection_number')) {
                    this.filter('last_lumisection_number', 'EQ', -1);
                }

                // Set default group granularity to lumisection
                this.params.group = { key: 'granularity', value: 'lumisection' };

                return AggProvider.fetch('hltpathrates', this.params);

            /*                
                case 'hltpathrates':
                    // Set default group granularity to run
                    this.params.group = { key: 'granularity', value: 'run' };
    
                    return AggProvider.fetch('hltpathrates', this.params);
            */

            /***
             *  L1 Trigger Rates
             */

            // TODO: change this name so that other portlets can access endpoint without modifying it
            case 'modifiedl1triggerrates':
                // Set default group granularity to run
                this.params.group = this.params.group
                    ? this.params.group
                    : { key: 'granularity', value: 'run' };

                return AggProvider.fetch('l1triggerrates', this.params)
                    .then(resp => modifyL1TriggerRates(resp));

            // L1 Trigger Rates for datatables
            case 'modifiedl1triggerratesperlumi':
                // Set default group granularity to lumisection
                this.params.group = { key: 'granularity', value: 'lumisection' };

                this.filter('last_lumisection_number', 'EQ', -1);
                return AggProvider.fetch('l1triggerrates', this.params)
                    .then(resp => modifyL1TriggerRates(resp));

            /***
             *  L1 Overall Deadtimes
             */

            case 'overalldeadtimes':
                // Set default group granularity to run
                this.params.group = this.params.group
                    ? this.params.group
                    : { key: 'granularity', value: 'run' };

                return AggProvider.fetch('deadtimes', this.params)
                    .then(resp => modifyL1Data(resp, 'overall'));

            // Latest (only one) L1 Overall Deadtimes per lumisection
            case 'latestl1overalldeadtimesperlumisection':
                this.sort('lumisection_number', 'desc');
                this.params.group = { key: 'granularity', value: 'lumisection' };
                return AggProvider.fetch('deadtimes', { ...this.params, page: 1, pagesize: 1 })
                    .then(resp => modifyL1Data(resp, 'overall'));

            /***
             *  L1 Beam Active Deadtimes
             */

            case 'beamactivedeadtimes':
                // Set default group granularity to run
                this.params.group = this.params.group
                    ? this.params.group
                    : { key: 'granularity', value: 'run' };

                return AggProvider.fetch('deadtimes', this.params)
                    .then(resp => modifyL1Data(resp, 'beamactive'));

            // Latest (only one) L1 Beam Active Deadtimes per lumisection
            case 'latestl1beamactivedeadtimesperlumisection':
                this.sort('lumisection_number', 'desc');

                return AggProvider.fetch('deadtimes', { ...this.params, page: 1, pagesize: 1 })
                    .then(resp => modifyL1Data(resp, 'beamactive'));

            /***
            *  Summaries
            */

            case 'lumisummariesperrange':
                //Filters
                this.addDatetimeRange('start_time', 'start_time');
                return AggProvider.fetch('lumisummariesperrange', this.params);

            default:
                return AggProvider.fetch(this.url, this.params);
        }
    }
}

export default {
    fetch(url, params) {
        return new AggWrapper(url, params)
            .fetch()
            .catch(error => {
                if (axios.isCancel(error)) {
                    console.log('Request canceled:', error);
                }
                throw error;
            })
    }
};
