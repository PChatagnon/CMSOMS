import sizeMe from 'react-sizeme';
//import { generateId } from '../../../../utils/utils';
import OmsChart from '../../../../components/portlets/generic/charts/OmsChart';


class GemChart extends OmsChart {
    constructor(props) {
        super(props, {
            idHeader: 'gemChart',
            xDataConverter: OmsChart.useConverterXToCategories
        });
    }

}

export default sizeMe({ monitorWidth: true })(GemChart);
