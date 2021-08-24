const PAUSE_TIME = 4000;
/**
 * Reuses the same xpaths as appbar tests
 */
module.exports = {
    before: function (browser) {
        workspace = browser.globals.router.workspace;
        folder = browser.globals.router.folder;
        page = browser.globals.router.page;
        portlet1 = browser.globals.router.elements.portlet1;
        portlet2 = browser.globals.router.elements.portlet2;
        transition1 = browser.globals.router.transition1;
        transition2 = browser.globals.router.transition2;
        loadingScreen = browser.globals.router.elements.loadingScreen;
        buttonWorkspace = browser.globals.appBar.elements.workspace;
        buttonFolder = browser.globals.appBar.elements.folder;
        buttonPage = browser.globals.appBar.elements.page;
        menuWorkspace = browser.globals.appBar.elements.workspaceDropdown;
        menuFolder = browser.globals.appBar.elements.folderDropdown;
        menuPage = browser.globals.appBar.elements.pageDropdown;
        browser
            .useXpath() // every selector now must be xpath
            .resizeWindow(1280, 800);
    },

    after: function (browser) {
        browser
            .end();
    },

    beforeEach: function (browser){
        browser.pause(PAUSE_TIME);
    },

    /**
     * Checks the elements if the xpaths are still valid
     */
    'Check elements': function (browser) {
        browser.url(browser.launchUrl, ()=>{});
        browser.waitForElementPresentCustom(buttonWorkspace, PAUSE_TIME, 'appBar.elements.workspace');
        browser.waitForElementPresentCustom(buttonFolder, PAUSE_TIME, 'appBar.elements.folder');
        browser.waitForElementPresentCustom(buttonPage, PAUSE_TIME, 'appBar.elements.page');
    },

    'Check transition': function (browser) {
        browser.url(browser.launchUrl + browser.globals.router.transition1, ()=>{
            browser.waitForElementPresentCustom(portlet1, PAUSE_TIME, "router.elements.portlet1");
        });
        browser.pause(PAUSE_TIME/4);
        browser.url(browser.launchUrl + browser.globals.router.transition2, ()=>{
            browser.waitForElementPresentCustom(portlet2, PAUSE_TIME, "router.elements.portlet1");
        });
    },

    /**
     * Puts slash in url
     * Checks if gets redirected to the first page of the first folder of the first page. 
     * Also checks if other xpaths are valid(menus).
     */
    'Slash Redirect Test': function (browser) {
        let workspaceName, folderName, pageName = '';
        browser.perform(()=>{
            browser.url(browser.launchUrl + "/");
        });
        browser.pause(PAUSE_TIME/4);
        browser.waitForElementVisible(buttonWorkspace, PAUSE_TIME);
        browser.getText(buttonWorkspace, (result) => {
            workspaceName = result.value;
        });
        browser.getText(buttonPage, (result) => {
            pageName = result.value;
        });
        browser.getText(buttonFolder, (result) => {
            folderName = result.value;
        });
        browser.perform(() => {
            browser.click(buttonWorkspace);
            browser.waitForElementPresentCustom(menuWorkspace, PAUSE_TIME, "appBar.elements.workspaceDropdown");
            browser.assert.containsText("(" + menuWorkspace + "/div)[1]", workspaceName);
            browser.sendKeys("/html/body", browser.Keys.ESCAPE);
            browser.waitForElementNotPresent(menuWorkspace, PAUSE_TIME);
            browser.click(buttonFolder);
            browser.waitForElementPresentCustom(menuFolder, PAUSE_TIME, "appBar.elements.folderDropdown");
            browser.assert.containsText("(" + menuFolder + "/div)[1]", folderName);
            browser.sendKeys("/html/body", browser.Keys.ESCAPE);
            browser.waitForElementNotPresent(menuFolder, PAUSE_TIME);
            browser.click(buttonPage);
            browser.waitForElementPresentCustom(menuPage, PAUSE_TIME, "appBar.elements.pageDropdown");
            browser.assert.containsText("(" + menuPage + "/div)[1]", pageName);
            browser.sendKeys("/html/body", browser.Keys.ESCAPE);
            browser.waitForElementNotPresent(menuPage, PAUSE_TIME);
        });
    },

    /**
     * Navigates to folder using url.
     * Checks if got redirected to first page of that folder
     */
    'Folder Redirect Test': function (browser) {
        let pageName = '';
        browser.perform(()=>{
            browser.url(browser.launchUrl + workspace + folder);
        });
        browser.pause(PAUSE_TIME/4);
        browser.waitForElementVisible(buttonPage, PAUSE_TIME);
        browser.getText(buttonPage, (result) => {
            pageName = result.value;
        });
        browser.perform(() => {
            browser.click(buttonPage);
            browser.waitForElementVisible(menuPage, PAUSE_TIME);
            browser.assert.containsText("(" + menuPage + "/div)[1]", pageName);
        });
    },

    /**
     * Navigates to the workspace using url
     * Checks if got redirected to the first page of the first folder of that workspace
     */
    'Workspace Redirect Test': function (browser) {
        let pageName, folderName = '';
        browser.perform(()=>{
            browser.url(browser.launchUrl + workspace);
        });
        browser.pause(PAUSE_TIME/4);
        browser.waitForElementVisible(buttonPage, PAUSE_TIME);
        browser.getText(buttonPage, (result) => {
            pageName = result.value;
        });
        browser.getText(buttonFolder, (result) => {
            folderName = result.value;
        });
        browser.perform(() => {
            browser.click(buttonFolder);
            browser.waitForElementVisible(menuFolder, PAUSE_TIME);
            browser.assert.containsText("(" + menuFolder + "/div)[1]", folderName);
            browser.sendKeys("/html/body", browser.Keys.ESCAPE);
            browser.waitForElementNotPresent(menuWorkspace, PAUSE_TIME);
            browser.click(buttonPage);
            browser.waitForElementVisible(menuPage, PAUSE_TIME);
            browser.assert.containsText("(" + menuPage + "/div)[1]", pageName);
            browser.sendKeys("/html/body", browser.Keys.ESCAPE);
            browser.waitForElementNotPresent(menuPage, PAUSE_TIME);
        });
    },

    /**
     * Puts wrong page name to url
     * Checks if got redirected to the first page of the folder
     */
    'Wrong Page Test': function (browser) {
        let page = "/" + Math.random().toString(36).substring(2, 15) + 1;
        let pageName = '';
        browser.perform(()=>{
            browser.url(browser.launchUrl + workspace + folder + page);
        });
        browser.pause(PAUSE_TIME/4);
        browser.waitForElementVisible(buttonPage, PAUSE_TIME);
        browser.getText(buttonPage, (result) => {
            pageName = result.value;
        });
        browser.perform(() => {
            browser.click(buttonPage);
            browser.waitForElementVisible(menuPage, PAUSE_TIME);
            browser.assert.containsText("(" + menuPage + "/div)[1]", pageName);
        });
    },

    /**
     * Puts wrong folder name to url
     * Checks if got redirected to the first page of the first folder of workspace
     */
    'Wrong Folder Test': function (browser) {
        let folder = "/" + Math.random().toString(36).substring(2, 15) + 1;
        let pageName, folderName = '';
        browser.perform(()=>{
            browser.url(browser.launchUrl + workspace + folder + page);
        });
        browser.pause(PAUSE_TIME/4);
        browser.waitForElementVisible(buttonPage, PAUSE_TIME);
        browser.getText(buttonPage, (result) => {
            pageName = result.value;
        });
        browser.getText(buttonFolder, (result) => {
            folderName = result.value;
        });
        browser.perform(() => {
            browser.click(buttonFolder);
            browser.waitForElementVisible(menuFolder, PAUSE_TIME);
            browser.assert.containsText("(" + menuFolder + "/div)[1]", folderName);
            browser.sendKeys("/html/body", browser.Keys.ESCAPE);
            browser.waitForElementNotPresent(menuWorkspace, PAUSE_TIME);
            browser.click(buttonPage);
            browser.waitForElementVisible(menuPage, PAUSE_TIME);
            browser.assert.containsText("(" + menuPage + "/div)[1]", pageName);
            browser.sendKeys("/html/body", browser.Keys.ESCAPE);
            browser.waitForElementNotPresent(menuPage, PAUSE_TIME);
        });
    },

    /**
     * Puts wrong workspace name to url
     * Checks if got redirected to the first workspace
     */
    'Wrong Workspace Test': function (browser) {
        let workspace = "/" + Math.random().toString(36).substring(2, 15) + 1;
        browser.perform(()=>{
            browser.url(browser.launchUrl + workspace + folder + page);
        });
        browser.pause(PAUSE_TIME/4);
        let workspaceName, folderName, pageName = '';
        browser.waitForElementVisible(buttonWorkspace, PAUSE_TIME);
        browser.getText(buttonWorkspace, (result) => {
            workspaceName = result.value;
        });
        browser.getText(buttonPage, (result) => {
            pageName = result.value;
        });
        browser.getText(buttonFolder, (result) => {
            folderName = result.value;
        });
        browser.perform(() => {
            browser.click(buttonWorkspace);
            browser.waitForElementVisible(menuWorkspace, PAUSE_TIME);
            browser.assert.containsText("(" + menuWorkspace + "/div)[1]", workspaceName);
            browser.sendKeys("/html/body", browser.Keys.ESCAPE);
            browser.waitForElementNotPresent(menuWorkspace, PAUSE_TIME);
            browser.click(buttonFolder);
            browser.waitForElementVisible(menuFolder, PAUSE_TIME);
            browser.assert.containsText("(" + menuFolder + "/div)[1]", folderName);
            browser.sendKeys("/html/body", browser.Keys.ESCAPE);
            browser.waitForElementNotPresent(menuFolder, PAUSE_TIME);
            browser.click(buttonPage);
            browser.waitForElementVisible(menuPage, PAUSE_TIME);
            browser.assert.containsText("(" + menuPage + "/div)[1]", pageName);
            browser.sendKeys("/html/body", browser.Keys.ESCAPE);
            browser.waitForElementNotPresent(menuPage, PAUSE_TIME);
        });
    },
};