const PAUSE_TIME = 6000;
module.exports = {
    before:function(browser){
        table = browser.globals.portletComponent.elements.datatableFilter;
        tableHeader = browser.globals.portletComponent.elements.tableHeaderFilter;
        tableRow = browser.globals.portletComponent.elements.tableRowFilter;
        footer = browser.globals.portletComponent.elements.footerFilter;
        inputFilter = footer + browser.globals.portletComponent.inputs.filter;
        loadingScreen = browser.globals.portletComponent.elements.loadingScreen;
        buttonTableConfig = footer + browser.globals.portletComponent.buttons.tableConfig;
        buttonFilter = footer + browser.globals.portletComponent.buttons.filter;
        filterMenu = browser.globals.portletComponent.elements.filterMenu;
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
            .url(browser.launchUrl + browser.globals.portletComponent.portletComponentFilter)
            .waitForElementVisible(tableHeader, PAUSE_TIME)
    },


    'Check elements': function (browser){
        browser.waitForElementPresentCustom(table, PAUSE_TIME, "portletComponent.elements.datatableFilter");
        browser.waitForElementPresentCustom(tableHeader, PAUSE_TIME, "portletComponent.elements.tableHeaderFilter");
        browser.waitForElementPresentCustom(tableRow, PAUSE_TIME, "portletComponent.elements.tableRowFilter");
        browser.waitForElementPresentCustom(footer, PAUSE_TIME, "portletComponent.elements.footerFilter");
        browser.waitForElementPresentCustom(buttonTableConfig, PAUSE_TIME, "portletComponent.elements.footerFilter + portletComponent.buttons.tableConfig");
    },

    /**
     * Uses separate xpaths than other tests in this suite!(xpaths are for fullscreen portlet)
     * Filters the columns which names are preset (could be multiple columns)
     * Collects all values from the columns which are being filtered
     * Filters columns by inputing the dynamically collected values
     * Checks if columns value is valid
     */
    'Filter Tests': function (browser) {
        let indexes, names, filterColumns;
        browser.elements('xpath', tableHeader, function (elements) {
            filterColumns = browser.globals.portletComponent.filterColumns;
            names = [];
            indexes = [];
            filterColumns.forEach(function (columnName) {
                for (let i = 1; i <= elements.value.length; i++) {
                    browser.getText(tableHeader + "[" + i + "]", function (result) {
                        if (result.value == columnName) {
                            indexes.push(i);
                        }
                    });
                }
            });
        });
        browser.perform(function () {
            indexes.forEach(function (index) {
                browser.elements('xpath', tableRow, function (elements) {
                    let temp = [];
                    for (let i = 2; i < elements.value.length-1; i++) {
                        browser.getText(tableRow + "[" + i + "]//td[" + index + "]", function (result) {
                            if (!temp.includes(result.value)) {
                                temp.push(result.value);
                            }
                        });
                    }
                    names.push(temp);
                });
            });
        });
        browser.waitForElementPresent(buttonTableConfig, PAUSE_TIME);
        browser.click(buttonTableConfig);
        browser.waitForElementPresentCustom(buttonFilter, PAUSE_TIME, "portletComponent.elements.footerFilter + portletComponent.buttons.filter");
        browser.perform(function () {
            names.forEach(function (filterNames, index) {
                browser.click(buttonFilter);
                browser.waitForElementPresentCustom(filterMenu, PAUSE_TIME, "portletComponent.elements.filterMenu");
                browser.click(filterMenu + "//*[contains(text(),'" + filterColumns[index] + "')]");
                browser.perform(function () {
                    browser.waitForElementPresentCustom(inputFilter, PAUSE_TIME, "portletComponent.elements.footerFilter + portletComponent.inputs.filter");
                    filterNames.forEach(function (filterName) {
                        browser.perform(function () {
                            for (let i = 0; i < filterName.length; i++) {
                                browser.sendKeys(inputFilter, filterName.charAt(i));
                                browser.pause(10);
                            }
                        });
                        browser.pause(PAUSE_TIME / 2);
                        browser.elements('xpath', tableRow, function (elements) {
                            browser.perform(function () {
                                for (let i = 2; i < elements.value.length-1; i++) {
                                    browser.getText(tableRow + "[" + i + "]//td[" + indexes[index] + "]", function (result) {
                                        browser.assert.ok(result.value.includes(filterName), "row " + i + " column" + indexes[index] + " includes text " + filterName);
                                    });
                                }
                            });
                        });
                        browser.clearValue(inputFilter);
                    });
                });
            });
        });
    },
}