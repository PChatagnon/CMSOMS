import { stringify } from 'qs';
import { uniqueId } from 'lodash';

export function toUrlQuery(str) {
    if (!str) return '';
    return `?${stringify(str, { allowDots: true })}`;
}

//  Returns a random integer between the specified values inclusive

export function getRandomInRange(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateId(prefix) {
    // Generates a unique ID
    return uniqueId(prefix);
}

export function stringFormatter(str, values) {
    /*
        Utility which injects values into a string. Example:

        Input:  /cms/run/report?cms_run=%&cms_run_sequence=%, values: ["319123", "GLOBAL-RUN"]
        Output: /cms/run/report?cms_run=319123&cms_run_sequence=GLOBAL-RUN
    */
    values.forEach(val => str = str.replace('%', val));
    return str;
}

/*
 * from portal-api app/templates/config.json
 */
const RESERVED_PATHS = [
    "agg", "api",
    "data",
    "edit",
    "info", "images", "img",
    "js",
    "log", "logs", "ldap",
    "manage", "manage_workspace", "meta", "monitorix", "monitorix-cgi",
    "private", "public",
    "resthub", "root", "rps",
    "static",
    "workspace"
];

/*
 * this function should corresponds to: """
 * https://gitlab.cern.ch/cmsoms/portal-api/-/blob/master/app/lib/string_utils.py
 */
export function pageNameFromTitle(title,maxlength=10) {

    let ret = title ? title:'';

    // Replace non alphanumeric to spaces
    ret = ret.replace(/\W+/g, "_")

    //remove underscores from both sides of text
    ret = ret.replace(/^[_]+|[_]+$/g, "");

    //remove duplicated underscores into single underscore
    ret = ret.replace(/__+/g, "_")

    // to lowercase
    if (!ret) ret = '_'

    if (ret.length > maxlength) {
        ret = ret.substr(0,maxlength);
        ret = ret.replace(/^[_]+|[_]+$/g, "");
    }

    ret = ret.toLowerCase();

    // replace last character of path to underscore if path is in reserved words
    if (RESERVED_PATHS.includes(ret)) {
        if (ret.length === maxlength) {
            ret = ret.substr(0,maxlength-1);
            ret = ret.replace(/^[_]+|[_]+$/g, "");
        }
        ret = ret.substr(0,ret.length-1) + "_r"
    }
    return ret;
}

export function copyObjectsArray(arr) {
    return [...arr.map(row => ({ ...row }))];
}

export function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}


export function setHighchartsLibURL(hcObj) {
    hcObj.setOptions({ // Apply to all charts
        chart: {
            events: {
                //fix exporting wrong aspect ratio and legend clipping
                load: function() {
                    this.update({
                        exporting: {
                            sourceWidth: this.chartWidth
                        }
                    })
                }
            }
        },
        exporting: {
            libURL: '/node_modules/highcharts/lib'
        }
    })
}
