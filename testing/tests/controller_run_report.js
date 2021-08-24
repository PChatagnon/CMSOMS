const PAUSE_TIME = 4000;
module.exports = {
    before: function (browser) {
        container = browser.globals.controller.elements.controllerContainer;
        controllerOpen = browser.globals.controller.elements.controllerOpen;
        buttonPrevious = container + browser.globals.controllerRunReport.buttons.previous;
        buttonNext = container + browser.globals.controllerRunReport.buttons.next;
        buttonSequence = container + browser.globals.controllerRunReport.buttons.sequence;
        buttonReset = container + browser.globals.controller.buttons.reset;
        buttonApply = container + browser.globals.controller.buttons.apply;
        sequence = browser.globals.controllerRunReport.runSequence;
        sequenceMenu = browser.globals.controllerRunReport.elements.sequenceMenu;
        sequenceItem = browser.globals.controllerRunReport.elements.sequenceItem;
        sequenceName = browser.globals.controllerRunReport.elements.sequenceName;
        runNumber = browser.globals.controllerRunReport.runNumber;
        inputRun = container + browser.globals.controllerRunReport.inputs.run;
        elementRunNumber = browser.globals.controllerRunReport.elements.runNumber;
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
            .url(browser.launchUrl + browser.globals.controllerRunReport.runReport)
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
        browser.waitForElementPresentCustom(buttonPrevious, PAUSE_TIME, "controller.elements.controllerContainer + controllerRunReport.buttons.previous");
        browser.waitForElementPresentCustom(buttonNext, PAUSE_TIME, "controller.elements.controllerContainer + controllerRunReport.buttons.next");
        browser.waitForElementPresentCustom(buttonSequence, PAUSE_TIME, "controller.elements.controllerContainer + controllerRunReport.buttons.sequence");
        browser.waitForElementPresentCustom(buttonReset, PAUSE_TIME, "controller.elements.controller + controllerRunReport.buttons.reset");
        browser.waitForElementPresentCustom(buttonApply, PAUSE_TIME, "controller.elements.controller + controllerRunReport.buttons.apply");
        browser.waitForElementPresentCustom(sequenceName, PAUSE_TIME, "controllerRunReport.elements.sequenceName");
        browser.waitForElementPresentCustom(elementRunNumber, PAUSE_TIME, "controllerRunReport.elements.runNumber");
        browser.waitForElementPresentCustom(inputRun, PAUSE_TIME, "controller.elements.controllerContainer + controllerRunReport.inputs.run");
    },

    /**
     * Changes run value using previous buttom.
     * Checks if run number went down in input field and run details 
     */
    'Paginate Test Previous': function (browser) {
        let inputValue = '';
        browser.getAttribute(inputRun, 'value', function (result) {
            inputValue = result.value;
        });
        browser.click(buttonPrevious);
        browser.pause(PAUSE_TIME/10);
        browser.getAttribute(inputRun, 'value', function (result) {
            browser.assert.ok(Number(inputValue) > result.value, "Checks if Run number went down from :" + Number(inputValue) + " Got: " + result.value);
            inputValue = result.value;
        });
        browser.click(buttonApply);
        browser.waitForElementVisible(elementRunNumber, PAUSE_TIME);
        browser.assert.containsText(elementRunNumber, inputValue);
    },

    /**
     * Changes run number by clicking previous button, then changes it back by clicking next button
     * Checks if the run number in run details and input field went down(and up)
     */
    'Paginate Test Previous/Next': function (browser) {
        let inputValue = '';
        browser.getAttribute(inputRun, 'value', function (result) {
            inputValue = result.value;
        });
        browser.click(buttonPrevious);
        browser.pause(PAUSE_TIME/2);
        browser.getAttribute(inputRun, 'value', function (result) {
            browser.assert.ok(Number(inputValue) > result.value, "Checks if Run number went down");
            inputValue = result.value;
        });
        browser.click(buttonApply);
        browser.pause(PAUSE_TIME/2);
        browser.getText(elementRunNumber, result => {
            browser.assert.ok(result.value.includes(inputValue), "Check if controller button title contains " + inputValue);
        });
        browser.click(buttonNext);
        browser.click(buttonApply);
        browser.pause(PAUSE_TIME/2);
        browser.getAttribute(inputRun, 'value', function (result) {
            browser.assert.ok(Number(inputValue) <= result.value, "Checks if Run number went up");
        });
        browser.waitForElementVisible(elementRunNumber, PAUSE_TIME);
        browser.assert.containsText(elementRunNumber, inputValue);
    },

    /**
     * Changes run number by changing input value(First checks for valid run number by clicking previous button)
     * Checks if the run number in run details changed
     */
    'Paginate Test Input': function (browser) {
        let inputValue = '';
        browser.click(buttonPrevious);
        browser.click(buttonPrevious);//to get a correct run number for test
        browser.getAttribute(inputRun, 'value', function (result) {
            inputValue = result.value;
        });
        browser.click(buttonReset);//resets controller so we could see how input value is changing
        browser.clearValue(inputRun);
        browser.perform(function () {
            browser.setValue(inputRun, inputValue);
        });
        browser.click(buttonApply);
        browser.waitForElementVisible(elementRunNumber, PAUSE_TIME);
        browser.assert.containsText(elementRunNumber, inputValue);
    },

    /**
     * Changes sequence to preset value, clicks previous button to get a valid run number
     * Checks if sequence name changed in run details
     */
    'Change Sequence Test': function (browser) {
        browser.click(buttonSequence);
        browser.waitForElementPresentCustom(sequenceMenu, PAUSE_TIME, "controllerRunReport.elements.sequenceMenu");
        browser.waitForElementPresentCustom(sequenceItem + "//div[text()='" + sequence + "']", PAUSE_TIME, "controllerRunReport.elements.sequenceItem + //div containing text " + sequence);
        browser.click(sequenceItem + "//div[text()='" + sequence + "']");
        browser.waitForElementNotPresentCustom(sequenceMenu, PAUSE_TIME, "controllerRunReport.elements.sequenceMenu");
        browser.click(buttonPrevious);
        browser.click(buttonApply);
        browser.waitForElementVisible(sequenceName, PAUSE_TIME);
        browser.assert.containsText(sequenceName, sequence);
    },

    /**
     * Changes run value to invalid one
     * Checks if input value hasn't changed
     */
    'Run Invalid Test': function (browser) {
        let originalValue;
        browser.getAttribute(inputRun, 'value', (result)=>{
            originalValue = result.value;
        });
        browser.setValue(inputRun, 'aa');
        browser.perform(()=>{
            browser.assert.attributeEquals(inputRun, 'value', originalValue);
        });
    },
}