const PAUSE_TIME = 4000;
module.exports = {
    before: function (browser) {
        container = browser.globals.controller.elements.controllerContainer;
        controllerOpen = browser.globals.controller.elements.controllerOpen;
        buttonPrevious = container + browser.globals.controllerFillReport.buttons.previous;
        buttonNext = container + browser.globals.controllerFillReport.buttons.next;
        inputFill = container + browser.globals.controllerFillReport.inputs.fill;
        buttonApply = container + browser.globals.controller.buttons.apply;
        fillNumber = browser.globals.controllerFillReport.elements.fillNumber;
        invalidFill = container + browser.globals.controllerFillReport.elements.invalidFill;
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
            .url(browser.launchUrl + browser.globals.controllerFillReport.fillReport)
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
        browser.waitForElementPresentCustom(buttonPrevious, PAUSE_TIME, "controller.elements.controllerContainer + controllerFillReport.buttons.previous");
        browser.waitForElementPresentCustom(buttonNext, PAUSE_TIME, "controller.elements.controllerContainer + controllerFillReport.buttons.next");
        browser.waitForElementPresentCustom(buttonApply, PAUSE_TIME, "controller.elements.controllerContainer + controllerFillReport.buttons.apply");
        browser.waitForElementPresentCustom(inputFill, PAUSE_TIME, "controller.elements.controllerContainer + controllerFillReport.inputs.fill");
        browser.waitForElementPresentCustom(fillNumber, PAUSE_TIME, "controller.elements.controllerContainer + controllerFillReport.elements.fillNumber");
    },

    /**
     * Changes fill number by clicking previous button
     * Checks if fill number in fill details and input field went down by one
     */
    'Paginate Test Previous': function (browser) {
        let inputValue = '';
        browser.getAttribute(inputFill, 'value', function (result) {
            inputValue = result.value;
        });
        browser.click(buttonPrevious);
        browser.pause(PAUSE_TIME/2);
        browser.getAttribute(inputFill, 'value', function (result) {
            browser.assert.ok(Number(inputValue) - 1 == result.value, "Checks if fill number went down by one");
            inputValue = result.value;
        });
        browser.click(buttonApply);
        browser.pause(PAUSE_TIME/2);
        browser.getText(fillNumber, result => {
            browser.assert.ok(result.value.includes(inputValue), "Check if fill number is " + inputValue);
        });
    },

    /**
     * Changes fill number by clicking previous button, then changes it back by clicking next button
     * Checks if the fill number in fill details and input field went down(and up) by one
     */
    'Paginate Test Previous/Next': function (browser) {
        let inputValue = '';
        browser.getAttribute(inputFill, 'value', function (result) {
            inputValue = result.value;
        });
        browser.click(buttonPrevious);
        browser.pause(PAUSE_TIME/2);
        browser.getAttribute(inputFill, 'value', function (result) {
            browser.assert.ok(Number(inputValue) - 1 == result.value, "Checks if fill number went down by one");
            inputValue = result.value;
        });
        browser.click(buttonApply);
        browser.pause(PAUSE_TIME/2);
        browser.getText(fillNumber, result => {
            browser.assert.ok(result.value.includes(inputValue), "Check if controller button title contains " + inputValue);
        });
        browser.click(buttonNext);
        browser.pause(PAUSE_TIME/2);
        browser.getAttribute(inputFill, 'value', function (result) {
            browser.assert.ok(Number(inputValue) + 1 == result.value, "Checks if fill number went up by one");
            inputValue = result.value;
        });
        browser.click(buttonApply);
        browser.pause(PAUSE_TIME/2);
        browser.getText(fillNumber, result => {
            browser.assert.ok(result.value.includes(inputValue), "Check if controller button title contains " + inputValue);
        });
    },

    /**
     * Changes fill number by changing input value
     * Checks if the fill number in fill details changed
     */
    'Paginate Test Input': function (browser) {
        let inputValue = '';
        browser.getAttribute(inputFill, 'value', function (result) {
            inputValue = result.value;
        });
        browser.clearValue(inputFill);
        browser.perform(function () {
            browser.setValue(inputFill, inputValue - 2);
        });
        browser.click(buttonApply);
        browser.pause(PAUSE_TIME/2);
        browser.getText(fillNumber, result => {
            browser.assert.ok(result.value.includes(inputValue - 2), "Check if controller button title contains " + (inputValue - 10));
        });
    },

    /**
     * Sets invalid fill value
     * Checks if the value is still the same as before
     */
    'Fill Invalid Test': function(browser){
        let originalValue;
        browser.getAttribute(inputFill, 'value', function(result){
            originalValue = result.value;
        });
        browser.setValue(inputFill, 'aa');
        browser.perform(()=>{
            browser.assert.attributeEquals(inputFill, 'value', originalValue);
        });
    },
}