import TrackerCurvesController from './components/controllers/TrackerCurvesController';
import TrackerDoubleChoiceController from './components/controllers/TrackerDoubleChoiceController';
import TrackerHalfMoonController from './components/controllers/TrackerHalfMoonController';

export const getTrackerControllers = () => {
    const controllers = {
        TrackerCurvesController: TrackerCurvesController,
        TrackerDoubleChoiceController: TrackerDoubleChoiceController,
        TrackerHalfMoonController: TrackerHalfMoonController
    };
    return controllers;
}

