const PAUSE_TIME = 4000;
module.exports = {
    before: function (browser) {
        //Reuses the same table xpaths as in portletComponent tests
        columnIndex = 0;
        controllerOpen = browser.globals.controller.elements.controllerOpen;
        container = browser.globals.controller.elements.controllerContainer;
        buttonSequence = container + browser.globals.controllerRunSummary.buttons.sequence;
        sequenceMenuItem = browser.globals.controllerRunSummary.elements.sequenceMenuItem;
        radioButtonFill = container + browser.globals.controllerRunSummary.radioButtons.fill;
        radioButtonRun = container + browser.globals.controllerRunSummary.radioButtons.runRange;
        radioButtonDate = container + browser.globals.controllerRunSummary.radioButtons.dateRange;
        inputFill = container + browser.globals.controllerRunSummary.inputs.fill;
        inputRunFrom = container + browser.globals.controllerRunSummary.inputs.runFrom;
        inputRunTo = container + browser.globals.controllerRunSummary.inputs.runTo;
        inputDateFrom = container + browser.globals.controllerRunSummary.inputs.dateFrom;
        inputDateTo = container + browser.globals.controllerRunSummary.inputs.dateTo;
        buttonOK = container + browser.globals.controller.buttons.ok;
        buttonApply = container + browser.globals.controller.buttons.apply;
        buttonReset = container + browser.globals.controller.buttons.reset;
        checkboxDAQ = container + browser.globals.controllerRunSummary.checkboxes.daq;
        checkboxTRACKER = container + browser.globals.controllerRunSummary.checkboxes.tracker;
        checkboxCSC = container + browser.globals.controllerRunSummary.checkboxes.csc;
        checkboxDQM = container + browser.globals.controllerRunSummary.checkboxes.dqm;
        checkboxSCAL = container + browser.globals.controllerRunSummary.checkboxes.scal;
        checkboxTRG = container + browser.globals.controllerRunSummary.checkboxes.trg;
        checkboxES = container + browser.globals.controllerRunSummary.checkboxes.es;
        footer = browser.globals.portletComponent.elements.footer;
        inputPageNumber = footer + browser.globals.portletComponent.elements.pageNumber;
        buttonNextPage = footer + browser.globals.portletComponent.buttons.nextPage;
        tableRow = browser.globals.portletComponent.elements.tableRow;
        datatable = browser.globals.portletComponent.elements.datatable;
        tableHeader = browser.globals.portletComponent.elements.tableHeader;
        loadingScreen = browser.globals.portletComponent.elements.loadingScreen;
        sequenceName = browser.globals.controllerRunSummary.sequenceName;
        runRangeFrom = browser.globals.controllerRunSummary.runRangeFrom;
        runRangeTo = browser.globals.controllerRunSummary.runRangeTo;
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
            .url(browser.launchUrl + browser.globals.controllerRunSummary.runSummary)
            .waitForElementVisible("//html[1]/body[1]", PAUSE_TIME)
            .waitForElementVisible(controllerOpen, PAUSE_TIME)
            .click(controllerOpen)
            .waitForElementVisible(container, PAUSE_TIME)
    },

    'Check if loaded properly': function (browser) {
        browser.pause(PAUSE_TIME);
        browser.expect.element(browser.globals.portletComponent.elements.errorScreen).to.not.be.present;
    },

    /**
     * Checks if element xpaths are valid(only the ones that are visible when nothing is clicked)
     */
    'Check elements': function (browser) {
        for (key in browser.globals.controllerRunSummary.checkboxes){
            browser.waitForElementPresentCustom(container + browser.globals.controllerRunSummary.checkboxes[key],PAUSE_TIME, "controller.elements.controllerContainer + controllerRunSummary.checkboxes." + key );
        }
        for (key in browser.globals.controllerRunSummary.radioButtons){
            browser.waitForElementPresentCustom(container + browser.globals.controllerRunSummary.radioButtons[key], PAUSE_TIME, "controller.elements.controllerContainer + controllerRunSummary.radioButtons." + key);
        }
        for (key in browser.globals.controllerRunSummary.inputs){
            browser.waitForElementPresentCustom(container + browser.globals.controllerRunSummary.inputs[key], PAUSE_TIME, "controller.elements.controllerContainer + controllerRunSummary.inputs." + key);
        }
        for (key in browser.globals.controller.buttons){
            browser.waitForElementPresentCustom(container + browser.globals.controller.buttons[key], PAUSE_TIME, "controller.elements.controllerContainer + controller.buttons." + key);
        }
        browser.waitForElementPresentCustom(buttonSequence, PAUSE_TIME, "controller.elements.controllerContainer + controllerRunSummary.buttons.sequence");
        browser.waitForElementPresentCustom(footer, PAUSE_TIME, "portletComponent.elements.footer");
        browser.waitForElementPresentCustom(inputPageNumber, PAUSE_TIME, "portletComponent.elements.footer + portletComponent.elements.pageNumber");
        browser.waitForElementPresentCustom(buttonNextPage, PAUSE_TIME, "portletComponent.elements.footer + portletComponent.buttons.nextPage");
        browser.waitForElementPresentCustom(tableRow, PAUSE_TIME, "portletComponent.elements.tableRow");
        browser.waitForElementPresentCustom(datatable, PAUSE_TIME, "portletComponent.elements.datatable");
        browser.waitForElementPresentCustom(tableHeader, PAUSE_TIME, "portletComponent.elements.tableHeader");
    },

    /**
     * Changes fill number
     * Checks if fill number of the elements in datatable are valid
     */     
    'Change Fill Test': function (browser) {
        let fillNumber, numberOfPages = 0;
        browser.click(radioButtonFill);
        browser.expect.element(radioButtonFill).to.be.selected;
        browser.getAttribute(inputFill, 'value', result => {
            fillNumber = result.value -1;
        });
        browser.clearValue(inputFill);
        browser.perform(() => {
            browser.setValue(inputFill, fillNumber);
        });
        browser.click(buttonOK);
        browser.getText(inputPageNumber, function (result) {
            numberOfPages = result.value.substring(result.value.lastIndexOf(" ") + 1);
        });
        browser.checkColumn('Fill',(result)=>{
            columnIndex = result;
        });
        browser.perform(function () {
            for (let i = 0; i < numberOfPages; i++) {
                browser.elements('xpath', tableRow, result => {
                    browser.perform(function () {
                        for (let j = 2; j <= result.value.length; j++) {
                            browser.getText("((" + tableRow + ")[" + j + "]//td)[" + columnIndex + "]//span", text => {
                                browser.assert.ok(text.value == fillNumber, "Checks if fill number(" + text.value + ") is correct");
                            });
                        }
                    });
                });
                browser.click(buttonNextPage);
            }
        });
    },

    /**
     * Changes run range
     * Checks if first and last run numbers are in range(uses sort asc, desc)
     */
    'Change Run Range': function (browser) {
        let rangeTo = runRangeTo;
        let rangeFrom = runRangeFrom;
        browser.click(radioButtonRun);
        browser.expect.element(radioButtonRun).to.be.selected;
        browser.clearValue(inputRunFrom);
        browser.clearValue(inputRunTo);
        browser.perform(function () {
            browser.setValue(inputRunFrom, rangeFrom);
            browser.setValue(inputRunTo, rangeTo);
        });
        browser.click(buttonOK);
        browser.checkColumn('Run',(result)=>{
            columnIndex = result;
        });
        browser.perform(function () {
            browser.click("(" + tableHeader + ")[" + columnIndex + "]");
            browser.getText("((" + tableRow + ")[" + 2 + "]//td)[" + columnIndex + "]//span", text => {
                browser.assert.ok((text.value <= rangeTo) && (text.value >= rangeFrom), "Checks if run number(" + text.value + ") is between the bounds");
            });
            browser.click("(" + tableHeader + ")[" + columnIndex + "]");
            browser.getText("((" + tableRow + ")[" + 2 + "]//td)[" + columnIndex + "]//span", text => {
                browser.assert.ok((text.value <= rangeTo) && (text.value >= rangeFrom), "Checks if run number(" + text.value + ") is between the bounds");
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
        browser.click(radioButtonDate);
        browser.expect.element(radioButtonDate).to.be.selected;
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
        browser.checkColumn('Start Time', (columnIndex)=>{
            dateFromColumn = columnIndex;
        });
        browser.checkColumn('End Time', (columnIndex)=>{
            dateToColumn = columnIndex;
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
     * Changes sequence and range to preset value
     * Checks if first and last sequences are valid (uses sort asc, desc)
     */
    'Change Sequence Test': function (browser) {
        browser.click(radioButtonRun);
        browser.expect.element(radioButtonRun).to.be.selected;
        browser.clearValue(inputRunFrom);
        browser.setValue(inputRunFrom, runRangeFrom);
        browser.clearValue(inputRunTo);
        browser.setValue(inputRunTo, runRangeTo);
        browser.click(buttonSequence);
        browser.waitForElementPresentCustom(sequenceMenuItem , PAUSE_TIME, "controllerRunSummary.elements.sequenceMenuItem");
        browser.click(sequenceMenuItem + "/descendant-or-self::*[(text()='" + sequenceName + "')]");
        browser.waitForElementNotPresentCustom(sequenceMenuItem, PAUSE_TIME, "controllerRunSummary.elements.sequenceMenuItem");
        browser.click(buttonApply);
        browser.checkColumn('Sequence',(result)=>{
            columnIndex = result;
        });
        browser.waitForElementVisible(datatable, PAUSE_TIME);
        browser.perform(()=>{
            browser.click("(" + tableHeader + ")[" + columnIndex + "]", ()=>{
                browser.assert.containsText("((" + tableRow + ")[" + 2 + "]//td)[" + columnIndex + "]", sequenceName);
            });
            browser.click("(" + tableHeader + ")[" + columnIndex + "]", ()=>{
                browser.assert.containsText("((" + tableRow + ")[" + 2 + "]//td)[" + columnIndex + "]", sequenceName);
            });
        });
    },

    /**
     * Changes component by checking DAQ checkbox
     * Checks if components value in datatable contains DAQ
     */
    'Component DAQ Test': function (browser) {
        let columnIndex;
        browser.multipleUnchecked(browser.globals.controllerRunSummary.checkboxes);
        browser.click(radioButtonRun);
        browser.clearValue(inputRunFrom);
        browser.setValue(inputRunFrom, runRangeFrom);
        browser.clearValue(inputRunTo);
        browser.setValue(inputRunTo, runRangeTo);
        browser.expect.element(radioButtonRun).to.be.selected;
        browser.click(checkboxDAQ);
        browser.expect.element(checkboxDAQ).to.be.selected;
        browser.click(buttonApply);
        browser.checkColumn('Components',(result)=>{
            columnIndex = result;
        });        
        /*
        browser.elements('xpath', tableRow, (rows) => {
            browser.perform(() => {
                browser.assert.ok(rows.value.length>1, "Checks if there are elements in table in run range :" +  runRangeFrom + " - " + runRangeTo);
                for(let i = 2 ; i < rows.value.length; i++){
                    browser.getText("((" + tableRow + ")[" + i + "]//td)[" + columnIndex + "]", text => {
                        browser.assert.ok(text.value.includes('DAQ'), "Checks if components includes DAQ ,  Got: " + text.value);
                    });
                }
            });
        });
        */
    },

    /**
     * Changes component by checking TRACKER checkbox
     * Checks if components value in datatable contains TRACKER
     */
    'Component TRACKER Test': function (browser) {
        let columnIndex;
        browser.multipleUnchecked(browser.globals.controllerRunSummary.checkboxes);
        browser.click(radioButtonRun);
        browser.clearValue(inputRunFrom);
        browser.setValue(inputRunFrom, runRangeFrom);
        browser.clearValue(inputRunTo);
        browser.setValue(inputRunTo, runRangeTo);
        browser.expect.element(radioButtonRun).to.be.selected;
        browser.click(checkboxTRACKER);
        browser.expect.element(checkboxTRACKER).to.be.selected;
        browser.click(buttonApply);
        browser.checkColumn('Components',(result)=>{
            columnIndex = result;
        });
        browser.elements('xpath', tableRow, (rows) => {
            browser.perform(() => {
                browser.assert.ok(rows.value.length>1, "Checks if there are elements in table in run range :" +  runRangeFrom + " - " + runRangeTo);
                for(let i = 2 ; i < rows.value.length; i++){
                    browser.getText("((" + tableRow + ")[" + i + "]//td)[" + columnIndex + "]", text => {
                        browser.assert.ok(text.value.includes('TRACKER'), "Checks if components includes DAQ ,  Got: " + text.value);
                    });
                }
            });
        });
    },

    /**
     * Changes component by checking CSC checkbox
     * Checks if components value in datatable contains CSC
     */
    'Component CSC Test': function (browser) {
        let columnIndex;
        browser.multipleUnchecked(browser.globals.controllerRunSummary.checkboxes);
        browser.click(radioButtonRun);
        browser.clearValue(inputRunFrom);
        browser.setValue(inputRunFrom, runRangeFrom);
        browser.clearValue(inputRunTo);
        browser.setValue(inputRunTo, runRangeTo);
        browser.expect.element(radioButtonRun).to.be.selected;
        browser.click(checkboxCSC);
        browser.expect.element(checkboxCSC).to.be.selected;
        browser.click(buttonApply);
        browser.checkColumn('Components',(result)=>{
            columnIndex = result;
        });
        browser.elements('xpath', tableRow, (rows) => {
            browser.perform(() => {
                browser.assert.ok(rows.value.length>1, "Checks if there are elements in table in run range :" +  runRangeFrom + " - " + runRangeTo);
                for(let i = 2 ; i < rows.value.length; i++){
                    browser.getText("((" + tableRow + ")[" + 2 + "]//td)[" + columnIndex + "]", text => {
                        browser.assert.ok(text.value.includes('CSC'), "Checks if components includes CSC ,  Got: " + text.value);
                    });
                }
            });
        });
    },

    /**
     * Changes component by checking DAQ and DQM checkboxes
     * Checks if components value in datatable contains DAQ and DQM
     */
    'Component DAQ DQM combination Test': function (browser) {
        let columnIndex;
        browser.multipleUnchecked(browser.globals.controllerRunSummary.checkboxes);
        browser.click(radioButtonRun);
        browser.clearValue(inputRunFrom);
        browser.setValue(inputRunFrom, runRangeFrom);
        browser.clearValue(inputRunTo);
        browser.setValue(inputRunTo, runRangeTo);
        browser.expect.element(radioButtonRun).to.be.selected;
        browser.click(checkboxDAQ);
        browser.click(checkboxDQM);
        browser.expect.element(checkboxDAQ).to.be.selected;
        browser.expect.element(checkboxDQM).to.be.selected;
        browser.click(buttonApply);
        browser.checkColumn('Components',(result)=>{
            columnIndex = result;
        });
        browser.elements('xpath', tableRow, (rows) => {
            browser.perform(() => {
                browser.assert.ok(rows.value.length>1, "Checks if there are elements in table in run range :" +  runRangeFrom + " - " + runRangeTo);
                browser.getText("((" + tableRow + ")[" + 2 + "]//td)[" + columnIndex + "]", text => {
                    browser.assert.ok(text.value.includes('DAQ'), "Checks if components includes DAQ ,  Got: " + text.value);
                    browser.assert.ok(text.value.includes('DQM'), "Checks if components includes DQM ,  Got: " + text.value);
                });
            });
        });
    },

    /**
     * Changes component by checking DAQ, SCAL and TRG checkboxes
     * Checks if components value in datatable contains DAQ, SCAL and TRG
     */
    'Component DAQ SCAL TRG combination Test': function (browser) {
        let columnIndex;
        browser.multipleUnchecked(browser.globals.controllerRunSummary.checkboxes);
        browser.click(radioButtonRun);
        browser.clearValue(inputRunFrom);
        browser.setValue(inputRunFrom, runRangeFrom);
        browser.clearValue(inputRunTo);
        browser.setValue(inputRunTo, runRangeTo);
        browser.expect.element(radioButtonRun).to.be.selected;
        browser.click(checkboxDAQ);
        browser.click(checkboxSCAL);
        browser.click(checkboxTRG);
        browser.expect.element(checkboxDAQ).to.be.selected;
        browser.expect.element(checkboxSCAL).to.be.selected;
        browser.expect.element(checkboxTRG).to.be.selected;
        browser.click(buttonApply);
        browser.checkColumn('Components',(result)=>{
            columnIndex = result;
        });
        browser.elements('xpath', tableRow, (rows) => {
            browser.perform(() => {
                browser.assert.ok(rows.value.length>1, "Checks if there are elements in table in run range :" +  runRangeFrom + " - " + runRangeTo);
                browser.getText("((" + tableRow + ")[" + 2 + "]//td)[" + columnIndex + "]", text => {
                    browser.assert.ok(text.value.includes('DAQ'), "Checks if components includes DAQ ,  Got: " + text.value);
                    browser.assert.ok(text.value.includes('SCAL'), "Checks if components includes SCAL ,  Got: " + text.value);
                    browser.assert.ok(text.value.includes('TRG'), "Checks if components includes TRG ,  Got: " + text.value);
                });
            });
        });
    },

    /**
     * Changes component by checking CSC, TRACKER and ES checkboxes
     * Checks if components value in datatable contains CSC, TRACKER and ES
     */
    'Component CSC TRACKER ES combination Test': function (browser) {
        let columnIndex;
        browser.multipleUnchecked(browser.globals.controllerRunSummary.checkboxes);
        browser.click(radioButtonRun);
        browser.clearValue(inputRunFrom);
        browser.setValue(inputRunFrom, runRangeFrom);
        browser.clearValue(inputRunTo);
        browser.setValue(inputRunTo, runRangeTo);
        browser.expect.element(radioButtonRun).to.be.selected;
        browser.click(checkboxCSC);
        browser.click(checkboxTRACKER);
        browser.click(checkboxES);
        browser.expect.element(checkboxCSC).to.be.selected;
        browser.expect.element(checkboxTRACKER).to.be.selected;
        browser.expect.element(checkboxES).to.be.selected;
        browser.click(buttonApply);
        browser.checkColumn('Components',(result)=>{
            columnIndex = result;
        });
        browser.elements('xpath', tableRow, (rows) => {
            browser.perform(() => {
                browser.assert.ok(rows.value.length>1, "Checks if there are elements in table");
                browser.getText("((" + tableRow + ")[" + 2 + "]//td)[" + columnIndex + "]", text => {
                    browser.assert.ok(text.value.includes('CSC'), "Checks if components includes CSC ,  Got: " + text.value);
                    browser.assert.ok(text.value.includes('TRACKER'), "Checks if components includes TRACKER ,  Got: " + text.value);
                    browser.assert.ok(text.value.includes('ES'), "Checks if components includes ES ,  Got: " + text.value);
                });
            });
        });
    },

    /**
     * Changes fill input value to invalid
     * Checks if input hasn't changed
     */
    'Fill Invalid Test': function (browser) {
        let originalValue;
        browser.click(radioButtonFill);
        browser.expect.element(radioButtonFill).to.be.selected;
        browser.getAttribute(inputFill, 'value', (result)=>{
            originalValue = result.value;
        });
        browser.setValue(inputFill, 'aaaa');
        browser.perform(()=>{
            browser.assert.attributeEquals(inputFill, 'value', originalValue);
        });
    },

    /**
     * Changes fill input value to invalid
     * Checks if input hasn't changed
     */
    'Run Range Invalid Test': function (browser) {
        let originalValue;
        browser.click(radioButtonRun);
        browser.expect.element(radioButtonRun).to.be.selected;
        browser.getAttribute(inputRunFrom, 'value', (result)=>{
            originalValue = result.value;
        });
        browser.setValue(inputRunFrom, 'aaaa');
        browser.perform(()=>{
            browser.assert.attributeEquals(inputRunFrom, 'value', originalValue);
        });
        browser.click(buttonReset);
        browser.click(radioButtonRun);
        browser.expect.element(radioButtonRun).to.be.selected;
        browser.getAttribute(inputRunTo, 'value', (result)=>{
            originalValue = result.value;
        });
        browser.setValue(inputRunTo, 'aaaa');
        browser.perform(()=>{
            browser.assert.attributeEquals(inputRunTo, 'value', originalValue);
        });
    },
}