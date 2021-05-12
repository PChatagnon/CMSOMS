import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Button from '@material-ui/core/Button';
import blue from '@material-ui/core/colors/blue';
import { stringFormatter } from '../../../utils/utils';
import sizeMe from 'react-sizeme';
import { LinkWrapper } from '../../generic/ExtLink.js';

const styles = {
    button: {
        marginLeft: 2,
        marginBottom: 2,
        verticalAlign: 'top',
        minHeight: 32,
        minWidth: 50,
        fontSize: 12,
        textTransform: 'capitalize',
        textDecoration: 'underline',
        paddingLeft: 5,
        paddingRight: 5,
        '&:hover, &:active': {
            textDecoration: 'underline',
        }
    },
    listItem: {
        padding: 8,
        fontSize: 12,
        color: blue[600],
        textDecoration: 'underline',
        '&:hover, &:active': {
            textDecoration: 'underline',
        }
    }
};

class Links extends Component {

    renderHorizontally = (index, link, href, target, classes) => {
        return (
            <ListItem button disableGutters
                key={index}
                className={classes.listItem}
                component={LinkWrapper}
                target={target}
                href={href}
                to={href}
            >
                <ListItemText primary={link.label} primaryTypographyProps={{ color: 'inherit' }} />
            </ListItem>
        );
    }

    renderVertically = (index, link, href, target, classes) => {
        return (
            <Button
                key={index}
                className={classes.button}
                color="primary"
                size="small"
                component={LinkWrapper}
                target={target}
                to={href}
            >
                {link.label}
            </Button>
        );
    }

    renderLinks = () => {
        const { size, portletHeight, classes } = this.props;
        const { links } = this.props.configuration;
        const renderFunction = size.width > portletHeight ? this.renderVertically : this.renderHorizontally;

        return links.map((link, index) => {
            let href = link.href;
            const target = link.target ? link.target : '';

            if (link.props && link.props.selectors) {
                const linkValues = link.props.selectors.map(s => this.props.query[s]);
                href = stringFormatter(link.href, linkValues);
            }

            return renderFunction(index, link, href, target, classes);
        });
    }

    render() {
        return (
            <List dense>
                <div style={{ overflowY: 'auto', overflowX: 'auto', maxHeight: this.props.portletHeight, marginTop: -5, marginLeft: -5 }}>
                    {this.renderLinks()}
                </div>
            </List>
        );
    }
}

export default sizeMe({ monitorWidth: true })(withStyles(styles)(Links));
