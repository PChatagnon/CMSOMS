const PAUSE_TIME = 4000;

module.exports = {
    before: function (browser) {
        about = browser.globals.appBar.elements.about;
        headerAbout = browser.globals.appBar.elements.headerAbout;
        buttonClose = browser.globals.appBar.buttons.close;
        buttonMenu = browser.globals.appBar.buttons.menu;
        menu = browser.globals.appBar.elements.menu;
        workspace = browser.globals.appBar.elements.workspace;
        folder = browser.globals.appBar.elements.folder;
        page = browser.globals.appBar.elements.page;
        folderDropdown = browser.globals.appBar.elements.folderDropdown;
        title = browser.globals.appBar.elements.title;
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
            .waitForElementVisible("//html[1]/body[1]", 1000)
            .pause(PAUSE_TIME)
    },

    'Check if loaded properly': function (browser) {
        browser.pause(PAUSE_TIME);
        browser.expect.element(browser.globals.portletComponent.elements.errorScreen).to.not.be.present;
    },

    /**
     * Opens appbar menu then sends ESCAPE key stroke to close it
     */
    'App Bar Test Open Close': function (browser) {
        browser.waitForElementPresentCustom(buttonMenu, PAUSE_TIME, "appBar.buttons.menu");
        browser.click(buttonMenu);
        browser.waitForElementPresentCustom(menu, PAUSE_TIME, "appBar.elements.menu");
        browser.sendKeys("/html[1]/body[1]", browser.Keys.ESCAPE);
        browser.waitForElementNotPresentCustom(menu, PAUSE_TIME, "appBar.elements.menu");
    },

    /**
     * Opens the second folder from the folder dropdown menu, then checks if the url changed.
     * Returns to index page by clicking on title - checks if the url changed back.
     */
    'App Bar Test Verify, Navigate': function (browser) {
        let indexUrl = ''
        browser.url(function (result) {
            indexUrl = result.value;
        });
        browser.click(folder);
        browser.waitForElementPresentCustom(folderDropdown + "/div[2]", PAUSE_TIME, "appBar.elements.folderDropdown");
        browser.click(folderDropdown + "/div[2]");
        browser.url(function (result) {
            browser.assert.notEqual(indexUrl, result.value);
        });
        browser.waitForElementPresentCustom(title, PAUSE_TIME, "appBar.elements.title");
        browser.click(title);
        browser.pause(PAUSE_TIME, () => {
            browser.url(function (result) {
                browser.assert.equal(result.value, indexUrl);
            });
        });
    },
};