import React, { Component } from 'react';
import ImageGallery from 'react-image-gallery';
import moment from 'moment';

const RUNTIME_TYPES = ['PROTONS', 'PROTONS_IONS', 'IONS'];

class StaticPlot extends Component {

    constructor() {
        super();
        this.state = {
            keys: [],
            suite: null
        };
    }

    componentDidMount() {
        this.loadData();
    }

    componentDidUpdate(prevProps) {
        this.props.shouldUpdate(prevProps.query, this.props.query, (nextQuery) => this.loadData(this.props));
        this.props.shouldRefresh(this.props, this.loadData);
    }

    loadData = (props = this.props) => {
        this.setState({
            keys: props.configuration.keys,
            suite: props.configuration.suite
        });
    }

    getImageUrl = (key) => {
        const { query } = this.props;
        let { suite } = this.state;
        let url = "/api/resources/";
        let date = moment(); // month() is zero based
        let runtime_type = RUNTIME_TYPES[0];

        if (query){
            if ('cms_fill' in query) {
                suite = 'fill';
            }
            else if ('cms_date' in query) {
                date = moment.utc(query.cms_date, 'YYYY-MM-DD');
            }
            else if ('year' in query){
                if ('week' in query){
                    date = moment.utc(`${query.year} ${query.week}`, 'YYYY WW');
                }
                else{
                    date = moment.utc(`${query.year}`, 'YYYY');
                }

                if ('runtime_type' in query && RUNTIME_TYPES.includes(query.runtime_type)){
                    runtime_type = query.runtime_type;
                }
            }
        }

        switch (suite) {
            case 'fill':
                const fill = query.cms_fill;
                url += `fill/${fill}/${key}`
                break;
            case 'yearly':
                url += `yearly/${date.year()}/${key}/${runtime_type}`;
                break;
            case 'weekly':
                url += `weekly/${date.year()}/${date.isoWeek()}/${key}`;
                break;
            case 'daily':
            default:
                url += `daily/${date.year()}/${date.month() + 1}/${date.date()}/${key}`;
        }
        return url;
    }

    renderFullscreen = keys => {
        const renderItem = (key, index) => {
            return (
                <img
                    key={index}
                    alt=''
                    onError={(e) => { e.target.src = '/images/image_unavailable.png' }}
                    src={this.getImageUrl(key)}
                    style={{
                        maxHeight: (this.props.portletHeight - 10),
                        maxWidth: '90%',
                        padding: '10px 0px 0px 10px',
                    }}
                />
            )
        }

        return (
            <div style={{
                height: this.props.portletHeight,
                overflowX: 'hidden',
                overflowY: 'auto',
                textAlign: 'center'
            }}>
                {keys.map((key, index) => {
                    return renderItem(key, index);
                })}
            </div>
        );
    }

    renderCarousel = keys => {
        // Override render method of a library
        const renderItem = item => {
            return (
                <div className='image-gallery-image' style={{ textAlign: 'center' }}>
                    <img
                        src={item.original}
                        onError={e => { e.target.src = '/images/image_unavailable.png' }}
                        alt=''
                        style={{
                            maxHeight: (this.props.portletHeight - 25),
                            maxWidth: '90%'
                        }} />
                </div>
            );
        };

        let images = [];
        let url = '';

        keys.forEach(key => {
            url = this.getImageUrl(key);
            images.push({
                original: url,
                thumbnail: url
            })
        });

        return (
            <div style={{ maxHeight: this.props.portletHeight - 10, marginTop: 5 }}>
                <ImageGallery
                    items={images}
                    showThumbnails={false}
                    showFullscreenButton={false}
                    showPlayButton={false}
                    showBullets={images.length > 1 ? true : false}
                    disableArrowKeys={true}
                    renderItem={renderItem}
                />
            </div>
        )
    }

    render() {
        const { keys } = this.state;
        if (!keys.length) return <div />;

        if (this.props.fullscreen) {
            return this.renderFullscreen(keys);
        }
        return this.renderCarousel(keys);
    }
}

export default StaticPlot;
