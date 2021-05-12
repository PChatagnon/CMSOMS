import EmptyController from '../components/controllers/EmptyController';
import {getTrackerControllers} from './Tracker/ControllerMapTracker';
import {getHGCALControllers} from './HGCAL/ControllerMapHGCAL';
import {getGEMControllers} from './GEM/ControllerMapGEM'

export const getExternalController = (name) => {

    const systems = [
        getTrackerControllers(),
        getHGCALControllers(),
        getGEMControllers(),
        {default:EmptyController}
    ];
    const externalControllers = Object.assign({},...systems);

    return externalControllers[name] || externalControllers['default'];
}

