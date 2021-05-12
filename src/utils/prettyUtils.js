/*
    Formatting utils
*/

export function prettyFloat(floatStr, ndigits = 3) {
    /*
        Formats given float string
        
        params:
            floatStr - float string
            ndigits  - number of digits after period
    */

    let f = parseFloat(floatStr);
    if (isNaN(f)) return "";

    return f % 1 === 0 ? f : f.toFixed(ndigits);
}

export function capitalizeString(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function prettyJsonString(str) {
    try {
        let json = JSON.parse(str);
        if (json && typeof json === 'object' && json !== null) {
            return JSON.stringify(json, null, 2);
        } else {
            return false;
        }
    } catch (e) {
        return false;
    }
}