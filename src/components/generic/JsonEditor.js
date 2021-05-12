import React, { Suspense } from 'react';
import Spinner from './Spinner';
import PortletErrorBoundary from '../portlets/PortletErrorBoundary';

export const MAX_CHAR_SIZE = 4000;
const JsonAceEditor = React.lazy(() => import('./JsonAceEditor'));

const JsonEditor = props => {
    return (
        <PortletErrorBoundary>
            <Suspense fallback={<div className="loader"><Spinner /></div>}>
                <JsonAceEditor {...props} maxSize={MAX_CHAR_SIZE} />
            </Suspense>
        </PortletErrorBoundary>
    );
}

export default JsonEditor;