const initialState = {
    groups:[],
    selectedGroup:null
}

export default function reducer(state = initialState, action) {

    switch (action.type) {
        case "FETCH_GROUPS_FULFILLED": {
            return { ...state, groups: action.payload, selectedGroup: null }
        }

        case "FETCH_GROUP_FULFILLED": {
            //remove jsonapi definitions incompatible with React
            delete action.payload.type;
            if (action.payload.users)
                action.payload.users = Array.from(action.payload.users, v => v.attributes.username)
            if (action.payload.rules)
                action.payload.rules = Array.from(action.payload.rules, v => v.attributes.rule);
            return { ...state, selectedGroup: action.payload }
        }
 
        default:
            return state
    }
}

