import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import ManageGroups from '../components/ManageBookmarks/ManageGroups';
import { loadingCompleted, openSnackbar } from '../actions/appActions';
import { selectBookmarkGroup, fetchBookmarkGroups, fetchBookmarkGroup,
         createBookmarkGroup, deleteBookmarkGroup, updateBookmarkGroup,
         createBookmarkUser, deleteBookmarkUser, createBookmarkRule, deleteBookmarkRule } from '../actions/bookmarkActions';

function mapStateToProps(state) {
    return {
        bookmarks: state.bookmarks
    };
}

function mapDispatchToProps(dispatch) {
    return {
        ...bindActionCreators({
             selectBookmarkGroup, fetchBookmarkGroups, fetchBookmarkGroup,
             createBookmarkGroup, deleteBookmarkGroup, updateBookmarkGroup,
             createBookmarkUser, deleteBookmarkUser, createBookmarkRule, deleteBookmarkRule, openSnackbar
        }, dispatch),
        dispatch
    };
}

class ManageBookmarks extends React.Component {

    state = {
        bookmarks: {
            groups: [],
            selectedGroup:null
        }
    }

    componentDidUpdate() {
        this.props.dispatch(loadingCompleted());
    }

    componentDidMount() {
        this.props.dispatch(loadingCompleted());
    }

    render() {
        return (
            <ManageGroups
                bookmarks={this.props.bookmarks}
                fetchBookmarkGroups={this.props.fetchBookmarkGroups}
                fetchBookmarkGroup={this.props.fetchBookmarkGroup}
                createBookmarkGroup={this.props.createBookmarkGroup}
                updateBookmarkGroup={this.props.updateBookmarkGroup}
                deleteBookmarkGroup={this.props.deleteBookmarkGroup}
                createBookmarkUser={this.props.createBookmarkUser}
                deleteBookmarkUser={this.props.deleteBookmarkUser}
                createBookmarkRule={this.props.createBookmarkRule}
                deleteBookmarkRule={this.props.deleteBookmarkRule}
                selectBookmarkGroup={this.props.selectBookmarkGroup}
                fetchingGroups={this.props.fetchingGroups}
                fetchingGroup={this.props.fetchingGroup}
                openSnackbar={this.props.openSnackbar}
            />
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ManageBookmarks);
