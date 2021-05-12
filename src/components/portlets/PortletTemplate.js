import React from 'react';
import Datatable from './generic/datatable/table/Table';

class PortletTemplate extends React.Component {

    /** 
     * State is where you hold your portlet data.
     * Any changes to the state data will re-render the component.
     * State should only be mutated with setState() method.
     */

    state = {
        data: null,
        columns: null
    }

    /**
     * componentDidMount is a way to trigger some initial actions after
     * your component was mounted to the DOM. Good place to load some data.
     */

    componentDidMount() {
        this.loadData();
    }

    /**
     * componentDidUpdate is called after some updates occurs.
     * Portlet base component provides some helper functions which needs to be used in this case:
     * 
     *   - shouldUpdate compares the old and new controller queries and gives a way
     *     to do some actions if the query changes. Let's say user picks a new run in a controller.
     *     So this is a good chance to fetch a new data and update our portlet.
     * 
     *   - shouldRefresh function checks if user clicked the portlet refresh button and gives us a 
     *     way to respond (reload data).
     *     
     */

    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, this.loadData);
        this.props.shouldRefresh(this.props, this.loadData);
    }

    /**
     * loadData is a custom method for fetching some data from the API.
     *   - As you can see it uses showLoader() prop for showing the spinner
     *     while data is still traveling. Don't forget to call hideLoader()
     *     once your data is ready to be displayed.
     * 
     *   - fetchData is prop which attaches all the needed filters,
     *     pagination and other parameters to your API query.
     */

    loadData = () => {
        this.props.showLoader();

        this.props.fetchData('runkeys')
            .then(resp => {
                const { data } = resp.data;

                // Handle empty data response
                if (!data.length) {
                    this.setState({ data: null, columns: null });
                    return this.props.onEmpty();
                }

                // Transform component keys list of first row into datatables column list
                const compKeys = data[0].attributes.component_keys;
                let columns = [];
                Object.keys(compKeys).forEach(key => {
                    columns.push({
                        name: key,
                        label: key,
                        type: null,
                        description: '',
                        units: null,
                        sortable: false,
                        numeric: true,
                    });
                });

                this.setState({ data: [{ attributes: compKeys }], columns: columns });
                this.props.hideLoader();
            })
            .catch(error => this.props.onFailure(error));
    }

    /**
     * The render() method is where the magic happens, it is a place to write 
     * the actual HTML and attach some data to be displayed. 
     * HTML with some advanced features in React is called JSX.
     * In this example we simply use a generic Datatable component to show our
     * data in a table.
     */

    render() {
        const { data, columns } = this.state;
        if (!data) return null;

        return (
            <Datatable
                data={data}
                columns={columns}
                showFooter={false}
                vertical={true}
                height={this.props.portletHeight}
            />
        );
    }
}

export default PortletTemplate;
