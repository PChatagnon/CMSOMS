import HgcalCurvesController from './components/controllers/HgcalCurvesController';
import Hgcal8InchSensorController from './components/controllers/Hgcal8InchSensorController';
import Hgcal8InchSensorCVController from './components/controllers/Hgcal8InchSensorCVController';

export const getHGCALControllers = (name) => {
    const controllers = {
        HgcalCurvesController: HgcalCurvesController,
        Hgcal8InchSensorController: Hgcal8InchSensorController,
        Hgcal8InchSensorCVController: Hgcal8InchSensorCVController
    };
    return controllers;
}

