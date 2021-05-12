import React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';

const Spinner = () => <CircularProgress thickness={2} size={35} />;

export const Loader = () => <div className="loader"><Spinner /></div>;

export default Spinner;