import React from 'react';
import { connect } from 'react-redux';
import { loadingCompleted } from '../actions/appActions';

function mapStateToProps(state) {
    return {
        app: state.app,
    };
}

const styles = {
    headline: {
        fontSize: 24,
        paddingTop: 16,
        marginBottom: 12,
        fontWeight: 400,
    },
};

class PageNotFound extends React.Component {

    componentDidUpdate() {
        this.props.dispatch(loadingCompleted());
    }

    componentDidMount() {
        this.props.dispatch(loadingCompleted());
    }

    render() {
        return (
            <div style={{ paddingLeft: 16 }} >
                <h2 style={styles.headline}>404: Page Not Found</h2>
                <p>
                    Sorry, but the page you are looking for has not been found.
                </p>
                <p>
                    Try cheking the URL for errors, then hit the refresh button
                    in your browser.
                </p>
            </div>
        );
    }
}

export default connect(mapStateToProps)(PageNotFound);