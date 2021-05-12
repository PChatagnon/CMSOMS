import React, { Component } from 'react';
import ImageGallery from 'react-image-gallery';

class Snapshot extends Component {

    constructor() {
        super();
        this.timer = null;
    }

    componentDidMount() {
        this.timer = setInterval(() => this.forceUpdate(), 15500);
    }

    componentWillUnmount() {
        clearInterval(this.timer);
    }

    renderFullscreen = links => {
        return (
            <div style={{
                height: this.props.portletHeight,
                overflowX: 'auto',
                overflowY: 'auto',
                textAlign: 'center'
            }}>
                {links.map((link, index) =>
                    <img
                        key={index}
                        alt=''
                        onError={e => e.target.src = '/images/image_unavailable.png'}
                        src={"/api/resources/screenshots/" + link + "?rnd=" + Math.random()}
                        style={{ padding: '10px 0px 0px 10px' }}
                    />
                )}
            </div>
        );
    }

    // Override render method of a library
    renderItem = item => {
        return (
            <div className='image-gallery-image' style={{ textAlign: 'center' }}>
                <img
                    src={item.original + "?rnd=" + Math.random()}
                    onError={e => e.target.src = '/images/image_unavailable.png'}
                    alt=''
                    style={{
                        maxHeight: this.props.portletHeight - 25,
                        maxWidth: '90%'
                    }} />
            </div>
        );
    };

    renderCarousel = links => {
        const images = links.map(link => {
            const url = "/api/resources/screenshots/" + link;
            return { original: url, thumbnail: url };
        });
        return (
            <div style={{ maxHeight: this.props.portletHeight - 25 }}>
                <ImageGallery
                    items={images}
                    showThumbnails={false}
                    showFullscreenButton={false}
                    showPlayButton={false}
                    showBullets={images.length > 1 ? true : false}
                    disableArrowKeys={true}
                    renderItem={this.renderItem}
                />
            </div>
        )
    }

    render() {
        const { links } = this.props.configuration;
        if (!links) return <div />;

        if (this.props.fullscreen) {
            return this.renderFullscreen(links);
        }
        return this.renderCarousel(links);
    }
}

export default Snapshot;
