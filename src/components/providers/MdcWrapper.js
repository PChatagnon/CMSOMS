import MdcProvider from './MdcProvider';
import { formatDateStringURL } from '../../utils/dateUtils';
import { setLumiUnits, modifyL1Data, modifyL1TriggerRates } from './MdcUtils';

class MdcWrapper {

    constructor(url, params) {
        this.url = url;
        this.params = { ...params };
    }

    sort = (attribute, order = 'asc') => {
        if (!this.params.sorting) {
            this.params.sorting = [];
        }
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

            MDC Operators:
            EQ = Equal
            NE = Not equal
            LT = Lower than
            LE = Lower or equal
            GT = Greater than
            GE = Greater or equal
            NL = Null ( 1 - IS NULL, 0 - NOT NULL )
            LI = Like ( String pattern )
            IN = In ( Array of comma separated values )

        */

        if (!this.params.filters) {
            this.params.filters = [];
        }

        if (value) {
            this.params.filters.push({
                attribute: attribute,
                operator: operator ? operator : 'EQ',
                value: value
            })
        }
    }

    // Runs

    addRunRange = () => {
        const { cms_run_to, cms_run_from } = this.params;
        if (!cms_run_to || !cms_run_from) return;

        this.filter('run_number', 'GE', cms_run_from);
        this.filter('run_number', 'LE', cms_run_to);
    }

    addRunSingle = () => {
        const { cms_run } = this.params;
        if (!cms_run) return;

        this.filter('run_number', 'EQ', cms_run);
    }

    addRunProps = () => {
        const { cms_runProps } = this.params;
        if (!cms_runProps) return;

        // Included components
        let components = [];

        Object.entries(cms_runProps).forEach(([key, value]) => {
            if (value === true) { components.push(key.toUpperCase()); }
        });

        if (components.length > 0) {
            this.filter('components', 'CT', components.join(','));
        }

        // Sequence
        if (cms_runProps.sequence) {
            this.filter('sequence', 'EQ', cms_runProps.sequence);
        }
    }

    // Fills

    addFillRange = () => {
        const { cms_fill_from, cms_fill_to } = this.params;
        if (!cms_fill_from || !cms_fill_to) return;

        this.filter('fill_number', 'GE', cms_fill_from);
        this.filter('fill_number', 'LE', cms_fill_to);
    }

    addFillSingle = () => {
        const { cms_fill } = this.params;
        if (!cms_fill) return;

        this.filter('fill_number', 'EQ', cms_fill);
    }

    addFillProps = () => {
        const { cms_fillProps } = this.params;
        if (!cms_fillProps) return;

        if (cms_fillProps.stableOnly) {
            this.filter('start_stable_beam', 'NL', '0');
        }
        if (cms_fillProps.protonsOnly) {
            this.filter('fill_type_runtime', 'EQ', 'PROTONS');
        }
        if (cms_fillProps.ionsOnly) {
            this.filter('fill_type_runtime', 'EQ', 'PB');
        }
        if (cms_fillProps.protonsIonsOnly) {
            this.filter('fill_type_runtime', 'EQ', 'PROTONS_PB');
        }
    }

    addAlgoBit = () => {
        const { cms_l1_bit } = this.params;
        if (!cms_l1_bit) return;

        this.filter('bit', 'EQ', cms_l1_bit);
    }

    // Era

    addEraSingle = () => {
        const { cms_era_name } = this.params;
        if (!cms_era_name) return;

        this.filter('era', 'EQ', cms_era_name);
    }

    // Dates

    addDateRange = () => {
        const { cms_date_from, cms_date_to } = this.params;
        if (!cms_date_from || !cms_date_to) return;

        this.filter('start_time', 'GE', formatDateStringURL(cms_date_from));
        this.filter('end_time', 'LE', formatDateStringURL(cms_date_to));
    }

    // Fetch

    fetch = () => {

        switch (this.url) {

            case 'eras':
                this.sort('start_fill', 'desc');
                return MdcProvider.fetch('cms/eras/1', this.params)

            case 'last_run':
                // Filters
                this.filter('fill_number', 'NL', '0');
                // Sorting
                this.sort('run_number', 'desc');

                return MdcProvider.fetch('cms/runs/2', this.params)

            case 'runs':
                // Filters
                this.addRunRange();
                this.addRunSingle();
                this.addRunProps();
                this.addFillSingle();
                this.addDateRange();

                // Sorting
                this.sort('run_number', 'desc');

                return MdcProvider.fetch('cms/runs/2', this.params)
                    .then(resp => setLumiUnits(resp));

            // List of sequences of runs
            case 'runs_sequences':

                // Sorting
                this.sort('sequence', 'asc');

                return MdcProvider.fetch('cms/sequences/1', this.params);

            case 'fills':
                // Filters
                this.addFillRange();
                this.addFillSingle();
                this.addFillProps();
                this.addEraSingle();
                this.addDateRange();

                // Sorting
                this.sort('fill_number', 'desc');

                return MdcProvider.fetch('cms/fills/1', this.params)
                    .then(resp => setLumiUnits(resp));

            case 'downtimes':
                // Filters
                this.addRunSingle();
                this.addFillSingle();
                this.addDateRange();

                // Sorting
                this.sort('start_time', 'desc');

                return MdcProvider.fetch('cms/downtimes/1', this.params)
                    .then(resp => setLumiUnits(resp));

            case 'fed_mask':
                // Filters
                this.addRunSingle();

                return MdcProvider.fetch('cms/fed_enable_mask/1', this.params);

            case 'daq_feds':
                // Filters
                this.addRunSingle();

                return MdcProvider.fetch('cms/daq_feds/1', this.params);

            case 'lumisections':

                // Filters
                this.addFillSingle();
                this.addRunSingle();

                // Sorting
                this.sort('run_number', 'asc');
                this.sort('lumisection_number', 'asc');

                return MdcProvider.fetch('cms/lumisections/1', this.params)
                    .then(resp => setLumiUnits(resp));

            // L1 Configuration keys (L1 Details)
            case 'l1configurationkeys':

                //Filters
                this.addRunSingle();

                return MdcProvider.fetch('cms/l1_configuration_keys/1', this.params);

            // L1 Algorithm Triggers
            case 'l1algorithmtriggers':

                //Filters
                this.addRunSingle();
                this.addAlgoBit();

                return MdcProvider.fetch('cms/l1_algorithm_triggers/1', this.params);

            // L1 Trigger Rates
            case 'l1triggerrates':

                //Filters
                this.addRunSingle();

                return MdcProvider.fetch('cms/l1_trigger_rates/1', this.params)
                    .then(resp => modifyL1TriggerRates(resp));

            // L1 Overall Deadtimes
            case 'l1overalldeadtimes':

                //Filters
                this.addRunSingle();

                return MdcProvider.fetch('cms/l1_deadtimes/1', this.params)
                    .then(resp => modifyL1Data(resp));

            // L1 Beam Active Deadtimes
            case 'l1beamactivedeadtimes':

                // TODO: this endpoint is not yet finished!!!

                //Filters
                this.addRunSingle();

                return MdcProvider.fetch('cms/l1_beam_active_deadtimes/1', this.params)
                    .then(resp => modifyL1Data(resp));

            // L1 Algorithm details
            case 'l1algorithmdetails':

                // Filters
                this.addRunSingle();
                this.addAlgoBit();

                // Sorting
                this.sort('lumisection_number', 'asc');

                return MdcProvider.fetch('cms/l1_algo_details/1', this.params);

            default:
                return MdcProvider.fetch(this.url, this.params);
        }
    }
}

export default {
    fetch(url, params) {
        return new MdcWrapper(url, params).fetch();
    }
};
