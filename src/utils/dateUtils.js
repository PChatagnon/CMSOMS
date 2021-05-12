import moment from 'moment';

const DATE_FORMAT = 'YYYY-MM-DD';
const TIME_FORMAT = 'HH:mm:ss';
const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const DATETIME_FORMAT_URL = 'YYYY-MM-DDTHH:mm:ss';

export function formatDate(dateObj) {
    return moment(dateObj).format(DATE_FORMAT);
}

export function formatDatetime(dateObj) {
    return moment(dateObj).format(DATETIME_FORMAT);
}

export function formatDatetimeUtc(dateObj) {
    return moment(dateObj).utc().format(DATETIME_FORMAT);
}

export function formatUTCDatetimeURL(dateObj) {
    return moment.utc(dateObj).format(DATETIME_FORMAT_URL) + 'Z';
}

export function formatDatetimeURL(dateObj) {
    return moment(dateObj).format(DATETIME_FORMAT_URL) + 'Z';
}

export function formatDatetimeString(datetimeString) {
    return moment.utc(datetimeString).format(DATE_FORMAT);
}

export function formatDateStringURL(dateString) {
    return moment.utc(dateString).format(DATETIME_FORMAT_URL);
}

export function formatTime(dateObj) {
    return moment(dateObj).format(TIME_FORMAT);
}

export function formatSecondsToDate(seconds) {
    return moment.unix(seconds).utc().format(DATE_FORMAT);
}

export function secondsToDatetime(seconds) {
    return diffDatetime(0, seconds);
    //return moment.unix(seconds).utc().format(TIME_FORMAT);
}

export function unixToDatetime(value, useLocal) {
    if (useLocal)
        return moment.unix(value/1000).format(DATETIME_FORMAT);
    return moment.unix(value/1000).utc().format(DATETIME_FORMAT);
}

export function unixToDatetimeURL(value) {
    return moment.unix(value/1000).utc().format(DATETIME_FORMAT_URL);
}

export function diffDates(time1, time2) {
    // For strings dates change unix to utc
    const date1 = moment.unix(time1);
    const date2 = time2 ? moment.unix(time2) : getCurrentDate();
    return moment.duration(date2.diff(date1));
}

export function diffToString(duration) {
    let hours = Math.floor(duration.asHours());
    if (hours < 10) { hours = '0' + hours };
    return hours + moment.utc(duration.asMilliseconds()).format(':mm:ss');
}

export function diffDatetime(time1, time2) {
    if (!time2) return null;
    const duration = diffDates(time1, time2);
    return diffToString(duration);
}

export function getCurrentDate() {
    return moment.utc();
}

export function toDateObject(dateString) {
    return moment.utc(dateString).toDate();
}

export function dateToUnix(dateString, useLocal) {
    if (!dateString) return null;
    if (useLocal)
        return moment(dateString).valueOf();
    return moment.utc(dateString).valueOf();
}

export function getCurrentUTCTime() {
    return moment().utc().format(DATETIME_FORMAT);
}
