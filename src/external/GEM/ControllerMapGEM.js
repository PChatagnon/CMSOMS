import GemRunController from './components/controllers/GemRunController';
import GemSerialTypeRunController from './components/controllers/GemSerialTypeRunController';

export const getGEMControllers = (name) => {
    const controllers = {
        GemRunController: GemRunController,
        GemSerialTypeRunController: GemSerialTypeRunController
    };
    return controllers;
}

