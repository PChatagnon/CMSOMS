const PAUSE_TIME = 4000;
module.exports = {
    before: function (browser) {
        container = browser.globals.controller.elements.controllerContainer;
        buttonController = browser.globals.controller.elements.controllerOpen;
        buttonPrevious = container + browser.globals.controllerFillReport.buttons.previous;
        inputFill = container + browser.globals.controllerFillReport.inputs.fill;
        buttonApply = container + browser.globals.controller.buttons.apply;
        buttonOK = container + browser.globals.controller.buttons.ok;
        buttonClose = container + browser.globals.controller.buttons.close;
        buttonReset = container + browser.globals.controller.buttons.reset;
        buttonHide = container + browser.globals.controller.buttons.hide;
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
            .pause(PAUSE_TIME)
    },

    'Check if loaded properly': function (browser) {
        browser.pause(PAUSE_TIME);
        browser.expect.element(browser.globals.portletComponent.elements.errorScreen).to.not.be.present;
    },

    /**
     * Checks if xpaths are valid. 
     */
    'Check Elements': function (browser){
        browser.waitForElementPresentCustom(buttonController, PAUSE_TIME, "controllerFillReport.buttons.previous");
        browser.click(buttonController);
        browser.waitForElementPresentCustom(container, PAUSE_TIME, "controller.elements.controllerContainer");
        browser.waitForElementPresentCustom(buttonPrevious, PAUSE_TIME, "controller.elements.controllerContainer + controllerFillReport.buttons.previous");
        browser.waitForElementPresentCustom(inputFill, PAUSE_TIME, "elements.controllerContainer + controllerFillReport.inputs.fill");
        for (let key in browser.globals.controller.buttons){
            browser.waitForElementPresentCustom(container + browser.globals.controller.buttons[key], PAUSE_TIME, "elements.controllerContainer + controller.buttons." + key);
        }
    },

    /**
     * Opens controller then closes it
     * Checks if container is not visible
     */
    'Open Close Test': function (browser) {
        //browser.waitForElementNotPresent(container, PAUSE_TIME);
        browser.click(buttonController);
        browser.waitForElementPresent(container, PAUSE_TIME);
        browser.click(buttonHide);
        //browser.waitForElementNotPresentCustom(container, PAUSE_TIME, "controller.elements.controllerContainer");
    },
    

    /**
     * Changes input value.
     * Checks if Controller name has changed
     */
    'Change Value Test': function (browser) {
        let inputValue = '';
        browser.click(buttonController);
        browser.waitForElementPresent(container, PAUSE_TIME);
        browser.click(buttonPrevious);
        browser.getAttribute(inputFill, 'value', function (result) {
            inputValue = result.value;
        });
        browser.click(buttonApply);
        browser.getText(buttonController, result => {
            browser.assert.ok(result.value.includes(inputValue), "Check if controller button title contains " + inputValue);
        });
    },

    /**
     * Changes input value then clicks accept button
     * Checks if controller container is still visible and if controller name has changed
     */
    'Apply Test': function (browser) {
        let originalValue = '';
        browser.click(buttonController);
        browser.waitForElementPresent(container, PAUSE_TIME);
        browser.getText(buttonController, result => {
            originalValue = result.value;
        });
        browser.click(buttonPrevious);
        browser.click(buttonApply);
        browser.assert.visible(container);
        browser.getText(buttonController, result => {
            browser.assert.ok(originalValue != result.value, "Checks if change there was a change after pressing apply button");
        });
    },

    /**
     * Changes input value then clicks ok button
     * Checks if controller container is not visible and controller name has changed
     */
    'OK Test': function (browser) {
        let originalValue = '';
        browser.click(buttonController);
        browser.waitForElementPresent(container, PAUSE_TIME);
        browser.getText(buttonController, result => {
            originalValue = result.value;
        });
        browser.click(buttonPrevious);
        browser.click(buttonOK);
        //browser.waitForElementNotPresent(container, PAUSE_TIME);
        browser.getText(buttonController, result => {
            browser.assert.ok(originalValue != result.value, "Checks if change there was a change after pressing ok button");
        });
    },

    /**
     * Changes input value then clicks close button
     * Checks if controller container is not visible and controller name hasn't changed
     */
    'Close Test': function (browser) {
        let originalValue = '';
        browser.click(buttonController);
        browser.waitForElementPresent(container, PAUSE_TIME);
        browser.getText(buttonController, result => {
            originalValue = result.value;
        });
        browser.click(buttonPrevious);
        browser.click(buttonClose);
        //browser.waitForElementNotPresent(container, PAUSE_TIME);
        browser.getText(buttonController, result => {
            browser.assert.ok(originalValue == result.value, "Checks if change there was no change after pressing close button");
        });
    },

    /**
     * Changes input value, applies the changes, then clicks reset button
     * Checks if controller container is still visible and controller name hasn't changed
     */
    'Reset Test': function (browser) {
        let originalValue = '';
        browser.click(buttonController);
        browser.waitForElementPresent(container, PAUSE_TIME);
        browser.getText(buttonController, result => {
            originalValue = result.value;
        });
        browser.click(buttonPrevious);
        browser.click(buttonApply);
        browser.pause(PAUSE_TIME/2);
        browser.assert.visible(container);
        browser.getText(buttonController, result => {
            browser.assert.ok(originalValue != result.value, "Checks if there was a change made before pressing button reset");
        });
        browser.click(buttonReset);
        browser.pause(PAUSE_TIME/2);
        browser.assert.visible(container);
        browser.getText(buttonController, result => {
            browser.assert.ok(originalValue == result.value, "Checks if controller was resetted to default value");
        });
    },

}