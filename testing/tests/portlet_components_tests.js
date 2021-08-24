const PAUSE_TIME = 6000;
module.exports = {
    before: function (browser) {
        tableHeader = browser.globals.portletComponent.elements.tableHeader;
        footer = browser.globals.portletComponent.elements.footer;
        columnsMenu = browser.globals.portletComponent.elements.columnsMenu;
        datatable = browser.globals.portletComponent.elements.datatable;
        tableRow = browser.globals.portletComponent.elements.tableRow;
        loadingScreen = browser.globals.portletComponent.elements.loadingScreen;
        rowsMenu = browser.globals.portletComponent.elements.rowsMenu;
        minimize = browser.globals.portletComponent.buttons.minimize;
        maximize = browser.globals.portletComponent.buttons.maximize;
        tableConfig = browser.globals.portletComponent.buttons.tableConfig;
        columns = browser.globals.portletComponent.buttons.columns;
        buttonRows = footer + browser.globals.portletComponent.buttons.rows;
        firstPage = footer + browser.globals.portletComponent.buttons.firstPage;
        lastPage = footer + browser.globals.portletComponent.buttons.lastPage;
        previousPage = footer + browser.globals.portletComponent.buttons.previousPage;
        nextPage = footer + browser.globals.portletComponent.buttons.nextPage;
        inputPage = footer + browser.globals.portletComponent.inputs.page;
        inputPageNumber = footer + browser.globals.portletComponent.elements.pageNumber;
        refresh = browser.globals.portletComponent.buttons.refresh;
        info = browser.globals.portletComponent.buttons.info;
        infoMessage = browser.globals.portletComponent.elements.infoMessage;

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
            .url(browser.launchUrl + browser.globals.portletComponent.portletComponent)
            .waitForElementVisible("//html[1]/body[1]", PAUSE_TIME)
    },

    'Check if loaded properly': function (browser) {
        browser.pause(PAUSE_TIME);
        browser.expect.element(browser.globals.portletComponent.elements.errorScreen).to.not.be.present;
    },

    /**
     * Checks if element xpaths are valid(only the ones that are visible when nothing is clicked)
     */
    'Check elements': function (browser) {
        browser.waitForElementPresentCustom(tableHeader, PAUSE_TIME, "portletComponent.elements.tableHeader");
        browser.waitForElementPresentCustom(footer, PAUSE_TIME, "portletComponent.elements.footer");
        browser.waitForElementPresentCustom(datatable, PAUSE_TIME, "portletComponent.elements.datatable");
        browser.waitForElementPresentCustom(tableRow, PAUSE_TIME, "portletComponent.elements.tableConfig");
        browser.waitForElementPresentCustom(tableConfig, PAUSE_TIME, "portletComponent.buttons.tableConfig");
        browser.waitForElementPresentCustom(buttonRows, PAUSE_TIME, "portletComponent.elements.footer + portletComponent.buttons.rows");
        browser.waitForElementPresentCustom(firstPage, PAUSE_TIME, "portletComponent.elements.footer + portletComponent.buttons.firstPage");
        browser.waitForElementPresentCustom(lastPage, PAUSE_TIME, "portletComponent.elements.footer + portletComponent.buttons.lastPage");
        browser.waitForElementPresentCustom(previousPage, PAUSE_TIME, "portletComponent.elements.footer + portletComponent.buttons.previousPage");
        browser.waitForElementPresentCustom(nextPage, PAUSE_TIME, "portletComponent.elements.footer + portletComponent.buttons.nextPage");
        browser.waitForElementPresentCustom(inputPage, PAUSE_TIME, "portletComponent.elements.footer + portletComponent.inputs.page");
        browser.waitForElementPresentCustom(inputPageNumber, PAUSE_TIME, "portletComponent.elements.footer + portletComponent.elements.pageNumber");
        browser.waitForElementPresentCustom(refresh, PAUSE_TIME, "appBar.elements.title");
    },

    /**
     * Minimizes the portlet then maximizes it
     * Checks if table in portlet is not visibile and there visible after maximizing
     */
    'Minimize/Maximize Test': function (browser) {
        browser.waitForElementPresentCustom(minimize, PAUSE_TIME, "portletComponent.buttons.minimize");
        browser.click(minimize);
        browser.click(refresh);
        browser.waitForElementPresentCustom(maximize, PAUSE_TIME, "portletComponent.buttons.maximize (this will onky succeed if refresh button does not maximize portlet)");
        browser.click(maximize);
        browser.waitForElementNotPresent(maximize, PAUSE_TIME);
        },

    /**
     * Sorts column by ascending and descending order. Uses the preset columnIndex
     * Checks if elements in the column that is being sorted goes by ascending and then descendig order(order can be fliped)
     */
    'Sort by Column Test': function (browser) {
        let i = browser.globals.portletComponent.columnIndex;
        browser
            .waitForElementVisible(tableHeader, PAUSE_TIME)
            .click("(" + tableHeader + ")[" + i + "]")
            .waitForElementNotPresent(loadingScreen, PAUSE_TIME)
            .elements('xpath', tableRow, function (rows) {
                let descending = false;
                let value1, value2;
                browser.assert.ok(rows.value.length > 2, "Enough rows")
                let firstRow = "(" + tableRow + ")[2]//td[" + i + "]"
                let secondRow = "(" + tableRow + ")[3]//td[" + i + "]"
                browser.getText(firstRow, function (response) {
                    value1 = response.value;
                    browser.getText(secondRow, function (response) {
                        value2 = response.value;
                        if (value1 <= value2) {
                            descending = true;
                        }
                        let j = 0
                        if (descending) {
                            browser.perform(function () {
                                for (j = 2; j < rows.value.length - 1; j++) {
                                    xpath1 = "(" + tableRow + ")[" + (j) + "]//td[" + i + "]";
                                    xpath2 = "(" + tableRow + ")[" + (j + 1) + "]//td[" + i + "]";
                                    var value1, value2;
                                    browser.getText(xpath1, function (response1) {
                                        value1 = response1.value;
                                    })
                                    browser.getText(xpath2, function (response2) {
                                        value2 = response2.value;
                                        browser.assert.ok(value1 <= value2, value1 + " <= " + value2)
                                    })
                                }
                            })
                            browser.click("(" + tableHeader + ")[" + i + "]", function () {
                                for (j = 2; j < rows.value.length - 1; j++) {
                                    xpath1 = "(" + tableRow + ")[" + (j) + "]//td[" + i + "]";
                                    xpath2 = "(" + tableRow + ")[" + (j + 1) + "]//td[" + i + "]";
                                    var value1, value2;
                                    browser.getText(xpath1, function (response1) {
                                        value1 = response1.value;
                                    })
                                    browser.getText(xpath2, function (response2) {
                                        value2 = response2.value;
                                        browser.assert.ok(value1 >= value2, value1 + " >= " + value2)
                                    })
                                }
                            })
                        }
                        else {
                            browser.perform(function () {
                                for (j = 2; j < rows.value.length - 1; j++) {
                                    xpath1 = "(" + tableRow + ")[" + (j) + "]//td[" + i + "]";
                                    xpath2 = "(" + tableRow + ")[" + (j + 1) + "]//td[" + i + "]";
                                    let value1, value2;
                                    browser.getText(xpath1, function (response1) {
                                        value1 = response1.value;
                                    })
                                    browser.getText(xpath2, function (response2) {
                                        value2 = response2.value;
                                        browser.assert.ok(value1 >= value2, value1 + " >= " + value2)
                                    })
                                }
                            })
                        }
                    })
                })
            })
    },

    /**
     * Removes the column from the datatable. Uses preset column index
     * Checks if the column is gone, then if it is back
     */
    'Remove/Add Test': function (browser) {
        let i = browser.globals.portletComponent.columnIndex;
        browser.waitForElementPresent("(" + tableHeader + ")[" + i + "]", PAUSE_TIME);
        browser.getText("(" + tableHeader + ")[" + i + "]", function (result) {
            browser.waitForElementPresent(tableConfig, PAUSE_TIME);
            browser.waitForElementPresent(tableHeader + "/descendant-or-self::*[text()='" + result.value + "']", PAUSE_TIME)
            browser.click(tableConfig);
            browser.waitForElementPresentCustom(columns, PAUSE_TIME, "portletComponent.buttons.columns");
            browser.click(columns);
            browser.waitForElementPresentCustom(columnsMenu + "/descendant-or-self::*[text()='" + result.value + "']", PAUSE_TIME, "portletComponent.elements.columnsMenu containing text " + result.value);
            browser.click(columnsMenu + "//*[text()='" + result.value + "']");
            browser.waitForElementNotPresent(tableHeader + "/descendant-or-self::*[text()='" + result.value + "']", PAUSE_TIME);
            browser.click(columnsMenu + "//*[text()='" + result.value + "']");
            browser.waitForElementPresent(tableHeader + "/descendant-or-self::*[text()='" + result.value + "']", PAUSE_TIME);
        })
    },

    /**
     * Changes the rows per page value so there would be more pages to test on. 
     * Changes the page numbers using the buttons in the footer. First goes to next page, then previous, then last page and first page after that
     * Changes input value of page number dynamically according to how many pages there are
     * First checks if the previous and first page buttons are disabled. Then checks if the page numbers are valid according to button clicked
     */
    'Paginate Test': function (browser) {
        browser.waitForElementPresent(buttonRows, PAUSE_TIME);
        browser.click(buttonRows);
        browser.click("(" + rowsMenu + "//span)[1]");
        browser.waitForElementVisible("//table", PAUSE_TIME);
        browser.assert.elementPresent(firstPage + "/descendant-or-self::*[@disabled]", "Checks if First Page button is disabled");
        browser.assert.elementPresent(previousPage + "/descendant-or-self::*[@disabled]", "Checks if Previous Page button is disabled");
        browser.assert.elementNotPresent(nextPage + "/descendant-or-self::*[@disabled]", "Checks if Next Page button is not disabled");
        browser.assert.elementNotPresent(lastPage + "/descendant-or-self::*[@disabled]", "Checks if Last Page button is not disabled");
        let getCurrentPage = (str) => {
            str = str.toString();
            return (str.substring(str.indexOf(" ") + 1, str.indexOf(" of")));
        };
        let currentPage, numberOfPages, pageNumber = 0;
        browser.waitForElementNotPresent(rowsMenu, PAUSE_TIME);
        browser.getText(inputPageNumber, function (result) {
            numberOfPages = result.value.substring(result.value.lastIndexOf(" ") + 1);
            currentPage = getCurrentPage(result.value);
            browser.perform(()=>{
                browser.assert.ok(numberOfPages >= 2, "Checks if there are atleast two pages in table");
            });
        })
        browser.click(nextPage, function () {
            browser.waitForElementNotPresent(loadingScreen, PAUSE_TIME);
            browser.getText(inputPageNumber, function (result) {
                let page;
                page = getCurrentPage(result.value);
                browser.assert.ok((Number(currentPage) + 1) == page, "Checks if current page number went up by one. Expected :" + (Number(currentPage) + 1) + " Got : " + page );
                currentPage = page;
            });
        });
        browser.click(previousPage, function () {
            browser.waitForElementNotPresent(loadingScreen, PAUSE_TIME);
            browser.getText(inputPageNumber, function (result) {
                let page;
                page = getCurrentPage(result.value);
                browser.assert.ok((Number(currentPage) + -1) == page, "Checks if current page number went down by one");
                currentPage = page;
            })
        })
        browser.click(lastPage, function () {
            browser.waitForElementNotPresent(loadingScreen, PAUSE_TIME);
            browser.getText(inputPageNumber, function (result) {
                let page;
                page = getCurrentPage(result.value);
                browser.assert.ok(numberOfPages == page, "Checks if current page number went up to max");
                currentPage = page;
            })
        })
        browser.click(firstPage, function () {
            browser.waitForElementNotPresent(loadingScreen, PAUSE_TIME);
            browser.getText(inputPageNumber, function (result) {
                let page;
                page = getCurrentPage(result.value);
                browser.assert.ok(1 == page, "Checks if current page number is one");
                currentPage = page;
            })
        })
        browser.getText(inputPage, function (result) {
            numberOfPages = result.value.substring(result.value.lastIndexOf(" ") + 1);
            pageNumber = (Math.floor((Math.random() * (numberOfPages % 9)) + 1));
            browser.setValue(inputPageNumber, [pageNumber, browser.Keys.ENTER], function () {
                browser.waitForElementNotPresent(loadingScreen, PAUSE_TIME);
                browser.getText(inputPageNumber, function (result) {
                    let page;
                    page = getCurrentPage(result.value);
                    browser.assert.ok(pageNumber == page, "Checks if current page number is " + pageNumber);
                    currentPage = page;
                });
            });
        });
    },

    /**
     * Tests all possible rows per page values
     * If there are more page than one checks if there is exact number of rows in table(excluding the header and footer rows), else checks if there are no more rows in datatable than value of number of rows
     */
    'Check Size Tests': function (browser) {
        browser.waitForElementPresent(buttonRows, PAUSE_TIME);
        browser.click(buttonRows);
        let rowsPerPage;
        let numberOfElements = 0;
        browser.waitForElementPresentCustom(rowsMenu, PAUSE_TIME, "portletComponent.elements.rowsMenu")
        browser.elements('xpath', rowsMenu + "/*", function (elements) {
            numberOfElements = elements.value.length;
        });
        browser.perform(function () {
            var rowsPerPage, numberOfPages = 0;
            for (i = 1; i <= numberOfElements; i++) {
                browser.getText("(" + rowsMenu + "/*)[" + i + "]", function (result) {
                    rowsPerPage = result.value;
                });
                browser.click("((" + rowsMenu + "/*))[" + i + "]", function () {
                    browser.waitForElementNotPresent(loadingScreen, PAUSE_TIME, "Waits for a loading screen to hide");
                });
                browser.getText(inputPageNumber, function (result) {
                    numberOfPages = result.value.substring(result.value.lastIndexOf(" ") + 1);
                });
                browser.elements('xpath', tableRow, function (rows) {
                    if (numberOfPages > 1) {
                        browser.assert.ok(rowsPerPage == (rows.value.length - 2), "Checks if there is exactly " + rowsPerPage + " rows in the table, got " + (rows.value.length - 2));
                    }
                    else {
                        browser.assert.ok(rowsPerPage >= (rows.value.length - 2), "Checks if there are no more than " + rowsPerPage + " rows in the table, got " + (rows.value.length - 2));
                    }
                });
                browser.waitForElementNotPresent(rowsMenu, PAUSE_TIME);
                browser.click(buttonRows);
                browser.waitForElementPresent(rowsMenu, PAUSE_TIME);
            };
        });
    },

    /**
     * Clicks info button (that is much simpler than doing a mouseover in nightwatch)
     * Checks if info page is present
     */
    'Info Hover Check': function(browser) {
        browser.waitForElementPresentCustom(info, PAUSE_TIME, 'portletComponent.buttons.info');
        browser.click(info, ()=>{
            browser.waitForElementPresentCustom(infoMessage, PAUSE_TIME, 'portletComponent.elements.infoMessage');
        });
    },
}