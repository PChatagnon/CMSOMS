const PAUSE_TIME = 4000;
module.exports = {
    before: function (browser) {
        fullscreen = browser.globals.fullScreen.elements.fullscreen;
        buttonOpen = browser.globals.fullScreen.buttons.open;
        buttonClose = browser.globals.fullScreen.buttons.close;
        buttonMenu = browser.globals.fullScreen.buttons.menu;
        menu = browser.globals.fullScreen.elements.menu;
        print = browser.globals.fullScreen.elements.print;
        refresh = browser.globals.fullScreen.elements.refresh;
        copy = browser.globals.fullScreen.elements.copy;
        copySuccessful = browser.globals.fullScreen.elements.copySuccessful;
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
            .url(browser.launchUrl)
            .waitForElementVisible("//html[1]/body[1]", PAUSE_TIME)
            .pause(PAUSE_TIME)
    },

    'Check if loaded properly': function (browser) {
        browser.pause(PAUSE_TIME);
        browser.expect.element(browser.globals.portletComponent.elements.errorScreen).to.not.be.present;
    },

    /**
     * Finds first portlet in the page that has fullscreen button clicks on it, then clicks close button
     * Checks if fullscreen mode is on or off according to the button clicks
     */
    'Full Screen Turn On/Turn Of': function (browser) {
        browser.waitForElementPresentCustom(buttonOpen, PAUSE_TIME, "fullScreen.buttons.open");
        browser.assert.elementNotPresent(fullscreen);
        browser.click(buttonOpen);
        browser.waitForElementPresentCustom(fullscreen, PAUSE_TIME, "fullScreen.elements.fullscreen");
        browser.waitForElementPresentCustom(buttonOpen, PAUSE_TIME, "fullScreen.buttons.close");
        browser.click(buttonClose);
        browser.waitForElementNotPresentCustom(fullscreen, PAUSE_TIME, "fullScreen.elements.fullscreen");
    },

    /**
     * Clicks refresh button
     * Checks if url hasn't changed
     */
    'Full Screen Refresh': function (browser) {
        browser.assert.elementNotPresent(fullscreen);
        browser.click(buttonOpen);
        browser.waitForElementVisible(fullscreen, PAUSE_TIME);
        let fullScreenUrl = '';
        browser.url(function (result) {
            fullScreenUrl = result.value;
        })
        browser.waitForElementPresentCustom(buttonMenu, PAUSE_TIME, "fullScreen.buttons.menu");
        browser.click(buttonMenu);
        browser.waitForElementPresentCustom(menu, PAUSE_TIME, "fullScreen.elements.menu");
        browser.waitForElementPresentCustom(refresh, PAUSE_TIME, "fullScreen.elements.refresh");
        browser.click(refresh);
        browser.waitForElementVisible(fullscreen, PAUSE_TIME);
        browser.url(function (result) {
            browser.assert.equal(fullScreenUrl, result.value);
        });
    },

    /**
     * Temporary rewrites window.print method
     * Clicks print button
     * Checks if method window.print is called
     
    'Full Screen Print': function (browser) {
        let oldPrintFunction;
        browser.assert.elementNotPresent(fullscreen);
        browser.click(buttonOpen);
        browser.waitForElementVisible(fullscreen, PAUSE_TIME);
        browser.execute(function () {
            oldPrintFunction = window.print;
            window.print = function () {
                window.alert("Printed");
            };
        }, []);
        browser.click(buttonMenu);
        browser.waitForElementVisible(menu, PAUSE_TIME);
        browser.click(print);
        browser.getAlertText(function (result) {
            browser.assert.equal(result.value, "Printed");
        })
        browser.acceptAlert();
        browser.execute(function () {
            window.print = oldPrintFunction;
        }, []);
    },
    */

    /**
     * Clicks copy button
     * Checks if copy successful message is shown
     */
    'Full Screen Copy Url': function (browser) {
        browser.assert.elementNotPresent(fullscreen);
        browser.click(buttonOpen);
        browser.waitForElementVisible(fullscreen, PAUSE_TIME);
        browser.click(buttonMenu);
        browser.waitForElementVisible(menu, PAUSE_TIME);
        browser.click(copy, function () {
            browser.assert.elementPresent(copySuccessful)
        });
    },
}