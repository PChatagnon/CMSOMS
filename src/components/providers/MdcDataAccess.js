import MdcWrapper from './MdcWrapper';

export const autocompleteFills = (fill) => {
    return MdcWrapper.fetch('fills', {
        pagesize: 5,
        fields: ['fill_number'],
        filters: [{
            attribute: 'fill_number',
            operator: 'LIKE',
            value: fill
        }],
        exclude: ['total_matches']
    })
}

export const autocompleteRuns = (run) => {
    return MdcWrapper.fetch('runs', {
        pagesize: 5,
        fields: ['run_number'],
        filters: [{
            attribute: 'run_number',
            operator: 'LIKE',
            value: run
        }],
        exclude: ['total_matches']
    })
}

export const shiftRun = (run, side = 'right') => {
    return MdcWrapper.fetch('runs', {
        pagesize: 1,
        fields: ['run_number'],
        filters: [{
            attribute: 'run_number',
            operator: side === 'right' ? 'GT' : 'LT',
            value: run
        }],
        sorting: [(side === 'right' ? '' : '-') + 'run_number'],
        exclude: ['total_matches']
    }).then(response => {
        const runs = response.data.data;
        return (runs.length > 0) ? runs[0].attributes.run_number : null;
    });
}

export const shiftFill = (fill, side = 'right') => {
    return MdcWrapper.fetch('fills', {
        pagesize: 1,
        fields: ['fill_number'],
        filters: [{
            attribute: 'fill_number',
            operator: side === 'right' ? 'GT' : 'LT',
            value: fill
        }],
        sorting: [(side === 'right' ? '' : '-') + 'fill_number'],
        exclude: ['total_matches']
    }).then(response => {
        const fills = response.data.data;
        return (fills.length > 0) ? fills[0].attributes.fill_number : null;
    });
}