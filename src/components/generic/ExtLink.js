import React from "react";
import { __RouterContext as RouterContext } from "react-router";
import { Link } from 'react-router-dom';
//import invariant from "tiny-invariant";

/* Based on react-router-dom Link. In v5 Link does not correctly parse external paths
 * and <a/> will be used instead when external URL is detected */

let { forwardRef } = React;

const ExtLinkAnchor = forwardRef(
    (
        {
            ...rest
        },
        forwardedRef
    ) => {
        let restAttr = {...rest};
        //avoids warning due to 'a' empty children
        delete restAttr.children;
        return <a {...restAttr} >{rest.children}</a>;
    }
);

export const ExtLink = forwardRef(
    (
        {
            component = ExtLinkAnchor,
            to,
            ...rest
        },
        forwardedRef
    ) => {
        return (
            <RouterContext.Consumer>
                {context => {
                    //invariant(context, "You should not use <ExtLink> outside a <Router>");
                    const href = to
                    const props = {
                        ...rest,
                        href
                    };

                    return React.createElement(component, props);
                }}
            </RouterContext.Consumer>
        );
    }
);

export const LinkWrapper = forwardRef((props,ref) => {

    if (props.to && (props.to.startsWith('http://') || props.to.startsWith('https://'))) {
        return(<ExtLink {...props} ref={ref} />);
    }
    else {
        return(<Link {...props} ref={ref} />);
    }

})

