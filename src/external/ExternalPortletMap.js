import {PORTLET_EXTERNAL_PATH_CSC} from './CSC/PortletMapCSC';
import {PORTLET_EXTERNAL_PATH_ECAL} from './ECAL/PortletMapECAL';
import {PORTLET_EXTERNAL_PATH_GEM} from './GEM/PortletMapGEM';
import {PORTLET_EXTERNAL_PATH_HGCAL} from './HGCAL/PortletMapHGCAL';
import {PORTLET_EXTERNAL_PATH_TRACKER} from './Tracker/PortletMapTracker';

export const getExternalPortletPath = (name) => {
    return (
	PORTLET_EXTERNAL_PATH_CSC[name] ||
	PORTLET_EXTERNAL_PATH_ECAL[name] ||
	PORTLET_EXTERNAL_PATH_GEM[name] ||
	PORTLET_EXTERNAL_PATH_HGCAL[name] ||
	PORTLET_EXTERNAL_PATH_TRACKER[name] ||
	'PathNotFound');
}

