const initialState = {
    name: null,
    instance: ''
}

export default function reducer(state = initialState, action) {

    switch (action.type) {
        case "FETCH_WORKSPACES_FULFILLED": {
            return { ...state, ...readHeaders(action.payload.headers) }
        }
        default:
            return state
    }
}

function readHeaders(headers) {
    const oidc_used = 'oidc-used' in headers ? headers['oidc-used']==='true' : false;
    let name;
    let instance;
    if (oidc_used) {
        console.log('oidc authentication detected');
        if (!('adfs-fullname' in headers)) name = 'Stranger';
        else
            name = headers['adfs-fullname'];
    }
    else {
        if (!('oidc-claim-name' in headers)) name = 'Stranger';
        else
            name = headers['oidc-claim-name'];
    }
    if (!('oms-instance' in headers)) instance = '';
    else
        instance = headers['oms-instance'] !== 'None' ? headers['oms-instance'] : '';

    if (name === 'None') name = 'Stranger';
    return {
        name: name, 
        instance: instance,
        oidc_used: oidc_used
    }
}

