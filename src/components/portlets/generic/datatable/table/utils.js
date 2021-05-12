
// Check if column unit is specified in the row meta
export function getRowColumnUnit(row, column) {
    return 'meta' in row &&
        'attributes' in row.meta &&
        column in row.meta.attributes &&
        'unit' in row.meta.attributes[column] ?
        row.meta.attributes[column].unit : null;
}

export function getRowColumnScale(row, column) {
    const rowScale = 'meta' in row &&
        'attributes' in row.meta &&
        column.name in row.meta.attributes &&
        'scale' in row.meta.attributes[column.name] &&
        row.meta.attributes[column.name].scale ? row.meta.attributes[column.name].scale : null;
    return rowScale ? rowScale : column.scale;
}

export function applyAggregation(aggType, data) {
    const avg = arr => (arr.reduce((a, x) => a + x, 0) / arr.length) || null;
    const sum = arr => arr.reduce((a, x) => a + x, 0) || null
    const min = arr => arr.length > 0 ? Math.min(...arr) : null;
    const max = arr => arr.length > 0 ? Math.max(...arr) : null;

    switch (aggType) {
        case 'avg': return avg(data);
        case 'sum': return sum(data);
        case 'min': return min(data);
        case 'max': return max(data);
        default: return null;
    }
}

export function aggregateData(data, columns, aggregate = true) {
    if (!aggregate || !columns) return null;

    let aggData = {};
    let duration;
    for (const column of columns) {
        if (!column.aggregate) {
            aggData[column.name] = 'EMPTY_AGG_CELL';
            continue;
        }
        if (column.preventAggregation) continue;

        const columnType = column.props ? column.props.type : '';
        switch (columnType) {
            case 'datetime': break;
            case 'link': break;
            case 'ratio': break;
            case 'array': break;
            case 'duration':
                if (!data.length) break;
                const durations = data.map(row => row.attributes[column.name]);
                duration = applyAggregation(column.aggregate, durations);
                aggData[column.name] = duration;
                break;
            case 'efficiency':
                if (!data.length) break;
                const effDurations = data.map(row => {
                    return row.attributes[column.name] * row.attributes['duration'] / 100;
                });
                const effDuration = applyAggregation(column.aggregate, effDurations);
                aggData[column.name] = effDuration / duration * 100;
                break;
            case 'float':
            default:
                const aggValues = data.map(row => row.attributes[column.name]);
                aggData[column.name] = applyAggregation(column.aggregate, aggValues);
        }
    }
    return { id: 'agg', attributes: aggData };
}

export function addColumnUnits(data, columns) {
    // Iterate over each row and check if row units are all the same for each column
    // If yes, set these units for the column.
    if (!columns) return null;

    return columns.map(column => {
        if (!column.show_units) return column;
        let units = null;
        let match = true;
        for (const row of data) {
            const rowUnits = column.name in row.units ? row.units[column.name].units : null;

            units = !units ? rowUnits : units;
            if (rowUnits && units && units !== rowUnits) {
                units = null;
                match = false;
                break;
            }
        }
        units = units ? units : column.units;
        column.units = match ? units : null;
        // Do not aggregate on column if units on each row do not match
        column.preventAggregation = !match;
        return column;
    });
}

export function transformData(data, meta, rowIdColumn = null, nested = null) {
    // Adds units to each row
    // Modifies id if needed
    // flaten nested objects
    const responseMeta = meta.fields ? meta.fields : null;

    return data.map(row => {
        row.units = row.meta ? row.meta.row : responseMeta;
        if (row.meta) delete row.meta;

        //TODO: remove this as soon as l1triggerrates data will be normalized
        if (!row.id) row.id = row.attributes.name;

        // Changes row id to a selected data attribute
        if (rowIdColumn && rowIdColumn in row.attributes) {
            row.id = row.attributes[rowIdColumn].toString();
        }

        if (nested) {
            for (const to_be_flatened in nested) {
                const nestedObject = row.attributes[to_be_flatened];
                if (nestedObject) {
                    for (const nestedAttribute in nested[to_be_flatened]) {
                        const dest = nested[to_be_flatened][nestedAttribute];
                        row.attributes[dest] = nestedObject[nestedAttribute];
                    }
                }
            }
        }

        return row;
    });
}
