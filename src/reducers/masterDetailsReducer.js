const initialState = {};

export default function reducer(state = initialState, action) {

    switch (action.type) {
        case "MASTER_DETAILS": {
            return { ...state, [action.payload.groupId]: action.payload.body }
        }
        default:
            return state
    }
}
