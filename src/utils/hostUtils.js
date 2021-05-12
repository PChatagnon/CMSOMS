
export const DEV_HOST = 'vocms0183.cern.ch';
export const PROD_HOST = 'cmsoms.cern.ch';

export function getHost() {
    return window.location.hostname;
}

export function getEnv() {
    return process.env.NODE_ENV;
}

export function getVersion() {
    return process.env.REACT_APP_VERSION;
}

export function getRelease() {
    return process.env.REACT_APP_RELEASE;
}

export function getBuildTime() {
    return process.env.REACT_APP_TIME;
}