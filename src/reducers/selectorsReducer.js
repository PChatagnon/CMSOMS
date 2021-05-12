const initialState = {
    selectors: null,
    fetchingSelectors: false,
}

export default function reducer(state = initialState, action) {
    switch (action.type) {
        case "STARTED_FETCHING_SELECTORS": {
            return { ...state, fetchingSelectors: true }
        }
        case "FETCH_SELECTORS_FULFILLED": {
            return { ...state, selectors: action.payload.map(s => s.attributes) }
        }
        case "FETCH_SELECTORS_REJECTED": {
            return { ...state, fetchingSelectors: false }
        }
        default:
            return state
    }
}