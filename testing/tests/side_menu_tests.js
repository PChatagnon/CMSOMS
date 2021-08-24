const PAUSE_TIME = 6000;

module.exports = {
    before: function (browser) {
        buttonOpen = browser.globals.sideMenu.buttons.open;
        buttonClose = browser.globals.sideMenu.elements.close;
        folder = browser.globals.sideMenu.elements.folder;
        page = browser.globals.sideMenu.elements.page;
        currentPage = browser.globals.sideMenu.elements.currentPage;
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
    },

    'Check if loaded properly': function (browser) {
        browser.pause(PAUSE_TIME);
        browser.expect.element(browser.globals.portletComponent.elements.errorScreen).to.not.be.present;
    },

    /**
     * Opens side menu then closes it
     * Checks if side menu appears and dissapears accordingly
     */
    'Side Menu Test Open Close': function (browser) {
        browser.waitForElementPresentCustom(buttonOpen, PAUSE_TIME, "sideMenu.buttons.open");
        browser.click(buttonOpen);
        browser.waitForElementPresentCustom(buttonClose, PAUSE_TIME, "sideMenu.elements.close");
        browser.click(buttonClose);
        browser.waitForElementNotPresentCustom(buttonClose, PAUSE_TIME, "sideMenu.elements.close");
    },

    /**
     * Navigates to page in the side menu
     * Checks if the current page is valid
     
    'Side Menu Test Open Folder': function (browser) {   
        browser.click(buttonOpen);
        browser.waitForElementVisible(buttonClose, PAUSE_TIME);
        browser.waitForElementPresentCustom(folder, PAUSE_TIME, "sideMenu.elements.folder");
        browser.click(folder);
        browser.waitForElementPresentCustom(page, PAUSE_TIME, "sideMenu.elements.page");
        browser.getText(page, function (result) {
            browser.click(browser.globals.sideMenu.elements.page)
            browser.pause(PAUSE_TIME)
            browser.waitForElementNotPresent(page, PAUSE_TIME);
            browser.waitForElementPresentCustom(currentPage + "//div[contains(text(),'" + result.value + "')]", PAUSE_TIME, "sideMenu.elements.currentPage + div containing text" + result.value);
        });
    },

    */

}