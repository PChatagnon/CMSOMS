import AggWrapper from './AggWrapper';
import AggProvider from './AggProvider';

export const autocompleteFills = (fill, stable = false) => {
    const stableFilter = stable ? 'filter[stable_beams][EQ]=true&' : '';
    return AggProvider.fetch(`fills/autocomplete?filter[items][EQ]=5&${stableFilter}filter[fill_number][EQ]=${fill}%`);
}

export const autocompleteRuns = (run, sequence = 'GLOBAL-RUN') => {
    const sequenceFilter = sequence ? `filter[sequence][EQ]=${sequence}&` : '';
    return AggProvider.fetch(`runs/autocomplete?filter[items][EQ]=5&${sequenceFilter}filter[run_number][EQ]=${run}%`);
}

export const shiftRun = (run, side = 'right', sequence = 'GLOBAL-RUN') => {
    if (run === '') return Promise.resolve();

    let filters = [{
        attribute: 'run_number',
        operator: side === 'right' ? 'GT' : 'LT',
        value: run
    }];

    if (sequence) {
        filters.push({
            attribute: 'sequence',
            operator: 'EQ',
            value: sequence
        })
    }

    return AggWrapper.fetch('runs', {
        page: 1,
        pagesize: 1,
        fields: ['run_number'],
        filters: filters,
        sorting: [(side === 'right' ? '' : '-') + 'run_number'],
        include: ['turbo']
    }).then(response => {
        const runs = response.data.data;
        return (runs.length > 0) ? runs[0].attributes.run_number : null;
    });
}

export const shiftFill = (fill, side = 'right') => {
    if (fill === '') return Promise.resolve();

    return AggWrapper.fetch('fills', {
        page: 1,
        pagesize: 1,
        fields: ['fill_number'],
        filters: [{
            attribute: 'fill_number',
            operator: side === 'right' ? 'GT' : 'LT',
            value: fill
        }, {
            attribute: 'stable_beams',
            operator: 'EQ',
            value: true
        }],
        sorting: [(side === 'right' ? '' : '-') + 'fill_number'],
        include: ['turbo']
    }).then(response => {
        const fills = response.data.data;
        return (fills.length > 0) ? fills[0].attributes.fill_number : null;
    });
}