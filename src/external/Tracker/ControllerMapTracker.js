import TrackerCurvesController from './components/controllers/TrackerCurvesController';
import TrackerDoubleChoiceController from './components/controllers/TrackerDoubleChoiceController';
import TrackerHalfMoonController from './components/controllers/TrackerHalfMoonController';
import TrackerHMBatchController from './components/controllers/TrackerHMBatchController';

export const getTrackerControllers = () => {
    const controllers = {
        TrackerCurvesController: TrackerCurvesController,
        TrackerDoubleChoiceController: TrackerDoubleChoiceController,
        TrackerHalfMoonController: TrackerHalfMoonController,
        TrackerHMBatchController: TrackerHMBatchController
    };
    return controllers;
}

