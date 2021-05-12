import EmptyController from './EmptyController';
import RunSummaryController from './RunSummaryController';
import FillReportController from './FillReportController';
import RunReportController from './RunReportController';
import FillSummaryController from './FillSummaryController';
import YearController from './YearController';
import RunController from './RunController';
import L1AlgoTriggerReportController from './L1AlgoTriggerReportController';
import L1TriggerRatesController from './L1TriggerRatesController';
import L1CurrentRatesController from './L1CurrentRatesController';
import DowntimesController from './DowntimesController';
import RuntimesController from './RuntimesController';
import DeadtimesController from './DeadtimesController';
import DataSummaryController from './DataSummaryController';
import TriggerModesController from './TriggerModesController';
import DateTimeController from './DateTimeController';
import SimpleController from './SimpleController';
import Db1FieldController from './Db1FieldController'
import Db2FieldsController from './Db2FieldsController'
import Db3FieldsController from './Db3FieldsController'
import DowntimeManipulationController from './DowntimeManipulationController'
import CurrentRunController from './CurrentRunController'

import { getExternalController } from '../../external/ExternalControllerMap';

let getController = function (name) {
    const controllers = {
        EmptyController: EmptyController,
        YearController: YearController,
        RunSummaryController: RunSummaryController,
        FillReportController: FillReportController,
        RunReportController: RunReportController,
        FillSummaryController: FillSummaryController,
        RunController: RunController,
        L1AlgoTriggerReportController: L1AlgoTriggerReportController,
        L1TriggerRatesController: L1TriggerRatesController,
        L1CurrentRatesController: L1CurrentRatesController,
        DowntimesController: DowntimesController,
        RuntimesController: RuntimesController,
        DeadtimesController: DeadtimesController,
        DataSummaryController: DataSummaryController,
        TriggerModesController: TriggerModesController,
        DateTimeController: DateTimeController,
        SimpleController: SimpleController,
        Db1FieldController: Db1FieldController,
        Db2FieldsController: Db2FieldsController,
        Db3FieldsController: Db3FieldsController,
        DowntimeManipulationController: DowntimeManipulationController,
        CurrentRunController: CurrentRunController,
        default: EmptyController
    };
    return controllers[name] || getExternalController(name);
}

export default getController;
