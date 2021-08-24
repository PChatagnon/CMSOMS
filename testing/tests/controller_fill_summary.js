const PAUSE_TIME = 4000;
module.exports = {
    before: function (browser) {
        //Reuses the same table xpaths as in portletComponent tests
        notStableFill = browser.globals.controllerFillSummary.notStableFill;
        stableFill = browser.globals.controllerFillSummary.stableFill;
        ionsFrom = browser.globals.controllerFillSummary.ionsFrom;
        ionsTo = browser.globals.controllerFillSummary.ionsTo;
        protonsFrom = browser.globals.controllerFillSummary.protonsFrom;
        protonsTo = browser.globals.controllerFillSummary.protonsTo;
        protonsIonsFrom = browser.globals.controllerFillSummary.protonsIonsFrom;
        protonsIonsTo = browser.globals.controllerFillSummary.protonsIonsTo;
        controllerOpen = browser.globals.controller.elements.controllerOpen;
        container = browser.globals.controller.elements.controllerContainer;
        eraMenu = browser.globals.controllerFillSummary.elements.era;
        eraItem = browser.globals.controllerFillSummary.elements.eraItem;
        eraName = browser.globals.controllerFillSummary.era;
        radioButtonFillRange = container + browser.globals.controllerFillSummary.radioButtons.fillRange;
        radioButtonDateRange = container + browser.globals.controllerFillSummary.radioButtons.dateRange;
        radioButtonEra = container + browser.globals.controllerFillSummary.radioButtons.era;
        checkboxStableBeam = container + browser.globals.controllerFillSummary.checkboxes.stable;
        checkboxProtons = container + browser.globals.controllerFillSummary.checkboxes.protons;
        checkboxIons = container + browser.globals.controllerFillSummary.checkboxes.ions;
        checkboxProtonsIons = container + browser.globals.controllerFillSummary.checkboxes.protonsIons;
        buttonEra = container + browser.globals.controllerFillSummary.buttons.era;
        buttonOK = container + browser.globals.controller.buttons.ok;
        buttonReset = container + browser.globals.controller.buttons.reset;
        buttonApply = container + browser.globals.controller.buttons.apply;
        inputFillFrom = container + browser.globals.controllerFillSummary.inputs.fillFrom;
        inputFillTo = container + browser.globals.controllerFillSummary.inputs.fillTo;
        inputDateFrom = container + browser.globals.controllerFillSummary.inputs.dateFrom;
        inputDateTo = container + browser.globals.controllerFillSummary.inputs.dateTo;
        footer = browser.globals.portletComponent.elements.footer;
        buttonNextPage = footer + browser.globals.portletComponent.buttons.nextPage;
        inputPageNumber = footer + browser.globals.portletComponent.elements.pageNumber;
        tableRow = browser.globals.portletComponent.elements.tableRow;
        invalidFill = container + browser.globals.controllerFillSummary.elements.invalidFill;
        loadingScreen = browser.globals.portletComponent.elements.loadingScreen;
        tableHeader = browser.globals.portletComponent.elements.tableHeader;

        browser
            .useXpath() // every selector now must be xpath
            .resizeWindow(1280, 800);
    },
    after: function (browser) {
        browser
            .end();
    },
    beforeEach: function (browser) {
        browser
            .url(browser.launchUrl + browser.globals.controllerFillSummary.fillSummary)
            .waitForElementVisible("//html[1]/body[1]", PAUSE_TIME)
            .waitForElementVisible(controllerOpen, PAUSE_TIME)
            .click(controllerOpen)
            .waitForElementPresent(container, PAUSE_TIME)
    },

    'Check if loaded properly': function (browser) {
        browser.pause(PAUSE_TIME);
        browser.expect.element(browser.globals.portletComponent.elements.errorScreen).to.not.be.present;
    },

    /**
     * Checks if element xpaths are valid(only the ones that are visible when nothing is clicked)
     */
    'Check elements': function (browser) {        
        for (key in browser.globals.controllerFillSummary.radioButtons){
            browser.waitForElementPresentCustom(container + browser.globals.controllerFillSummary.radioButtons[key], PAUSE_TIME, "controller.elements.controllerContainer + controllerFillSummary.radioButtons." + key);
        }
        for (key in browser.globals.controllerFillSummary.checkboxes){
            browser.waitForElementPresentCustom(container + browser.globals.controllerFillSummary.checkboxes[key], PAUSE_TIME, "controller.elements.controllerContainer + controllerFillSummary.checkboxes." + key);
        }
        for (key in browser.globals.controllerFillSummary.inputs){
            browser.waitForElementPresentCustom(container + browser.globals.controllerFillSummary.inputs[key], PAUSE_TIME, "controller.elements.controllerContainer + controllerFillSummary.inputs." + key);
        }
        for (key in browser.globals.controller.buttons){
            browser.waitForElementPresentCustom(container + browser.globals.controller.buttons[key], PAUSE_TIME, "controller.elements.controllerContainer + controller.buttons." + key);
        }
        browser.waitForElementPresentCustom(buttonEra, PAUSE_TIME, "controller.elements.controllerContainer + controllerFillSummary.buttons.era");
        browser.waitForElementPresentCustom(buttonNextPage, PAUSE_TIME, "portletComponent.elements.footer + portletComponent.buttons.nextPage");
        browser.waitForElementPresentCustom(footer, PAUSE_TIME, "portletComponent.elements.footer");
    	browser.waitForElementPresentCustom(inputPageNumber, PAUSE_TIME, "portletComponent.elements.footer + portletComponent.elements.pageNumber");
    	browser.waitForElementPresentCustom(tableRow, PAUSE_TIME, "portletComponent.elements.tableRow");        
     },

    /**
     * Changes fill range, deselects stable beams.
     * Checks if the elements in table are within the range. Checks if number of fills is valid
     */
    'Fill Range Test': function (browser) {
        let fillsDifference = 33;
        let rangeTo, rangeFrom = 0;
        let fillIndex = 0;
        numberOfPages = 0;
        numberOfFills = 0;
        browser.expect.element(checkboxStableBeam).to.be.selected;
        browser.click(checkboxStableBeam);
        browser.expect.element(checkboxStableBeam).to.not.be.selected;
        browser.click(radioButtonFillRange);
        browser.expect.element(radioButtonFillRange).to.be.selected;
        browser.getAttribute(inputFillTo, 'value', result => {
            rangeTo = result.value;
            rangeTo = rangeTo - 10;
            rangeFrom = rangeTo - fillsDifference;
        });
        browser.clearValue(inputFillFrom);
        browser.clearValue(inputFillTo);
        browser.perform(function () {
            browser.setValue(inputFillFrom, rangeFrom);
            browser.setValue(inputFillTo, rangeTo);
        });
        browser.click(buttonOK);
        browser.checkColumn('Fill', (result)=>{
            fillColumn = result;
        });
        browser.getText(inputPageNumber, function (result) {
            numberOfPages = result.value.substring(result.value.lastIndexOf(" ") + 1);
        });
        browser.perform(function () {
            for (let i = 0; i < numberOfPages; i++) {
                browser.elements('xpath', tableRow, result => {
                    numberOfFills = numberOfFills + result.value.length - 2;
                    browser.perform(function () {
                        for (let j = 2; j < result.value.length; j++) {
                            browser.getText("((" + tableRow + ")[" + j + "]//td)[" + fillColumn + "]//span", text => {
                                browser.assert.ok((text.value <= rangeTo) && (text.value >= rangeFrom), "Checks if fill number(" + text.value + ") is between the bounds");
                            });
                        }
                    });
                });
                browser.click(buttonNextPage);
            }
        });
        browser.perform(function () {
            browser.assert.ok(numberOfFills == (fillsDifference + 1), "Checks if number of fills is correct");
        });
    },

    /**
     * Checks protons only checkbox. Changes input value to preset range.
     * Checks if the fills in datatable are type PROTONS only
     */
    'Protons Only Test': function (browser) {
        browser.expect.element(checkboxProtons).to.not.be.selected;
        browser.expect.element(checkboxIons).to.not.be.selected;
        browser.expect.element(checkboxProtonsIons).to.not.be.selected;
        browser.click(radioButtonFillRange);
        browser.expect.element(radioButtonFillRange).to.be.selected;
        browser.clearValue(inputFillFrom);
        browser.setValue(inputFillFrom, protonsFrom);
        browser.clearValue(inputFillTo);
        browser.setValue(inputFillTo, protonsTo);
        browser.click(checkboxProtons);
        browser.expect.element(checkboxProtons).to.be.selected;
        browser.click(buttonApply);
        browser.checkColumn('Type', (result)=>{
            typeColumn = result;
        });
        browser.elements('xpath', tableRow, (rows) => {
            browser.perform(() => {
                browser.assert.ok(rows.value.length>1, "Checks if there are elements in table in fill range :" +  protonsFrom + " - " + protonsTo);
                browser.getText("((" + tableRow + ")[" + 2 + "]//td)[" + typeColumn + "]", text => {
                    browser.assert.ok(text.value == 'PROTONS', "Checks if type is PROTONS ,  Got: " + text.value);
                });
            });
        });
    },

    /**
     * Checks ions only checkbox. Changes input value to preset range.
     * Checks if the fills in datatable are type PB only
     */
    'Ions Only Test': function (browser) {
        browser.expect.element(checkboxProtons).to.not.be.selected;
        browser.expect.element(checkboxIons).to.not.be.selected;
        browser.expect.element(checkboxProtonsIons).to.not.be.selected;
        browser.click(radioButtonFillRange);
        browser.expect.element(radioButtonFillRange).to.be.selected;
        browser.clearValue(inputFillFrom);
        browser.setValue(inputFillFrom,ionsFrom);
        browser.clearValue(inputFillTo);
        browser.setValue(inputFillTo,ionsTo);
        browser.click(checkboxIons);
        browser.expect.element(checkboxIons).to.be.selected;
        browser.click(buttonApply);
        browser.checkColumn('Type', (result)=>{
            typeColumn = result;
        });
        browser.elements('xpath', tableRow, (rows) => {
            browser.perform(() => {
                browser.assert.ok(rows.value.length>1, "Checks if there are elements in table in fill range :" +  ionsFrom + " - " + ionsTo);
                browser.getText("((" + tableRow + ")[" + 2 + "]//td)[" + typeColumn + "]", text => {
                    browser.assert.ok(text.value == 'PB', "Checks if type is PB ,  Got: " + text.value);
                });
            });
        });
    },

    /**
     * Checks protons-ions only checkbox. Changes input value to preset range.
     * Checks if the fills in datatable are type PROTONS_PB only
     */
    'Protons-Ions Only Test': function (browser) {
        browser.expect.element(checkboxProtons).to.not.be.selected;
        browser.expect.element(checkboxIons).to.not.be.selected;
        browser.expect.element(checkboxProtonsIons).to.not.be.selected;
        browser.click(radioButtonFillRange);
        browser.expect.element(radioButtonFillRange).to.be.selected;
        browser.clearValue(inputFillFrom);
        browser.setValue(inputFillFrom, protonsIonsFrom);
        browser.clearValue(inputFillTo);
        browser.setValue(inputFillTo, protonsIonsTo);
        browser.click(checkboxProtonsIons);
        browser.expect.element(checkboxProtonsIons).to.be.selected;
        browser.click(buttonApply);
        browser.checkColumn('Type', (result)=>{
            typeColumn = result;
        });
        browser.elements('xpath', tableRow, (rows) => {
            browser.perform(() => {
                browser.assert.ok(rows.value.length>1, "Checks if there are elements in table in fill range :" +  protonsIonsFrom + " - " + protonsIonsTo);
                browser.getText("((" + tableRow + ")[" + 2 + "]//td)[" + typeColumn + "]", text => {
                    browser.assert.ok(text.value == 'PROTONS_PB', "Checks if type is PROTONS_PB ,  Got: " + text.value);
                });
            });
        });
    },

    /**
     * Unchecks the stable only checkbox, changes fill range to preset not stable fill value. Then checks it back again and changes fill value to preset stable fill value.
     * First checks if the duration of fill is empty(when stable fill checkbox is unchecked). Then checks if duration is not empty(when stable fill checkbox is checked)
     */
    'Stable Beams Only Test': function (browser) {
        browser.click(radioButtonFillRange);
        browser.expect.element(radioButtonFillRange).to.be.selected;
        browser.expect.element(checkboxStableBeam).to.be.selected;
        browser.click(checkboxStableBeam);
        browser.clearValue(inputFillFrom);
        browser.setValue(inputFillFrom, notStableFill);
        browser.clearValue(inputFillTo);
        browser.setValue(inputFillTo, notStableFill);
        browser.click(buttonApply);
        browser.checkColumn('Duration', (result) => {
            durationColumn = result;
        });
        browser.elements('xpath', tableRow, (rows) => {
            browser.perform(() => {
                browser.assert.ok(rows.value.length>1, "Checks if there are elements in table in fill range :" +  notStableFill + " - " + notStableFill);
                browser.getText("((" + tableRow + ")[" + 2 + "]//td)[" + durationColumn + "]", text => {
                    browser.assert.ok(text.value == '', "Checks if duration is empty, got: " + text.value);
                });
            });
        });
        browser.expect.element(checkboxStableBeam).to.not.be.selected;
        browser.click(checkboxStableBeam);
        browser.expect.element(checkboxStableBeam).to.be.selected;
        browser.clearValue(inputFillFrom);
        browser.setValue(inputFillFrom, stableFill);
        browser.clearValue(inputFillTo);
        browser.setValue(inputFillTo, stableFill);
        browser.click(buttonApply);
    	browser.waitForElementNotPresentCustom(loadingScreen, PAUSE_TIME, "portletComponent.elements.loadingScreen");
        browser.elements('xpath', tableRow, (rows) => {
            browser.perform(() => {
                browser.assert.ok(rows.value.length>1, "Checks if there are elements in table in fill range :" +  stableFill + " - " + stableFill);
                browser.getText("((" + tableRow + ")[" + 2 + "]//td)[" + durationColumn + "]", text => {
                    browser.assert.ok(text.value != '', "Checks if duration is not empty, got: " + text.value);
                });                
            });
        });
    },

    /**
     * Change era value to correspond to preset era name. Gets date and fill number from full era name
     * Checks if datatable elements are within bounds(checks the first fill number and date and last fill number and date(uses sorting asc desc))
     */
    'Change Era Test': function (browser) {
        let fillFrom, fillTo = '';
        let numberOfPages = 0;
        let dateFrom, dateTo = new Date();
        let date;
        let fillColumn, dateFromColumn = 0;
        browser.click(radioButtonEra);
        browser.expect.element(radioButtonEra).to.be.selected;
        browser.click(buttonEra);
        browser.waitForElementPresentCustom(eraMenu, PAUSE_TIME, "controllerFillSummary.elements.era");
        browser.waitForElementPresentCustom(eraItem + "//*[contains(text(),'" + eraName + "')]", PAUSE_TIME, "controllerFillSummary.elements.eraItem containing text " + eraName);
        browser.getText(eraItem + "//*[contains(text(),'" + eraName + "')]", result => {
            let date = result.value.substring(result.value.indexOf(":") + 2, result.value.indexOf(","));
            dateFrom = Date.parse(date.substring(0, date.indexOf(" - ")));
            dateTo = Date.parse(date.substring(date.indexOf(" - ") + 3));
            let fill = result.value.substring(result.value.lastIndexOf(":") + 2);
            fillFrom = fill.substring(0, fill.indexOf(" - "));
            fillTo = fill.substring(fill.indexOf(" - ") + 3);
        });
        browser.click(eraItem + "//*[contains(text(),'" + eraName + "')]");
        browser.waitForElementNotPresent(eraMenu, PAUSE_TIME);
        browser.click(buttonApply);
        browser.checkColumn('Fill', (columnIndex) => {
            fillColumn = columnIndex;
        });
        browser.checkColumn('Start Time', (columnIndex) => {
            dateFromColumn = columnIndex;
        });
        browser.getText(inputPageNumber, function (result) {
            numberOfPages = result.value.substring(result.value.lastIndexOf(" ") + 1);
        });
        browser.perform(function () {

            browser.perform(() => {
                browser.click("(" + tableHeader + ")[" + fillColumn + "]");
                browser.waitForElementNotPresent(loadingScreen, PAUSE_TIME);
                browser.getText("((" + tableRow + ")[" + 2 + "]//td)[" + fillColumn + "]//span", text => {
                    browser.assert.ok((text.value <= fillTo) && (text.value >= fillFrom), "Checks if fill number(" + text.value + ") is between the bounds");
                });
                browser.click("(" + tableHeader + ")[" + fillColumn + "]");
                browser.waitForElementNotPresent(loadingScreen, PAUSE_TIME);
                browser.getText("((" + tableRow + ")[" + 2 + "]//td)[" + fillColumn + "]//span", text => {
                    browser.assert.ok((text.value <= fillTo) && (text.value >= fillFrom), "Checks if fill number(" + text.value + ") is between the bounds");
                });
                browser.click("(" + tableHeader + ")[" + fillColumn + "]");
                browser.waitForElementNotPresent(loadingScreen, PAUSE_TIME);
                browser.getText("((" + tableRow + ")[" + 2 + "]//td)[" + dateFromColumn + "]", text => {
                    browser.perform(() => {
                        date = (Date.parse(text.value.substring(0, text.value.indexOf(" "))));
                    });
                    browser.perform(() => {
                        browser.assert.ok((date <= dateTo) && (date >= dateFrom), "Checks if fill start date(" + text.value + ") is between the bounds");
                    });
                });
                browser.click("(" + tableHeader + ")[" + fillColumn + "]");
                browser.waitForElementNotPresent(loadingScreen, PAUSE_TIME);
                browser.getText("((" + tableRow + ")[" + 2 + "]//td)[" + dateFromColumn + "]", text => {
                    browser.perform(() => {
                        date = (Date.parse(text.value.substring(0, text.value.indexOf(" "))));
                    });
                    browser.perform(() => {
                        browser.assert.ok((date <= dateTo) && (date >= dateFrom), "Checks if fill start date(" + text.value + ") is between the bounds");
                    });
                });

            });
        });
    },

    /**
     * Changes date using keyboard inputs
     * Checks if the first and last elements are in date range(sorts by asc and desc start time and end time columns)
     * NOTE: Should not fail when there is no data in given time period but it is not the best approach
     */
    'Date Range Test': function (browser) {
        let dateFrom, dateTo;
        browser.click(radioButtonDateRange);
        browser.expect.element(radioButtonDateRange).to.be.selected;
        browser.click(inputDateFrom);
        browser.sendKeys("/html[1]/body[1]", [browser.Keys.UP_ARROW, browser.Keys.UP_ARROW, browser.Keys.ENTER]);
        browser.pause(PAUSE_TIME/4);
        browser.click(inputDateTo);
        browser.sendKeys("/html[1]/body[1]", [browser.Keys.UP_ARROW, browser.Keys.UP_ARROW, browser.Keys.ENTER]);
        browser.pause(PAUSE_TIME/4);
        browser.click(buttonApply);
        browser.perform(()=>{
            browser.getAttribute(inputDateFrom, 'value', result=>{
                dateFrom = Date.parse(result.value);
            });
            browser.getAttribute(inputDateTo, 'value', result=>{
                dateTo = Date.parse(result.value);
            });
        });
        browser.checkColumn('Start Time',(index)=>{
            dateFromColumn = index;
        });
        browser.checkColumn('End Time',(index)=>{
            dateToColumn = index;
        });
        browser.getText(inputPageNumber, function (result) {
            numberOfPages = result.value.substring(result.value.lastIndexOf(" ") + 1);
        });
        browser.perform(function () {
            browser.elements('xpath', tableRow, result => {
                browser.perform(function () {
                    if(result.value.length > 2){
                        browser.click(tableHeader + "[" + dateFromColumn + "]");
                        browser.waitForElementNotPresent(loadingScreen, PAUSE_TIME);
                        browser.getText("(" + tableRow + ")[3]//td[" + dateFromColumn + "]", text => {
                            browser.perform(()=>{
                                date = (Date.parse(text.value.substring(0, text.value.indexOf(" "))));
                            });
                            browser.perform(()=>{
                                browser.assert.ok((date <= dateTo) && (date >= dateFrom), "Checks if fill start date(" + text.value + ") is between the bounds");
                            });
                        });
                        browser.click(tableHeader + "[" + dateFromColumn + "]");
                        browser.waitForElementNotPresent(loadingScreen, PAUSE_TIME);
                        browser.getText("(" + tableRow + ")[3]//td[" + dateFromColumn + "]", text => {
                            browser.perform(()=>{
                                date = (Date.parse(text.value.substring(0, text.value.indexOf(" "))));
                            });
                            browser.perform(()=>{
                                browser.assert.ok((date <= dateTo) && (date >= dateFrom), "Checks if fill start date(" + text.value + ") is between the bounds");
                            });
                        });
                        //
                        browser.click(tableHeader + "[" + dateToColumn + "]");
                        browser.waitForElementNotPresent(loadingScreen, PAUSE_TIME);
                        browser.getText("(" + tableRow + ")[3]//td[" + dateToColumn + "]", text => {
                            browser.perform(()=>{
                                date = (Date.parse(text.value.substring(0, text.value.indexOf(" "))));
                            });
                            browser.perform(()=>{
                                browser.assert.ok((date <= dateTo) && (date >= dateFrom), "Checks if fill start date(" + text.value + ") is between the bounds");
                            });
                        });
                        browser.click(tableHeader + "[" + dateToColumn + "]");
                        browser.waitForElementNotPresent(loadingScreen, PAUSE_TIME);
                        browser.getText("(" + tableRow + ")[3]//td[" + dateToColumn + "]", text => {
                            browser.perform(()=>{
                                date = (Date.parse(text.value.substring(0, text.value.indexOf(" "))));
                            });
                            browser.perform(()=>{
                                browser.assert.ok((date <= dateTo) && (date >= dateFrom), "Checks if fill start date(" + text.value + ") is between the bounds");
                            });
                        });                 
                    }
                });
            });
        });
    },

    /**
     * Sets invalid input value(string instead of a number)
     * Checks if error message is present
     */
    'Fill Range Invalid Test': function (browser) {
        let originalValue ;
        browser.click(radioButtonFillRange);
        browser.expect.element(radioButtonFillRange).to.be.selected;
        browser.getAttribute(inputFillFrom, 'value', function(result){
            originalValue = result.value;
        });
        browser.setValue(inputFillFrom, 'aaaaa');
        browser.perform(()=>{
            browser.assert.attributeEquals(inputFillFrom, 'value', originalValue);
        });
        browser.click(radioButtonFillRange);
        browser.expect.element(radioButtonFillRange).to.be.selected;
        browser.click(buttonReset);
        browser.getAttribute(inputFillTo, 'value', function(result){
            originalValue = result.value;
        });
        browser.setValue(inputFillTo, 'aaaaa');
        browser.perform(()=>{
            browser.assert.attributeEquals(inputFillTo, 'value', originalValue);
        });
    },
}